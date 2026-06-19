import { eq } from "drizzle-orm";

import { getDb } from "../db/connection";
import { getWager } from "../api/wager";
import { enqueueMutation } from "../api/sync";
import {
  createDefaultHlc,
  type JsonObject,
  type Uuid,
  type Wager,
  wagers,
} from "../db/schema";

export type WeatherOracleConfig = {
  city: string;
  condition?: string;
  targetDate: string;
};

export type WeatherOracleResult = {
  temperature?: number;
  condition?: string;
  observedAt?: string;
};

export type CryptoOracleConfig = {
  symbol: string;
  targetPrice: number;
  comparison: "above" | "below";
};

export type CryptoOracleResult = {
  price: number;
  observedAt?: string;
};

export type OracleValidationOutcome = {
  valid: boolean;
  winningOptionId?: Uuid;
  hit?: boolean;
  error?: string;
};

export class OracleValidationError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "OracleValidationError";
    this.cause = cause;
  }
}

const toOracleValidationError = (
  message: string,
  error: unknown,
): OracleValidationError => {
  if (error instanceof OracleValidationError) {
    return error;
  }

  return new OracleValidationError(message, error);
};

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasStringProperty = (
  value: JsonObject,
  key: string,
): value is JsonObject & Record<typeof key, string> =>
  typeof value[key] === "string" && (value[key] as string).length > 0;

const hasNumberProperty = (
  value: JsonObject,
  key: string,
): value is JsonObject & Record<typeof key, number> =>
  typeof value[key] === "number" && !Number.isNaN(value[key]);

const parseWeatherConfig = (config: JsonObject | null | undefined): WeatherOracleConfig => {
  if (!isJsonObject(config)) {
    throw new OracleValidationError("Weather oracle config must be an object.");
  }

  if (!hasStringProperty(config, "city")) {
    throw new OracleValidationError("Weather oracle config requires a city.");
  }

  if (!hasStringProperty(config, "targetDate")) {
    throw new OracleValidationError("Weather oracle config requires a targetDate.");
  }

  const parsed = new Date(config.targetDate);

  if (Number.isNaN(parsed.getTime())) {
    throw new OracleValidationError("Weather oracle targetDate must be a valid ISO timestamp.");
  }

  return {
    city: config.city,
    condition: typeof config.condition === "string" ? config.condition : undefined,
    targetDate: config.targetDate,
  };
};

const parseWeatherResult = (
  result: JsonObject | null | undefined,
): WeatherOracleResult => {
  if (!isJsonObject(result)) {
    throw new OracleValidationError("Weather oracle result must be an object.");
  }

  if (!hasNumberProperty(result, "temperature")) {
    throw new OracleValidationError("Weather oracle result requires a temperature.");
  }

  return {
    temperature: result.temperature,
    condition: typeof result.condition === "string" ? result.condition : undefined,
    observedAt: typeof result.observedAt === "string" ? result.observedAt : undefined,
  };
};

const parseCryptoConfig = (config: JsonObject | null | undefined): CryptoOracleConfig => {
  if (!isJsonObject(config)) {
    throw new OracleValidationError("Crypto oracle config must be an object.");
  }

  if (!hasStringProperty(config, "symbol")) {
    throw new OracleValidationError("Crypto oracle config requires a symbol.");
  }

  if (!hasNumberProperty(config, "targetPrice")) {
    throw new OracleValidationError("Crypto oracle config requires a targetPrice.");
  }

  if (config.comparison !== "above" && config.comparison !== "below") {
    throw new OracleValidationError("Crypto oracle comparison must be 'above' or 'below'.");
  }

  return {
    symbol: config.symbol,
    targetPrice: config.targetPrice,
    comparison: config.comparison,
  };
};

const parseCryptoResult = (result: JsonObject | null | undefined): CryptoOracleResult => {
  if (!isJsonObject(result)) {
    throw new OracleValidationError("Crypto oracle result must be an object.");
  }

  if (!hasNumberProperty(result, "price")) {
    throw new OracleValidationError("Crypto oracle result requires a price.");
  }

  return {
    price: result.price,
    observedAt: typeof result.observedAt === "string" ? result.observedAt : undefined,
  };
};

export const validateWeatherWager = (
  wager: Wager,
): OracleValidationOutcome => {
  try {
    if (wager.oracleType !== "weather") {
      throw new OracleValidationError("Wager is not a weather oracle wager.");
    }

    parseWeatherConfig(wager.oracleConfig);

    if (!wager.oracleResult) {
      return { valid: false, error: "Weather oracle result is not yet available." };
    }

    parseWeatherResult(wager.oracleResult);

    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weather wager validation failed.";
    return { valid: false, error: message };
  }
};

export const validateCryptoWager = (
  wager: Wager,
): OracleValidationOutcome => {
  try {
    if (wager.oracleType !== "crypto") {
      throw new OracleValidationError("Wager is not a crypto oracle wager.");
    }

    parseCryptoConfig(wager.oracleConfig);

    if (!wager.oracleResult) {
      return { valid: false, error: "Crypto oracle result is not yet available." };
    }

    const result = parseCryptoResult(wager.oracleResult);
    const config = parseCryptoConfig(wager.oracleConfig);

    const hit =
      config.comparison === "above"
        ? result.price >= config.targetPrice
        : result.price <= config.targetPrice;

    return { valid: true, hit };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Crypto wager validation failed.";
    return { valid: false, error: message };
  }
};

export const setOracleResult = async (
  wagerId: Uuid,
  result: JsonObject,
  deviceId: string,
): Promise<Wager> => {
  try {
    const existing = await getWager(wagerId);

    if (!existing) {
      throw new OracleValidationError("Wager not found.");
    }

    if (existing.oracleType === "manual") {
      throw new OracleValidationError("Manual wagers do not use oracle results.");
    }

    const db = await getDb();
    const hlc = createDefaultHlc();
    const timestamp = new Date().toISOString();

    const updated = await db
      .update(wagers)
      .set({
        oracleResult: result,
        oracleStatus: "validated",
        updatedAt: timestamp,
        hlc,
        lastModifiedByDeviceId: deviceId,
      })
      .where(eq(wagers.id, wagerId))
      .returning();

    const wager = updated[0];

    if (!wager) {
      throw new OracleValidationError("Oracle result update failed.");
    }

    await enqueueMutation({
      tableName: "wagers",
      recordId: wager.id,
      operation: "update",
      payload: {
        id: wager.id,
        partyId: wager.partyId,
        createdByUserId: wager.createdByUserId,
        question: wager.question,
        stakePlates: wager.stakePlates,
        deadline: wager.deadline,
        status: wager.status,
        winningOptionId: wager.winningOptionId,
        realMoneyAmountCents: wager.realMoneyAmountCents,
        oracleType: wager.oracleType,
        oracleConfig: wager.oracleConfig,
        oracleStatus: wager.oracleStatus,
        oracleResult: wager.oracleResult,
        naPolicy: wager.naPolicy,
        naPenaltyPlates: wager.naPenaltyPlates,
        resolutionKind: wager.resolutionKind,
        resolutionNote: wager.resolutionNote,
        lockedAt: wager.lockedAt,
        resolvedAt: wager.resolvedAt,
        createdAt: wager.createdAt,
        updatedAt: wager.updatedAt,
        deletedAt: wager.deletedAt,
        hlc: wager.hlc,
        lastModifiedByDeviceId: wager.lastModifiedByDeviceId,
      },
      deviceId,
      baseHlc: existing.hlc,
      hlc,
    });

    return wager;
  } catch (error) {
    throw toOracleValidationError("Failed to set oracle result.", error);
  }
};
