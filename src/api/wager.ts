import { and, asc, desc, eq, inArray, isNull, lte } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  createDefaultHlc,
  createUuid,
  type JsonObject,
  type NaPolicy,
  type NewWager,
  type OracleType,
  type Uuid,
  wagers,
  type Wager,
  wagerOptions,
  type WagerOption,
} from "../db/schema";
import { getMembership } from "./party";
import { enqueueMutation } from "./sync";

export type WagerOptionInput = {
  id?: Uuid;
  label: string;
};

export type CreateWagerInput = {
  partyId: Uuid;
  createdByUserId: Uuid;
  deviceId: string;
  question: string;
  options: readonly WagerOptionInput[];
  stakePlates: number;
  deadline: string;
  realMoneyAmountCents?: number | null;
  oracleType?: OracleType;
  oracleConfig?: JsonObject | null;
  naPolicy?: NaPolicy;
  naPenaltyPlates?: number;
};

export type ResolveWagerInput = {
  wagerId: Uuid;
  winningOptionId: Uuid;
  resolvedByUserId: Uuid;
  deviceId: string;
  resolutionNote?: string | null;
};

export type VoidWagerInput = {
  wagerId: Uuid;
  deviceId: string;
  reason: string;
};

export type WagerWithOptions = {
  wager: Wager;
  options: WagerOption[];
};

type WagerPermissionRow = {
  role: "host" | "member";
  next_wager_picker_user_id: string | null;
};

const wagerSelectColumns = `
  id,
  party_id as partyId,
  created_by_user_id as createdByUserId,
  question,
  stake_plates as stakePlates,
  deadline,
  status,
  winning_option_id as winningOptionId,
  real_money_amount_cents as realMoneyAmountCents,
  oracle_type as oracleType,
  oracle_config as oracleConfig,
  oracle_status as oracleStatus,
  oracle_result as oracleResult,
  na_policy as naPolicy,
  na_penalty_plates as naPenaltyPlates,
  resolution_kind as resolutionKind,
  resolution_note as resolutionNote,
  locked_at as lockedAt,
  resolved_at as resolvedAt,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  hlc,
  last_modified_by_device_id as lastModifiedByDeviceId
`;

const optionSelectColumns = `
  id,
  wager_id as wagerId,
  label,
  sort_order as sortOrder,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  hlc,
  last_modified_by_device_id as lastModifiedByDeviceId
`;

export class WagerApiError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "WagerApiError";
    this.cause = cause;
  }
}

const toWagerApiError = (message: string, error: unknown): WagerApiError => {
  if (error instanceof WagerApiError) {
    return error;
  }

  return new WagerApiError(message, error);
};

const now = (): string => new Date().toISOString();

const assertPositiveInteger = (value: number, label: string): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new WagerApiError(`${label} must be a positive integer.`);
  }
};

const sanitizeQuestion = (question: string): string => {
  const trimmed = question.trim();

  if (trimmed.length < 6) {
    throw new WagerApiError("Wager question must be at least 6 characters.");
  }

  return trimmed;
};

const sanitizeOptions = (
  options: readonly WagerOptionInput[],
): Array<{ id: Uuid; label: string; sortOrder: number }> => {
  if (options.length < 2 || options.length > 6) {
    throw new WagerApiError("Wagers require between 2 and 6 options.");
  }

  const labels = new Set<string>();

  return options.map((option, index) => {
    const label = option.label.trim();

    if (label.length === 0) {
      throw new WagerApiError("Wager option labels are required.");
    }

    const normalized = label.toLowerCase();

    if (labels.has(normalized)) {
      throw new WagerApiError("Wager option labels must be unique.");
    }

    labels.add(normalized);

    return {
      id: option.id ?? createUuid(),
      label,
      sortOrder: index,
    };
  });
};

const assertDeadlineInFuture = (deadline: string): void => {
  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    throw new WagerApiError("Wager deadline must be a valid ISO timestamp.");
  }

  if (date.getTime() <= Date.now()) {
    throw new WagerApiError("Wager deadline must be in the future.");
  }
};

const assertNonnegativeInteger = (value: number, label: string): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new WagerApiError(`${label} must be a nonnegative integer.`);
  }
};

