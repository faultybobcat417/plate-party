import { z } from "zod";

import type { ChallengeEntry as DbChallengeEntry } from "../db/schema";
import {
  IdempotencyKeySchema,
  assertOwnUser,
  getRequiredSession,
  invokeEdgeFunction,
  isRecord,
  readBoolean,
  readDateValue,
  readNullableString,
  readNumber,
  readString,
} from "./_shared";
import { supabase } from "../lib/supabase";
import {
  DescriptionSchema,
  PaginationSchema,
  PlateAmountSchema,
  TitleSchema,
  UUIDSchema,
} from "../lib/validation";

export type ChallengeStatus = "open" | "claimed" | "completed" | "expired" | "locked" | "void";
export type ChallengeType = "public" | "private" | "personal" | "self" | "bounty" | "group";

export interface Challenge {
  id: string;
  creatorId?: string;
  title: string;
  description?: string | null;
  type: ChallengeType;
  stakeAmount?: number;
  rewardAmount?: number;
  rewardPlates?: number;
  status: ChallengeStatus;
  expiresAt: Date | string | null;
  deadline: string;
  proofNote?: string | null;
  proofRequired?: boolean;
  proofRequirements?: string[];
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  participantCount?: number;
}

export type ChallengeEntry = DbChallengeEntry;

export type ProofSubmission = {
  id: string;
  challengeId: string;
  submitterId: string;
  proofType: "camera" | "photo" | "file" | "text";
  proofData?: string;
  submittedAt?: string;
};

export type CreateChallengeInput = {
  creatorId?: string;
  title: string;
  description?: string | null;
  stakeAmount?: number;
  rewardAmount?: number;
  rewardPlates?: number;
  type?: ChallengeType;
  deadline?: string;
  expiresAt?: Date | string | null;
  proofRequirements?: string[];
  idempotencyKey?: string;
};

export type GetChallengesInput = z.infer<typeof GetChallengesSchema>;
export type UpdateChallengeInput = z.infer<typeof UpdateChallengeSchema>;

export type SubmitProofInput = {
  entryId?: string;
  challengeId?: string;
  proofUrl?: string;
  proofData?: string;
  proofType?: ProofSubmission["proofType"];
};

const ChallengeTypeSchema = z.enum(["public", "private", "personal", "self", "bounty", "group"]);
const ChallengeStatusSchema = z.enum(["open", "claimed", "completed", "expired", "locked", "void"]);
const ChallengeRowSchema = z.record(z.string(), z.unknown());
const ChallengeRowsSchema = z.array(ChallengeRowSchema);
const ChallengeEntryRowSchema = z.record(z.string(), z.unknown());
const ChallengeEntryRowsSchema = z.array(ChallengeEntryRowSchema);
const EdgeResultSchema = z.unknown();

const CreateChallengeSchema = z.object({
  creatorId: UUIDSchema.optional(),
  title: TitleSchema,
  description: DescriptionSchema.nullish(),
  stakeAmount: z.number().int().min(0).optional(),
  rewardAmount: z.number().int().min(0).optional(),
  rewardPlates: PlateAmountSchema.optional(),
  type: ChallengeTypeSchema.default("public"),
  deadline: z.string().datetime().optional(),
  expiresAt: z.union([z.string().datetime(), z.date()]).nullish(),
  proofRequirements: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  idempotencyKey: IdempotencyKeySchema,
});

const GetChallengesSchema = PaginationSchema.extend({
  status: ChallengeStatusSchema.optional(),
  type: ChallengeTypeSchema.optional(),
  creatorId: UUIDSchema.optional(),
});

const UpdateChallengeSchema = z.object({
  challengeId: UUIDSchema,
  title: TitleSchema.optional(),
  description: DescriptionSchema.nullish(),
  rewardPlates: PlateAmountSchema.optional(),
  rewardAmount: z.number().int().min(0).optional(),
  stakeAmount: z.number().int().min(0).optional(),
  deadline: z.string().datetime().optional(),
  expiresAt: z.union([z.string().datetime(), z.date()]).nullish(),
  status: ChallengeStatusSchema.optional(),
});

