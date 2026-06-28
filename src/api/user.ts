import * as Crypto from "expo-crypto";
import { z } from "zod";

import type { User } from "../db/schema";
import { supabase } from "../lib/supabase";
import {
  DescriptionSchema,
  DisplayNameSchema,
  PaginationSchema,
  UsernameSchema,
  UUIDSchema,
} from "../lib/validation";
import type { LedgerTransaction } from "./plates";
import { getTransactions } from "./plates";
import {
  assertOwnUser,
  getRequiredSession,
  isRecord,
  readDateValue,
  readNullableString,
  readNumber,
  readString,
} from "./_shared";

export interface UpdateProfileInput {
  userId?: string;
  displayName?: string;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface UploadAvatarInput {
  userId?: string;
  uri: string;
  fileName?: string;
  mimeType: "image/jpeg" | "image/png" | "image/gif";
  sizeBytes: number;
}

export type PublicUserProfile = Pick<User, "id" | "displayName" | "username" | "avatarUrl">;

const UserRowSchema = z.record(z.string(), z.unknown());

const UpdateProfileSchema = z.object({
  userId: UUIDSchema.optional(),
  displayName: DisplayNameSchema.optional(),
  username: UsernameSchema.nullish(),
  avatarUrl: z.string().trim().url().max(2048).nullish(),
  bio: DescriptionSchema.nullish(),
});

const UploadAvatarSchema = z.object({
  userId: UUIDSchema.optional(),
  uri: z.string().trim().min(1),
  fileName: z.string().trim().min(1).max(255).optional(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/gif"]),
  sizeBytes: z.number().int().min(1).max(10 * 1024 * 1024),
});

const ActivityHistorySchema = PaginationSchema.extend({
  userId: UUIDSchema.optional(),
});

const UsernameLookupSchema = z.object({
  username: UsernameSchema,
});

export async function getProfile(userId?: string): Promise<User | null> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, userId ? UUIDSchema.parse(userId) : undefined);
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", scopedUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data && isRecord(data) ? normalizeUser(data) : null;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User>;
export async function updateProfile(userId: string, updates: Omit<UpdateProfileInput, "userId">): Promise<User>;
export async function updateProfile(
  inputOrUserId: UpdateProfileInput | string,
  maybeUpdates?: Omit<UpdateProfileInput, "userId">,
): Promise<User> {
  const input = typeof inputOrUserId === "string" ? { ...maybeUpdates, userId: inputOrUserId } : inputOrUserId;
  const parsed = UpdateProfileSchema.parse(input);
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, parsed.userId);
  const payload = {
    ...(parsed.displayName !== undefined ? { display_name: parsed.displayName } : {}),
    ...(parsed.username !== undefined ? { username: parsed.username } : {}),
    ...(parsed.avatarUrl !== undefined ? { avatar_url: parsed.avatarUrl } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", scopedUserId)
    .select()
    .single();

  if (error) throw error;
  return normalizeUser(UserRowSchema.parse(data));
}

export async function uploadAvatar(input: UploadAvatarInput): Promise<string> {
  const parsed = UploadAvatarSchema.parse(input);
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, parsed.userId);
  const extension = extensionForMimeType(parsed.mimeType);
  const path = `${scopedUserId}/${Crypto.randomUUID()}.${extension}`;
  const response = await fetch(parsed.uri);
  if (!response.ok) {
    throw new Error("Could not read avatar image.");
  }

  const blob = await response.blob();
  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: parsed.mimeType,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await updateProfile({ userId: scopedUserId, avatarUrl: data.publicUrl });
  return data.publicUrl;
}

export async function getActivityHistory(userId?: string, input: Partial<z.infer<typeof ActivityHistorySchema>> = {}): Promise<LedgerTransaction[]> {
  const parsed = ActivityHistorySchema.parse({ ...input, userId });
  return getTransactions(parsed.userId, { cursor: parsed.cursor, limit: parsed.limit });
}

export async function findUserByUsername(username: string): Promise<PublicUserProfile | null> {
  await getRequiredSession();
  const parsed = UsernameLookupSchema.parse({ username });
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, username, avatar_url")
    .eq("username", parsed.username)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data && isRecord(data) ? normalizePublicUser(data) : null;
}

export async function deleteProfile(userId?: string): Promise<void> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, userId ? UUIDSchema.parse(userId) : undefined);
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", scopedUserId);

  if (error) throw error;
}

function normalizeUser(row: Record<string, unknown>): User {
  return {
    id: readString(row, "id") ?? "",
    displayName: readString(row, "displayName", "display_name") ?? "Plate Tester",
    username: readNullableString(row, "username"),
    plates: readNumber(row, "plates") ?? 0,
    lifetimePurchasedPlates: readNumber(row, "lifetimePurchasedPlates", "lifetime_purchased_plates") ?? 0,
    deviceId: readNullableString(row, "deviceId", "device_id"),
    avatarUrl: readNullableString(row, "avatarUrl", "avatar_url"),
    createdAt: toDate(readDateValue(row, "createdAt", "created_at")),
    updatedAt: toDate(readDateValue(row, "updatedAt", "updated_at")),
    deletedAt: toNullableDate(readDateValue(row, "deletedAt", "deleted_at")),
    name: readString(row, "name"),
    totalGiven: readNumber(row, "totalGiven", "total_given"),
    avatarColor: readString(row, "avatarColor", "avatar_color"),
  };
}

function normalizePublicUser(row: Record<string, unknown>): PublicUserProfile {
  return {
    id: readString(row, "id") ?? "",
    displayName: readString(row, "displayName", "display_name") ?? "Plate Player",
    username: readNullableString(row, "username"),
    avatarUrl: readNullableString(row, "avatarUrl", "avatar_url"),
  };
}

function extensionForMimeType(mimeType: UploadAvatarInput["mimeType"]): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/jpeg":
      return "jpg";
  }
}

function toDate(value: string | Date | null): Date {
  if (value instanceof Date) return value;
  return value ? new Date(value) : new Date();
}

function toNullableDate(value: string | Date | null): Date | null {
  if (value instanceof Date) return value;
  return value ? new Date(value) : null;
}