const wagerToPayload = (wager: Wager): JsonObject => ({
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
});

const optionToPayload = (option: WagerOption): JsonObject => ({
  id: option.id,
  wagerId: option.wagerId,
  label: option.label,
  sortOrder: option.sortOrder,
  createdAt: option.createdAt,
  updatedAt: option.updatedAt,
  deletedAt: option.deletedAt,
  hlc: option.hlc,
  lastModifiedByDeviceId: option.lastModifiedByDeviceId,
});

const assertCanCreateWager = async (
  partyId: Uuid,
  userId: Uuid,
): Promise<void> => {
  try {
    const database = await openSQLiteDatabase();
    const row = await database.getFirstAsync<WagerPermissionRow>(
      `select pm.role, p.next_wager_picker_user_id
       from party_members pm
       join parties p on p.id = pm.party_id
       where pm.party_id = ?
         and pm.user_id = ?
         and pm.deleted_at is null
         and pm.left_at is null
         and p.deleted_at is null
       limit 1`,
      [partyId, userId],
    );

    if (!row) {
      throw new WagerApiError("Only party members can create wagers.");
    }

    if (row.role !== "host" && row.next_wager_picker_user_id !== userId) {
      throw new WagerApiError("Only a host or the selected winner can create this wager.");
    }
  } catch (error) {
    throw toWagerApiError("Failed to validate wager creator permissions.", error);
  }
};

export const validateWagerDraft = (input: CreateWagerInput): void => {
  sanitizeQuestion(input.question);
  sanitizeOptions(input.options);
  assertPositiveInteger(input.stakePlates, "stakePlates");
  assertDeadlineInFuture(input.deadline);

  if (input.realMoneyAmountCents !== undefined && input.realMoneyAmountCents !== null) {
    assertNonnegativeInteger(input.realMoneyAmountCents, "realMoneyAmountCents");
  }

  if (input.naPenaltyPlates !== undefined) {
    assertNonnegativeInteger(input.naPenaltyPlates, "naPenaltyPlates");
  }
};

export const createWager = async (
  input: CreateWagerInput,
): Promise<WagerWithOptions> => {
  try {
    validateWagerDraft(input);
    await assertCanCreateWager(input.partyId, input.createdByUserId);

    const database = await openSQLiteDatabase();
    const wagerId = createUuid();
    const timestamp = now();
    const wagerHlc = createDefaultHlc();
    const sanitizedOptions = sanitizeOptions(input.options);
    const question = sanitizeQuestion(input.question);
    const oracleType = input.oracleType ?? "manual";
    const oracleStatus = oracleType === "manual" ? "not_required" : "pending";
    const naPolicy = input.naPolicy ?? "refund";
    const naPenaltyPlates = input.naPenaltyPlates ?? 0;
    let wager: Wager | null = null;
    const options: WagerOption[] = [];

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        const existingActive = await transaction.getFirstAsync<{ id: string }>(
          `select id
           from wagers
           where party_id = ?
             and status in ('open', 'locked')
             and deleted_at is null
           limit 1`,
          input.partyId,
        );

        if (existingActive) {
          throw new WagerApiError("This party already has an active wager.");
        }

        await transaction.runAsync(
          `insert into wagers (
            id,
            party_id,
            created_by_user_id,
            question,
            stake_plates,
            deadline,
            status,
            real_money_amount_cents,
            oracle_type,
            oracle_config,
            oracle_status,
            na_policy,
            na_penalty_plates,
            created_at,
            updated_at,
            hlc,
            last_modified_by_device_id
          ) values (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            wagerId,
            input.partyId,
            input.createdByUserId,
            question,
            input.stakePlates,
            input.deadline,
            input.realMoneyAmountCents ?? null,
            oracleType,
            input.oracleConfig ? JSON.stringify(input.oracleConfig) : null,
            oracleStatus,
            naPolicy,
            naPenaltyPlates,
            timestamp,
            timestamp,
            wagerHlc,
            input.deviceId,
          ],
        );

        wager = await transaction.getFirstAsync<Wager>(
          `select ${wagerSelectColumns} from wagers where id = ?`,
          wagerId,
        );

        if (!wager) {
          throw new WagerApiError("Wager insert succeeded but could not be read.");
        }

        await enqueueMutation(
          {
            tableName: "wagers",
            recordId: wagerId,
            operation: "insert",
            payload: wagerToPayload(wager),
            deviceId: input.deviceId,
            hlc: wagerHlc,
          },
          transaction,
        );

        for (const option of sanitizedOptions) {
          const optionHlc = createDefaultHlc();

          await transaction.runAsync(
            `insert into wager_options (
              id,
              wager_id,
              label,
              sort_order,
              created_at,
              updated_at,
              hlc,
              last_modified_by_device_id
            ) values (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              option.id,
              wagerId,
              option.label,
              option.sortOrder,
              timestamp,
              timestamp,
              optionHlc,
              input.deviceId,
            ],
          );

          const insertedOption = await transaction.getFirstAsync<WagerOption>(
            `select ${optionSelectColumns} from wager_options where id = ?`,
            option.id,
          );

          if (!insertedOption) {
            throw new WagerApiError("Wager option insert succeeded but could not be read.");
          }

          options.push(insertedOption);

          await enqueueMutation(
            {
              tableName: "wager_options",
              recordId: option.id,
              operation: "insert",
              payload: optionToPayload(insertedOption),
              deviceId: input.deviceId,
              hlc: optionHlc,
            },
            transaction,
          );
        }

        await transaction.runAsync(
          "update parties set next_wager_picker_user_id = null, updated_at = ?, hlc = ? where id = ?",
          [timestamp, createDefaultHlc(), input.partyId],
        );
      } catch (error) {
        throw toWagerApiError("Failed during wager creation transaction.", error);
      }
    });

    if (!wager) {
      throw new WagerApiError("Wager creation did not return a wager.");
    }

    return { wager, options };
  } catch (error) {
    throw toWagerApiError("Failed to create wager.", error);
  }
};