const SubmitProofSchema = z
  .object({
    entryId: UUIDSchema.optional(),
    challengeId: UUIDSchema.optional(),
    proofUrl: z.string().trim().min(1).max(2048).optional(),
    proofData: z.string().trim().min(1).max(2048).optional(),
    proofType: z.enum(["camera", "photo", "file", "text"]).default("text"),
  })
  .refine((value) => Boolean(value.entryId || value.challengeId), {
    message: "Either entryId or challengeId is required.",
  })
  .refine((value) => Boolean(value.proofUrl || value.proofData), {
    message: "Proof data is required.",
  });

const ResolveChallengeSchema = z
  .object({
    challengeId: UUIDSchema,
    winnerEntryId: UUIDSchema.optional(),
    winnerUserId: UUIDSchema.optional(),
    idempotencyKey: IdempotencyKeySchema,
  })
  .refine((value) => Boolean(value.winnerEntryId || value.winnerUserId), {
    message: "A winner entry or winner user is required.",
  });

const JoinChallengeSchema = z.object({
  challengeId: UUIDSchema,
  userId: UUIDSchema.optional(),
  stakeAmount: z.number().int().min(0).default(0),
});

export async function createChallenge(input: CreateChallengeInput): Promise<Challenge>;
export async function createChallenge(
  creatorId: string,
  title: string,
  description: string | null,
  stakeAmount: number,
  rewardAmount: number,
  type?: "public" | "private" | "personal",
  expiresAt?: Date,
): Promise<Challenge>;
export async function createChallenge(
  inputOrCreatorId: CreateChallengeInput | string,
  title?: string,
  description?: string | null,
  stakeAmount = 0,
  rewardAmount = 0,
  type: "public" | "private" | "personal" = "public",
  expiresAt?: Date,
): Promise<Challenge> {
  const input =
    typeof inputOrCreatorId === "string"
      ? { creatorId: inputOrCreatorId, title: title ?? "", description, stakeAmount, rewardAmount, type, expiresAt }
      : inputOrCreatorId;
  const parsed = CreateChallengeSchema.parse(input);
  const session = await getRequiredSession();
  assertOwnUser(session, parsed.creatorId);
  const deadline = parsed.deadline ?? normalizeDateInput(parsed.expiresAt) ?? defaultDeadline();
  const rewardPlates = parsed.rewardPlates ?? parsed.rewardAmount ?? parsed.stakeAmount ?? 1;

  const result = await invokeEdgeFunction(
    "create-challenge",
    {
      title: parsed.title,
      description: parsed.description ?? null,
      rewardPlates,
      deadline,
      proofRequirements: parsed.proofRequirements ?? [],
      type: parsed.type,
      stakeAmount: parsed.stakeAmount ?? 0,
    },
    EdgeResultSchema,
    parsed.idempotencyKey,
  );

  if (isRecord(result)) {
    return normalizeChallenge(result);
  }

  return getChallengeByIdFromServerResult(result);
}

export async function getChallenges(input: Partial<GetChallengesInput> = {}): Promise<Challenge[]> {
  await getRequiredSession();
  const parsed = GetChallengesSchema.parse(input);
  let query = supabase
    .from("challenges")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(parsed.limit);

  if (parsed.status) query = query.eq("status", parsed.status);
  if (parsed.type) query = query.eq("type", parsed.type);
  if (parsed.creatorId) query = query.eq("creator_id", parsed.creatorId);
  if (parsed.cursor) query = query.lt("created_at", parsed.cursor);

  const { data, error } = await query;
  if (error) throw error;
  return ChallengeRowsSchema.parse(data ?? []).map(normalizeChallenge);
}

export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  await getRequiredSession();
  const id = UUIDSchema.parse(challengeId);
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data && isRecord(data) ? normalizeChallenge(data) : null;
}

export async function getOpenChallenges(limit = 50): Promise<Challenge[]> {
  return getChallenges({ status: "open", limit });
}

export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, UUIDSchema.parse(userId));
  return getChallenges({ creatorId: scopedUserId, limit: 100 });
}

