import * as Crypto from "expo-crypto";
import { z } from "zod";

import type { Party, PartyMember } from "../db/schema";
import { supabase } from "../lib/supabase";
import { DescriptionSchema, PlateAmountSchema, TitleSchema, UUIDSchema } from "../lib/validation";
import { createChallenge, type Challenge } from "./challenge";
import {
  assertOwnUser,
  getRequiredSession,
  isRecord,
  readBoolean,
  readDateValue,
  readNullableString,
  readNumber,
  readString,
} from "./_shared";

export interface CreatePartyInput {
  name: string;
  description?: string | null;
  hostId?: string;
  isPrivate?: boolean;
  charityOrgName?: string | null;
  charityOrgUrl?: string | null;
  defaultStakePlates?: number;
}

export interface CreatePartyChallengeInput {
  partyId: string;
  title: string;
  description?: string | null;
  rewardPlates: number;
  deadline?: string;
  proofRequirements?: string[];
}

const PartyRowSchema = z.record(z.string(), z.unknown());
const PartyRowsSchema = z.array(PartyRowSchema);
const PartyMemberRowsSchema = z.array(z.record(z.string(), z.unknown()));

const CreatePartySchema = z.object({
  name: TitleSchema.max(80),
  description: DescriptionSchema.nullish(),
  hostId: UUIDSchema.optional(),
  isPrivate: z.boolean().default(false),
  charityOrgName: z.string().trim().min(1).max(120).nullish(),
  charityOrgUrl: z.string().trim().url().max(2048).nullish(),
  defaultStakePlates: PlateAmountSchema.default(1),
});

const UpdatePartySchema = z.object({
  partyId: UUIDSchema,
  name: TitleSchema.max(80).optional(),
  description: DescriptionSchema.nullish(),
  isPrivate: z.boolean().optional(),
  charityOrgName: z.string().trim().min(1).max(120).nullish(),
  charityOrgUrl: z.string().trim().url().max(2048).nullish(),
  defaultStakePlates: PlateAmountSchema.optional(),
});

const InviteCodeSchema = z.string().trim().regex(/^[A-Z0-9]{6}$/);

const CreatePartyChallengeSchema = z.object({
  partyId: UUIDSchema,
  title: TitleSchema,
  description: DescriptionSchema.nullish(),
  rewardPlates: PlateAmountSchema,
  deadline: z.string().datetime().optional(),
  proofRequirements: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
});

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = Crypto.getRandomBytes(6);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

export async function createParty(input: CreatePartyInput): Promise<Party>;
export async function createParty(name: string, description: string | null, hostId: string, isPrivate?: boolean): Promise<Party>;
export async function createParty(
  inputOrName: CreatePartyInput | string,
  description?: string | null,
  hostId?: string,
  isPrivate = false,
): Promise<Party> {
  const input =
    typeof inputOrName === "string"
      ? { name: inputOrName, description, hostId, isPrivate }
      : inputOrName;
  const parsed = CreatePartySchema.parse(input);
  const session = await getRequiredSession();
  const scopedHostId = assertOwnUser(session, parsed.hostId);
  const inviteCode = generateInviteCode();

  const { data, error } = await supabase
    .from("parties")
    .insert({
      name: parsed.name,
      description: parsed.description ?? null,
      host_id: scopedHostId,
      invite_code: inviteCode,
      is_private: parsed.isPrivate,
      charity_org_name: parsed.charityOrgName ?? null,
      charity_org_url: parsed.charityOrgUrl ?? null,
      default_stake_plates: parsed.defaultStakePlates,
    })
    .select()
    .single();

  if (error) throw error;
  const party = normalizeParty(PartyRowSchema.parse(data));

  const { error: memberError } = await supabase.from("party_members").insert({
    party_id: party.id,
    user_id: scopedHostId,
    role: "host",
  });

  if (memberError) throw memberError;
  return party;
}

export async function getParty(partyId: string): Promise<Party | null> {
  return getPartyById(partyId);
}

export async function getPartyById(partyId: string): Promise<Party | null> {
  await getRequiredSession();
  const id = UUIDSchema.parse(partyId);
  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data && isRecord(data) ? normalizeParty(data) : null;
}

export async function getPartyByInviteCode(inviteCode: string): Promise<Party | null> {
  await getRequiredSession();
  const code = InviteCodeSchema.parse(inviteCode.trim().toUpperCase());
  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .eq("invite_code", code)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data && isRecord(data) ? normalizeParty(data) : null;
}

export async function getUserParties(userId?: string): Promise<Party[]> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, userId ? UUIDSchema.parse(userId) : undefined);
  const { data: memberships, error: membershipError } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", scopedUserId)
    .is("deleted_at", null);

  if (membershipError) throw membershipError;
  const partyIds = PartyMemberRowsSchema.parse(memberships ?? [])
    .map((row) => readString(row, "partyId", "party_id"))
    .filter((id): id is string => Boolean(id));

  if (!partyIds.length) return [];

  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .in("id", partyIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return PartyRowsSchema.parse(data ?? []).map(normalizeParty);
}

export async function joinParty(partyId: string, userId?: string): Promise<PartyMember> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, userId ? UUIDSchema.parse(userId) : undefined);
  const id = UUIDSchema.parse(partyId);
  const { data, error } = await supabase
    .from("party_members")
    .insert({ party_id: id, user_id: scopedUserId, role: "member" })
    .select()
    .single();

  if (error) throw error;
  return normalizePartyMember(PartyRowSchema.parse(data));
}

export async function joinPartyByInviteCode(inviteCode: string): Promise<PartyMember> {
  const party = await getPartyByInviteCode(inviteCode);
  if (!party) throw new Error("Party not found.");
  return joinParty(party.id);
}