export const getWager = async (wagerId: Uuid): Promise<Wager | null> => {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(wagers)
      .where(and(eq(wagers.id, wagerId), isNull(wagers.deletedAt)))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    throw toWagerApiError("Failed to read wager.", error);
  }
};

export const getWagerOptions = async (
  wagerId: Uuid,
): Promise<WagerOption[]> => {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(wagerOptions)
      .where(and(eq(wagerOptions.wagerId, wagerId), isNull(wagerOptions.deletedAt)))
      .orderBy(asc(wagerOptions.sortOrder));
  } catch (error) {
    throw toWagerApiError("Failed to read wager options.", error);
  }
};

export const getWagerWithOptions = async (
  wagerId: Uuid,
): Promise<WagerWithOptions | null> => {
  try {
    const wager = await getWager(wagerId);

    if (!wager) {
      return null;
    }

    const options = await getWagerOptions(wagerId);
    return { wager, options };
  } catch (error) {
    throw toWagerApiError("Failed to read wager with options.", error);
  }
};

export const getActiveWagerForParty = async (
  partyId: Uuid,
): Promise<WagerWithOptions | null> => {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(wagers)
      .where(
        and(
          eq(wagers.partyId, partyId),
          inArray(wagers.status, ["open", "locked"]),
          isNull(wagers.deletedAt),
        ),
      )
      .orderBy(desc(wagers.createdAt))
      .limit(1);

    if (!rows[0]) {
      return null;
    }

    const options = await getWagerOptions(rows[0].id);
    return { wager: rows[0], options };
  } catch (error) {
    throw toWagerApiError("Failed to read active party wager.", error);
  }
};

export const listWagersForParty = async (
  partyId: Uuid,
  limit = 50,
): Promise<Wager[]> => {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(wagers)
      .where(and(eq(wagers.partyId, partyId), isNull(wagers.deletedAt)))
      .orderBy(desc(wagers.createdAt))
      .limit(limit);
  } catch (error) {
    throw toWagerApiError("Failed to list party wagers.", error);
  }
};