export async function updateChallenge(input: UpdateChallengeInput): Promise<Challenge> {
  await getRequiredSession();
  const parsed = UpdateChallengeSchema.parse(input);
  const deadline = parsed.deadline ?? normalizeDateInput(parsed.expiresAt);
  const payload = {
    ...(parsed.title !== undefined ? { title: parsed.title } : {}),
    ...(parsed.description !== undefined ? { description: parsed.description } : {}),
    ...(parsed.rewardPlates !== undefined ? { reward_amount: parsed.rewardPlates } : {}),
    ...(parsed.rewardAmount !== undefined ? { reward_amount: parsed.rewardAmount } : {}),
    ...(parsed.stakeAmount !== undefined ? { stake_amount: parsed.stakeAmount } : {}),
    ...(deadline !== undefined ? { expires_at: deadline } : {}),
    ...(parsed.status !== undefined ? { status: parsed.status } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("challenges")
    .update(payload)
    .eq("id", parsed.challengeId)
    .select()
    .single();

  if (error) throw error;
  return normalizeChallenge(ChallengeRowSchema.parse(data));
}

export async function joinChallenge(challengeId: string, userId?: string, stakeAmount = 0): Promise<ChallengeEntry> {
  const session = await getRequiredSession();
  const parsed = JoinChallengeSchema.parse({ challengeId, userId, stakeAmount });
  const scopedUserId = assertOwnUser(session, parsed.userId);
  const { data, error } = await supabase
    .from("challenge_entries")
    .insert({
      challenge_id: parsed.challengeId,
      user_id: scopedUserId,
      stake_amount: parsed.stakeAmount,
    })
    .select()
    .single();

  if (error) throw error;
  return normalizeChallengeEntry(ChallengeEntryRowSchema.parse(data));
}

export async function enterChallenge(challengeId: string, userId: string, stakeAmount: number): Promise<ChallengeEntry> {
  return joinChallenge(challengeId, userId, stakeAmount);
}

export async function submitProof(entryId: string, proofUrl: string): Promise<ChallengeEntry>;
export async function submitProof(input: SubmitProofInput): Promise<ChallengeEntry>;
export async function submitProof(inputOrEntryId: SubmitProofInput | string, proofUrl?: string): Promise<ChallengeEntry> {
  const session = await getRequiredSession();
  const parsed = SubmitProofSchema.parse(
    typeof inputOrEntryId === "string"
      ? { entryId: inputOrEntryId, proofUrl, proofType: "file" }
      : inputOrEntryId,
  );
  const entryId = parsed.entryId ?? (await getCurrentUserEntryId(parsed.challengeId ?? "", session.user.id));
  const proofValue = parsed.proofUrl ?? parsed.proofData;

  const { data, error } = await supabase
    .from("challenge_entries")
    .update({
      proof_url: proofValue,
      proof_submitted_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) throw error;
  return normalizeChallengeEntry(ChallengeEntryRowSchema.parse(data));
}

export async function resolveChallenge(challengeId: string, winnerUserId: string): Promise<void>;
export async function resolveChallenge(input: z.infer<typeof ResolveChallengeSchema>): Promise<void>;
export async function resolveChallenge(inputOrChallengeId: string | z.infer<typeof ResolveChallengeSchema>, winnerUserId?: string): Promise<void> {
  const parsed = ResolveChallengeSchema.parse(
    typeof inputOrChallengeId === "string"
      ? { challengeId: inputOrChallengeId, winnerUserId }
      : inputOrChallengeId,
  );
  const winnerEntryId = parsed.winnerEntryId ?? (await getWinnerEntryId(parsed.challengeId, parsed.winnerUserId ?? ""));

  await invokeEdgeFunction(
    "resolve-challenge",
    {
      challengeId: parsed.challengeId,
      winnerEntryId,
    },
    EdgeResultSchema,
    parsed.idempotencyKey,
  );
}

export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
  await getRequiredSession();
  const id = UUIDSchema.parse(challengeId);
  const { data, error } = await supabase
    .from("challenge_entries")
    .select("*")
    .eq("challenge_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ChallengeEntryRowsSchema.parse(data ?? []).map(normalizeChallengeEntry);
}

export async function getUserChallengeEntries(userId: string): Promise<ChallengeEntry[]> {
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, UUIDSchema.parse(userId));
  const { data, error } = await supabase
    .from("challenge_entries")
    .select("*")
    .eq("user_id", scopedUserId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ChallengeEntryRowsSchema.parse(data ?? []).map(normalizeChallengeEntry);
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  await getRequiredSession();
  const id = UUIDSchema.parse(challengeId);
  const { error } = await supabase
    .from("challenges")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

function normalizeChallenge(row: Record<string, unknown>): Challenge {
  const expiresAt = readDateValue(row, "expiresAt", "expires_at");
  const deadline = readString(row, "deadline") ?? (typeof expiresAt === "string" ? expiresAt : null) ?? defaultDeadline();
  const rewardAmount = readNumber(row, "rewardAmount", "reward_amount") ?? readNumber(row, "rewardPlates") ?? 0;
  const type = ChallengeTypeSchema.catch("public").parse(readString(row, "type"));
  const status = ChallengeStatusSchema.catch("open").parse(readString(row, "status"));

  return {
    id: readString(row, "id") ?? "",
    creatorId: readString(row, "creatorId", "creator_id"),
    title: readString(row, "title") ?? "Untitled challenge",
    description: readNullableString(row, "description"),
    type,
    stakeAmount: readNumber(row, "stakeAmount", "stake_amount") ?? 0,
    rewardAmount,
    rewardPlates: rewardAmount,
    status,
    deadline,
    expiresAt,
    proofRequired: readBoolean(row, "proofRequired", "proof_required") ?? true,
    proofRequirements: readStringArray(row, "proofRequirements", "proof_requirements"),
    createdAt: readDateValue(row, "createdAt", "created_at") ?? new Date().toISOString(),
    updatedAt: readDateValue(row, "updatedAt", "updated_at"),
    deletedAt: readDateValue(row, "deletedAt", "deleted_at"),
    participantCount: readNumber(row, "participantCount", "participant_count") ?? 0,
  };
}

function readStringArray(row: Record<string, unknown>, camelKey: string, snakeKey: string): string[] {
  const value = row[camelKey] ?? row[snakeKey];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeChallengeEntry(row: Record<string, unknown>): ChallengeEntry {
  return {
    id: readString(row, "id") ?? "",
    challengeId: readString(row, "challengeId", "challenge_id") ?? "",
    userId: readString(row, "userId", "user_id") ?? "",
    stakeAmount: readNumber(row, "stakeAmount", "stake_amount") ?? 0,
    chosenOption: readNullableString(row, "chosenOption", "chosen_option"),
    gameScore: readNumber(row, "gameScore", "game_score") ?? null,
    gameSessionId: readNullableString(row, "gameSessionId", "game_session_id"),
    status: readString(row, "status") ?? "pending",
    proofUrl: readNullableString(row, "proofUrl", "proof_url"),
    proofSubmittedAt: toNullableDate(readDateValue(row, "proofSubmittedAt", "proof_submitted_at")),
    createdAt: toDate(readDateValue(row, "createdAt", "created_at")),
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

async function getWinnerEntryId(challengeId: string, winnerUserId: string): Promise<string> {
  const parsed = JoinChallengeSchema.pick({ challengeId: true, userId: true }).parse({ challengeId, userId: winnerUserId });
  const { data, error } = await supabase
    .from("challenge_entries")
    .select("id")
    .eq("challenge_id", parsed.challengeId)
    .eq("user_id", parsed.userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || !isRecord(data) || typeof data.id !== "string") {
    throw new Error("Winner entry not found.");
  }

  return data.id;
}

async function getCurrentUserEntryId(challengeId: string, userId: string): Promise<string> {
  try {
    return await getWinnerEntryId(challengeId, userId);
  } catch {
    const entry = await joinChallenge(challengeId, userId, 0);
    return entry.id;
  }
}

function normalizeDateInput(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function defaultDeadline(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

async function getChallengeByIdFromServerResult(result: unknown): Promise<Challenge> {
  if (typeof result === "string") {
    const challenge = await getChallengeById(result);
    if (challenge) return challenge;
  }

  throw new Error("Create challenge returned an unexpected response.");
}