export async function leaveParty(partyId: string, userId?: string): Promise<void> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, userId ? UUIDSchema.parse(userId) : undefined);
  const id = UUIDSchema.parse(partyId);
  const { error } = await supabase
    .from("party_members")
    .update({ deleted_at: new Date().toISOString(), left_at: new Date().toISOString() })
    .eq("party_id", id)
    .eq("user_id", scopedUserId);

  if (error) throw error;
}

export async function getPartyMembers(partyId: string): Promise<PartyMember[]> {
  await getRequiredSession();
  const id = UUIDSchema.parse(partyId);
  const { data, error } = await supabase
    .from("party_members")
    .select("*")
    .eq("party_id", id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return PartyMemberRowsSchema.parse(data ?? []).map(normalizePartyMember);
}

export async function updateParty(partyId: string, updates: Omit<Partial<CreatePartyInput>, "hostId">): Promise<Party> {
  await getRequiredSession();
  const parsed = UpdatePartySchema.parse({ partyId, ...updates });
  const payload = {
    ...(parsed.name ? { name: parsed.name } : {}),
    ...(parsed.description !== undefined ? { description: parsed.description } : {}),
    ...(parsed.isPrivate !== undefined ? { is_private: parsed.isPrivate } : {}),
    ...(parsed.charityOrgName !== undefined ? { charity_org_name: parsed.charityOrgName } : {}),
    ...(parsed.charityOrgUrl !== undefined ? { charity_org_url: parsed.charityOrgUrl } : {}),
    ...(parsed.defaultStakePlates !== undefined ? { default_stake_plates: parsed.defaultStakePlates } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("parties")
    .update(payload)
    .eq("id", parsed.partyId)
    .select()
    .single();

  if (error) throw error;
  return normalizeParty(PartyRowSchema.parse(data));
}

export async function deleteParty(partyId: string, _deviceId?: string): Promise<void> {
  await getRequiredSession();
  const id = UUIDSchema.parse(partyId);
  const { error } = await supabase
    .from("parties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function createPartyChallenge(input: CreatePartyChallengeInput): Promise<Challenge> {
  const parsed = CreatePartyChallengeSchema.parse(input);
  await getPartyById(parsed.partyId);
  return createChallenge({
    title: parsed.title,
    description: parsed.description ?? null,
    type: "private",
    rewardPlates: parsed.rewardPlates,
    deadline: parsed.deadline,
    proofRequirements: parsed.proofRequirements,
  });
}

export const archiveParty = deleteParty;

export async function getMembership(partyId: string, userId?: string): Promise<PartyMember | null> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, userId ? UUIDSchema.parse(userId) : undefined);
  const id = UUIDSchema.parse(partyId);
  const { data, error } = await supabase
    .from("party_members")
    .select("*")
    .eq("party_id", id)
    .eq("user_id", scopedUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data && isRecord(data) ? normalizePartyMember(data) : null;
}

function normalizeParty(row: Record<string, unknown>): Party {
  return {
    id: readString(row, "id") ?? "",
    name: readString(row, "name") ?? "Untitled party",
    description: readNullableString(row, "description"),
    hostId: readString(row, "hostId", "host_id") ?? "",
    inviteCode: readString(row, "inviteCode", "invite_code") ?? "",
    isPrivate: readBoolean(row, "isPrivate", "is_private") ?? false,
    charityPoolPlates: readNumber(row, "charityPoolPlates", "charity_pool_plates") ?? 0,
    charityOrgName: readNullableString(row, "charityOrgName", "charity_org_name") ?? "",
    charityOrgUrl: readNullableString(row, "charityOrgUrl", "charity_org_url"),
    defaultStakePlates: readNumber(row, "defaultStakePlates", "default_stake_plates") ?? 1,
    realMoneyEnabled: readBoolean(row, "realMoneyEnabled", "real_money_enabled") ?? false,
    createdAt: toDate(readDateValue(row, "createdAt", "created_at")),
    updatedAt: toDate(readDateValue(row, "updatedAt", "updated_at")),
    deletedAt: toNullableDate(readDateValue(row, "deletedAt", "deleted_at")),
  };
}

function normalizePartyMember(row: Record<string, unknown>): PartyMember {
  return {
    id: readString(row, "id") ?? "",
    partyId: readString(row, "partyId", "party_id") ?? "",
    userId: readString(row, "userId", "user_id") ?? "",
    role: readString(row, "role") ?? "member",
    plateBalance: readNumber(row, "plateBalance", "plate_balance") ?? 0,
    reservedPlateBalance: readNumber(row, "reservedPlateBalance", "reserved_plate_balance") ?? 0,
    totalPlatesWagered: readNumber(row, "totalPlatesWagered", "total_plates_wagered") ?? 0,
    totalWins: readNumber(row, "totalWins", "total_wins") ?? 0,
    totalLosses: readNumber(row, "totalLosses", "total_losses") ?? 0,
    currentStreak: readNumber(row, "currentStreak", "current_streak") ?? 0,
    longestStreak: readNumber(row, "longestStreak", "longest_streak") ?? 0,
    joinedAt: toDate(readDateValue(row, "joinedAt", "joined_at")),
    leftAt: toNullableDate(readDateValue(row, "leftAt", "left_at")),
    deletedAt: toNullableDate(readDateValue(row, "deletedAt", "deleted_at")),
  };
}

function toDate(value: string | Date | null): Date {
  if (value instanceof Date) return value;
  return value ? new Date(value) : new Date();
}

function toNullableDate(value: string | Date | null): Date | null {
  if (value instanceof Date) return value;
  return value ? new Date(value) : null;
}