export const validateWager = async (wagerId: Uuid): Promise<WagerWithOptions> => {
  try {
    const result = await getWagerWithOptions(wagerId);

    if (!result) {
      throw new WagerApiError("Wager not found.");
    }

    if (result.options.length < 2 || result.options.length > 6) {
      throw new WagerApiError("Wager has an invalid number of options.");
    }

    assertPositiveInteger(result.wager.stakePlates, "stakePlates");

    if (result.wager.oracleType !== "manual" && !result.wager.oracleConfig) {
      throw new WagerApiError("Oracle-backed wagers require oracle configuration.");
    }

    return result;
  } catch (error) {
    throw toWagerApiError("Failed to validate wager.", error);
  }
};

export const lockExpiredOpenWagers = async (
  deviceId: string,
): Promise<Wager[]> => {
  try {
    const db = await getDb();
    const timestamp = now();
    const expired = await db
      .update(wagers)
      .set({
        status: "locked",
        lockedAt: timestamp,
        updatedAt: timestamp,
        hlc: createDefaultHlc(),
        lastModifiedByDeviceId: deviceId,
      })
      .where(
        and(
          eq(wagers.status, "open"),
          isNull(wagers.deletedAt),
          lte(wagers.deadline, timestamp),
        ),
      )
      .returning();

    for (const wager of expired) {
      await enqueueMutation({
        tableName: "wagers",
        recordId: wager.id,
        operation: "update",
        payload: wagerToPayload(wager),
        deviceId,
        hlc: wager.hlc,
      });
    }

    return expired;
  } catch (error) {
    throw toWagerApiError("Failed to lock expired open wagers.", error);
  }
};

export const resolveWager = async (
  input: ResolveWagerInput,
): Promise<Wager> => {
  try {
    const wager = await getWager(input.wagerId);

    if (!wager) {
      throw new WagerApiError("Wager not found.");
    }

    const membership = await getMembership(wager.partyId, input.resolvedByUserId);

    if (!membership || membership.role !== "host") {
      throw new WagerApiError("Only a host can resolve a wager.");
    }

    const options = await getWagerOptions(wager.id);
    const isValidOption = options.some((option) => option.id === input.winningOptionId);

    if (!isValidOption) {
      throw new WagerApiError("Winning option does not belong to this wager.");
    }

    const timestamp = now();
    const hlc = createDefaultHlc();
    const db = await getDb();
    const updated = await db
      .update(wagers)
      .set({
        status: "resolved",
        winningOptionId: input.winningOptionId,
        resolutionKind: wager.oracleType === "manual" ? "manual" : "oracle",
        resolutionNote: input.resolutionNote ?? null,
        resolvedAt: timestamp,
        updatedAt: timestamp,
        hlc,
        lastModifiedByDeviceId: input.deviceId,
      })
      .where(eq(wagers.id, input.wagerId))
      .returning();

    const resolved = updated[0];

    if (!resolved) {
      throw new WagerApiError("Wager resolution failed.");
    }

    await enqueueMutation({
      tableName: "wagers",
      recordId: resolved.id,
      operation: "update",
      payload: wagerToPayload(resolved),
      deviceId: input.deviceId,
      baseHlc: wager.hlc,
      hlc,
    });

    return resolved;
  } catch (error) {
    throw toWagerApiError("Failed to resolve wager.", error);
  }
};

export const voidWager = async (input: VoidWagerInput): Promise<Wager> => {
  try {
    const existing = await getWager(input.wagerId);

    if (!existing) {
      throw new WagerApiError("Wager not found.");
    }

    const timestamp = now();
    const hlc = createDefaultHlc();
    const patch: Partial<NewWager> = {
      status: "void",
      resolutionKind: "na",
      resolutionNote: input.reason.trim(),
      resolvedAt: timestamp,
      updatedAt: timestamp,
      hlc,
      lastModifiedByDeviceId: input.deviceId,
    };

    const db = await getDb();
    const updated = await db
      .update(wagers)
      .set(patch)
      .where(eq(wagers.id, input.wagerId))
      .returning();

    const wager = updated[0];

    if (!wager) {
      throw new WagerApiError("Voiding wager failed.");
    }

    await enqueueMutation({
      tableName: "wagers",
      recordId: wager.id,
      operation: "update",
      payload: wagerToPayload(wager),
      deviceId: input.deviceId,
      baseHlc: existing.hlc,
      hlc,
    });

    return wager;
  } catch (error) {
    throw toWagerApiError("Failed to void wager.", error);
  }
};
