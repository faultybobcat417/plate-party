import type { Session } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import { z } from "zod";

import { UnauthorizedError, PlatePartyError, ValidationError } from "../lib/errors";
import { supabase } from "../lib/supabase";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

type ErrorPayload = {
  error?: unknown;
  message?: unknown;
};

export const IdempotencyKeySchema = z.string().uuid().optional();

export async function getRequiredSession(): Promise<Session> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new UnauthorizedError(error.message);
  }

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
}

export function assertOwnUser(session: Session, userId?: string): string {
  if (userId && userId !== session.user.id) {
    throw new UnauthorizedError("You can only access your own Plate Party account.");
  }

  return session.user.id;
}

export function normalizeError(error: unknown, fallback = "Something went wrong. Please try again."): Error {
  if (error instanceof z.ZodError) {
    return new ValidationError(error.issues[0]?.message ?? fallback);
  }

  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new PlatePartyError("API_ERROR", error);
  }

  return new PlatePartyError("API_ERROR", fallback);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return normalizeError(error, fallback).message;
}

export async function invokeEdgeFunction<T>(
  functionName: string,
  body: JsonObject,
  outputSchema: z.ZodType<T>,
  idempotencyKey?: string,
): Promise<T> {
  const session = await getRequiredSession();
  const key = idempotencyKey ?? Crypto.randomUUID();
  const payload: JsonObject = {
    ...body,
    user_id: session.user.id,
    userId: session.user.id,
  };

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
    headers: {
      "x-idempotency-key": key,
    },
  });

  if (error) {
    throw new PlatePartyError("EDGE_FUNCTION_ERROR", error.message);
  }

  if (isErrorPayload(data)) {
    const message =
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : `The ${functionName} request failed.`;
    throw new PlatePartyError("EDGE_FUNCTION_ERROR", message);
  }

  return outputSchema.parse(data);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  return isRecord(value) && ("error" in value || "message" in value);
}

export function readString(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): string | undefined {
  const value = row[camelKey] ?? row[snakeKey];
  return typeof value === "string" ? value : undefined;
}

export function readNullableString(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): string | null {
  const value = row[camelKey] ?? row[snakeKey];
  return typeof value === "string" ? value : null;
}

export function readNumber(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): number | undefined {
  const value = row[camelKey] ?? row[snakeKey];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function readBoolean(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): boolean | undefined {
  const value = row[camelKey] ?? row[snakeKey];
  return typeof value === "boolean" ? value : undefined;
}

export function readDateValue(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): string | Date | null {
  const value = row[camelKey] ?? row[snakeKey];
  if (value instanceof Date) return value;
  return typeof value === "string" ? value : null;
}

export function camelToSnake(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
