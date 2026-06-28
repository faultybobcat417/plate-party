import { z } from "zod";

import type {
  Challenge,
  ChallengeEntry,
  ChallengeOption,
  Donation,
  User,
} from "../db/schema";
import { supabase } from "../lib/supabase";
import { DescriptionSchema, PlateAmountSchema, UUIDSchema } from "../lib/validation";
import { getRequiredSession, isRecord } from "./_shared";

export type ChallengeStatus = "open" | "locked" | "completed" | "expired" | "void" | "claimed";
export type ChallengeOracleType = "manual" | "auto" | "game_score";
export type ChallengeCategory = "trivia" | "prediction" | "skill" | "poll" | "custom";

export type ChallengeEntryWithUser = ChallengeEntry & {
  user: User;
};

export type ChallengeDetail = Challenge & {
  options: ChallengeOption[];
  entries: ChallengeEntryWithUser[];
  creator: User;
};

export type ActiveChallenge = Challenge & {
  entryCount: number;
  creatorName: string;
};

export type ChallengeResults = {
  challenge: Challenge;
  winner: User | null;
  entries: ChallengeEntryWithUser[];
  donations: Donation[];
};

export const ChallengeOracleTypeSchema = z.enum(["manual", "auto", "game_score"]);
export const ChallengeCategorySchema = z.enum(["trivia", "prediction", "skill", "poll", "custom"]);
export const ChallengeStatusSchema = z.enum(["open", "locked", "completed", "expired", "void", "claimed"]);

export const CreateChallengeInputSchema = z.object({
  partyId: UUIDSchema,
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title must be under 100 characters"),
  description: DescriptionSchema.max(500, "Description must be under 500 characters").optional(),
  stakeAmount: PlateAmountSchema,
  expiresAt: z.string().datetime(),
  oracleType: ChallengeOracleTypeSchema,
  category: ChallengeCategorySchema,
  proofRequired: z.boolean().default(false),
  options: z
    .array(z.string().trim().min(1, "Option cannot be empty").max(80, "Option must be under 80 characters"))
    .min(2, "Need at least 2 options")
    .max(6, "Max 6 options")
    .superRefine((options, context) => {
      const seen = new Set<string>();
      for (const option of options) {
        const key = option.toLocaleLowerCase();
        if (seen.has(key)) {
          context.addIssue({
            code: "custom",
            message: "Options must be unique",
          });
          return;
        }
        seen.add(key);
      }
    }),
});

export const PlaceBetInputSchema = z.object({
  challengeId: UUIDSchema,
  stakeAmount: PlateAmountSchema,
  chosenOptionId: UUIDSchema,
});

export const TriviaAnswerSchema = z.object({
  questionIndex: z.number().int().min(0),
  selectedIndex: z.number().int().min(0).nullable(),
  correctIndex: z.number().int().min(0),
  correct: z.boolean(),
  elapsedMs: z.number().int().min(0),
  timedOut: z.boolean(),
});

export const SubmitTriviaGameResultSchema = z.object({
  challengeId: UUIDSchema,
  score: z.number().int().min(0).max(1000),
  answers: z.array(TriviaAnswerSchema).min(1),
  timeTakenMs: z.number().int().min(0),
  flaggedReason: z.string().trim().min(1).max(240).optional(),
});

export type CreateChallengeInput = z.infer<typeof CreateChallengeInputSchema>;
export type PlaceBetInput = z.infer<typeof PlaceBetInputSchema>;
export type TriviaAnswer = z.infer<typeof TriviaAnswerSchema>;
export type SubmitTriviaGameResultInput = z.infer<typeof SubmitTriviaGameResultSchema>;

export async function createChallenge(params: CreateChallengeInput): Promise<string> {
  const session = await getRequiredSession();
  const userId = UUIDSchema.parse(session.user.id);
  const parsed = CreateChallengeInputSchema.parse(params);

  const { data, error } = await supabase.rpc("create_challenge_with_options", {
    p_creator_id: userId,
    p_party_id: parsed.partyId,
    p_title: parsed.title,
    p_description: parsed.description ?? "",
    p_stake_amount: parsed.stakeAmount,
    p_expires_at: parsed.expiresAt,
    p_oracle_type: parsed.oracleType,
    p_category: parsed.category,
    p_proof_required: parsed.proofRequired,
    p_options: parsed.options,
  });

  if (error) throw new Error(`Failed to create challenge: ${error.message}`);
  return parseRpcId(data, "challenge_id");
}

export async function getChallenge(id: string): Promise<ChallengeDetail> {
  await getRequiredSession();
  const challengeId = UUIDSchema.parse(id);

  const [challengeResponse, optionsResponse, entriesResponse] = await Promise.all([
    supabase.from("challenges").select("*").eq("id", challengeId).is("deleted_at", null).single(),
    supabase
      .from("challenge_options")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("challenge_entries")
      .select("*, user:users(*)")
      .eq("challenge_id", challengeId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);

  if (challengeResponse.error) throw challengeResponse.error;
  if (optionsResponse.error) throw optionsResponse.error;
  if (entriesResponse.error) throw entriesResponse.error;
  if (!isRecord(challengeResponse.data)) throw new Error("Challenge not found.");

  const challenge = normalizeChallenge(challengeResponse.data);
  const { data: creatorData, error: creatorError } = await supabase
    .from("users")
    .select("*")
    .eq("id", challenge.creatorId)
    .single();

  if (creatorError) throw creatorError;
  if (!isRecord(creatorData)) throw new Error("Challenge creator not found.");

  return {
    ...challenge,
    options: z.array(z.record(z.string(), z.unknown())).parse(optionsResponse.data ?? []).map(normalizeChallengeOption),
    entries: z.array(z.record(z.string(), z.unknown())).parse(entriesResponse.data ?? []).map(normalizeChallengeEntryWithUser),
    creator: normalizeUser(creatorData),
  };
}

export async function placeBet(params: PlaceBetInput): Promise<string> {
  const session = await getRequiredSession();
  const userId = UUIDSchema.parse(session.user.id);
  const parsed = PlaceBetInputSchema.parse(params);

  const { data, error } = await supabase.rpc("place_challenge_bet", {
    p_user_id: userId,
    p_challenge_id: parsed.challengeId,
    p_stake_amount: parsed.stakeAmount,
    p_chosen_option: parsed.chosenOptionId,
  });

  if (error) throw new Error(`Failed to place bet: ${error.message}`);
  return parseRpcId(data, "entry_id");
}

export async function resolveChallenge(
  challengeId: string,
  winnerUserId: string,
  charityName = "Plate Party Charity Fund",
): Promise<void> {
  await getRequiredSession();
  const { error } = await supabase.rpc("resolve_challenge", {
    p_challenge_id: UUIDSchema.parse(challengeId),
    p_winner_user_id: UUIDSchema.parse(winnerUserId),
    p_charity_name: charityName,
  });

  if (error) throw new Error(`Failed to resolve challenge: ${error.message}`);
}

export async function resolveByGameScore(challengeId: string): Promise<void> {
  await getRequiredSession();
  const { error } = await supabase.rpc("resolve_challenge_by_game_score", {
    p_challenge_id: UUIDSchema.parse(challengeId),
  });

  if (error) throw new Error(`Failed to auto-resolve challenge: ${error.message}`);
}

export async function getActiveChallenges(partyId: string): Promise<ActiveChallenge[]> {
  await getRequiredSession();
  const id = UUIDSchema.parse(partyId);
  const { data, error } = await supabase.rpc("get_active_challenges", {
    p_party_id: id,
  });

  if (!error) {
    return z.array(z.record(z.string(), z.unknown())).parse(data ?? []).map((row) => ({
      ...normalizeChallenge(row),
      entryCount: readNumeric(row, "entryCount", "entry_count") ?? 0,
      creatorName: readText(row, "creatorName", "creator_name") ?? "Unknown",
    }));
  }

  if (!isMissingRpcError(error.message, "get_active_challenges")) {
    throw error;
  }

  return getActiveChallengesFallback(id);
}

export async function getPublicActiveChallenges(limit = 50): Promise<ActiveChallenge[]> {
  await getRequiredSession();
  const parsedLimit = z.number().int().min(1).max(100).parse(limit);
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "open")
    .eq("type", "public")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(parsedLimit);

  if (error) throw error;

  const challenges = z.array(z.record(z.string(), z.unknown())).parse(data ?? []).map(normalizeChallenge);
  return hydrateActiveChallenges(challenges);
}

export async function getChallengeResults(challengeId: string): Promise<ChallengeResults> {
  await getRequiredSession();
  const id = UUIDSchema.parse(challengeId);

  const [challengeResponse, entriesResponse, donationsResponse] = await Promise.all([
    supabase.from("challenges").select("*").eq("id", id).single(),
    supabase
      .from("challenge_entries")
      .select("*, user:users(*)")
      .eq("challenge_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("donations").select("*").eq("challenge_id", id).order("created_at", { ascending: false }),
  ]);

  if (challengeResponse.error) throw challengeResponse.error;
  if (entriesResponse.error) throw entriesResponse.error;
  if (donationsResponse.error) throw donationsResponse.error;
  if (!isRecord(challengeResponse.data)) throw new Error("Challenge not found.");

  const challenge = normalizeChallenge(challengeResponse.data);
  const winner = challenge.winnerUserId ? await getUserById(challenge.winnerUserId) : null;

  return {
    challenge,
    winner,
    entries: z.array(z.record(z.string(), z.unknown())).parse(entriesResponse.data ?? []).map(normalizeChallengeEntryWithUser),
    donations: z.array(z.record(z.string(), z.unknown())).parse(donationsResponse.data ?? []).map(normalizeDonation),
  };
}

export async function submitTriviaGameResult(input: SubmitTriviaGameResultInput): Promise<string> {
  const session = await getRequiredSession();
  const userId = UUIDSchema.parse(session.user.id);
  const parsed = SubmitTriviaGameResultSchema.parse(input);
  const completedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      user_id: userId,
      challenge_id: parsed.challengeId,
      game_type: "trivia",
      score: parsed.score,
      answers: parsed.answers,
      time_taken_ms: parsed.timeTakenMs,
      status: "completed",
      flagged_reason: parsed.flaggedReason ?? null,
      completed_at: completedAt,
    })
    .select("id")
    .single();

  if (error) throw error;
  const sessionId = parseRpcId(data, "id");

  const { error: entryError } = await supabase
    .from("challenge_entries")
    .update({
      game_session_id: sessionId,
      game_score: parsed.score,
    })
    .eq("challenge_id", parsed.challengeId)
    .eq("user_id", userId);

  if (entryError) throw entryError;
  return sessionId;
}

async function getActiveChallengesFallback(partyId: string): Promise<ActiveChallenge[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("party_id", partyId)
    .eq("status", "open")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const challenges = z.array(z.record(z.string(), z.unknown())).parse(data ?? []).map(normalizeChallenge);
  return hydrateActiveChallenges(challenges);
}

async function hydrateActiveChallenges(challenges: Challenge[]): Promise<ActiveChallenge[]> {
  if (!challenges.length) return [];

  const challengeIds = challenges.map((challenge) => challenge.id);
  const creatorIds = Array.from(new Set(challenges.map((challenge) => challenge.creatorId)));
  const [entriesResponse, creatorsResponse] = await Promise.all([
    supabase.from("challenge_entries").select("challenge_id").in("challenge_id", challengeIds).is("deleted_at", null),
    supabase.from("users").select("id, display_name, username").in("id", creatorIds),
  ]);

  if (entriesResponse.error) throw entriesResponse.error;
  if (creatorsResponse.error) throw creatorsResponse.error;

  const entryCounts = new Map<string, number>();
  for (const row of z.array(z.record(z.string(), z.unknown())).parse(entriesResponse.data ?? [])) {
    const rowChallengeId = readText(row, "challengeId", "challenge_id");
    if (rowChallengeId) entryCounts.set(rowChallengeId, (entryCounts.get(rowChallengeId) ?? 0) + 1);
  }

  const creatorNames = new Map<string, string>();
  for (const row of z.array(z.record(z.string(), z.unknown())).parse(creatorsResponse.data ?? [])) {
    const creatorId = readText(row, "id");
    if (creatorId) {
      creatorNames.set(
        creatorId,
        readText(row, "displayName", "display_name") ?? readText(row, "username") ?? "Unknown",
      );
    }
  }

  return challenges.map((challenge) => ({
    ...challenge,
    entryCount: entryCounts.get(challenge.id) ?? 0,
    creatorName: creatorNames.get(challenge.creatorId) ?? "Unknown",
  }));
}

async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data && isRecord(data) ? normalizeUser(data) : null;
}

function parseRpcId(value: unknown, objectKey: string): string {
  if (typeof value === "string") {
    return UUIDSchema.parse(value);
  }

  if (isRecord(value)) {
    const candidate = value[objectKey] ?? value.id;
    if (typeof candidate === "string") return UUIDSchema.parse(candidate);
  }

  throw new Error("The server returned an unexpected identifier.");
}

function normalizeChallenge(row: Record<string, unknown>): Challenge {
  return {
    id: readRequiredText(row, "id"),
    creatorId: readRequiredText(row, "creatorId", "creator_id"),
    partyId: readText(row, "partyId", "party_id"),
    title: readText(row, "title") ?? "Untitled challenge",
    description: readText(row, "description"),
    type: readText(row, "type") ?? "public",
    stakeAmount: readNumeric(row, "stakeAmount", "stake_amount") ?? 0,
    rewardAmount: readNumeric(row, "rewardAmount", "reward_amount") ?? 0,
    status: ChallengeStatusSchema.catch("open").parse(readText(row, "status")),
    oracleType: ChallengeOracleTypeSchema.catch("manual").parse(readText(row, "oracleType", "oracle_type")),
    winnerUserId: readText(row, "winnerUserId", "winner_user_id"),
    charityAmount: readNumeric(row, "charityAmount", "charity_amount") ?? 0,
    totalPot: readNumeric(row, "totalPot", "total_pot") ?? 0,
    category: ChallengeCategorySchema.catch("trivia").parse(readText(row, "category")),
    expiresAt: readDate(row, "expiresAt", "expires_at"),
    proofRequired: readBoolean(row, "proofRequired", "proof_required") ?? false,
    resolvedAt: readDate(row, "resolvedAt", "resolved_at"),
    createdAt: readDate(row, "createdAt", "created_at") ?? new Date(),
    updatedAt: readDate(row, "updatedAt", "updated_at") ?? new Date(),
    deletedAt: readDate(row, "deletedAt", "deleted_at"),
  };
}

function normalizeChallengeOption(row: Record<string, unknown>): ChallengeOption {
  return {
    id: readRequiredText(row, "id"),
    challengeId: readRequiredText(row, "challengeId", "challenge_id"),
    label: readText(row, "label") ?? "Option",
    sortOrder: readNumeric(row, "sortOrder", "sort_order") ?? 0,
    isCorrect: readBoolean(row, "isCorrect", "is_correct") ?? false,
    createdAt: readDate(row, "createdAt", "created_at") ?? new Date(),
  };
}

function normalizeChallengeEntryWithUser(row: Record<string, unknown>): ChallengeEntryWithUser {
  return {
    ...normalizeChallengeEntry(row),
    user: isRecord(row.user) ? normalizeUser(row.user) : anonymousUser(),
  };
}

function normalizeChallengeEntry(row: Record<string, unknown>): ChallengeEntry {
  return {
    id: readRequiredText(row, "id"),
    challengeId: readRequiredText(row, "challengeId", "challenge_id"),
    userId: readRequiredText(row, "userId", "user_id"),
    stakeAmount: readNumeric(row, "stakeAmount", "stake_amount") ?? 0,
    chosenOption: readText(row, "chosenOption", "chosen_option"),
    gameScore: readNumeric(row, "gameScore", "game_score") ?? null,
    gameSessionId: readText(row, "gameSessionId", "game_session_id"),
    status: readText(row, "status") ?? "pending",
    proofUrl: readText(row, "proofUrl", "proof_url"),
    proofSubmittedAt: readDate(row, "proofSubmittedAt", "proof_submitted_at"),
    createdAt: readDate(row, "createdAt", "created_at") ?? new Date(),
    deletedAt: readDate(row, "deletedAt", "deleted_at"),
  };
}

function normalizeUser(row: Record<string, unknown>): User {
  return {
    id: readRequiredText(row, "id"),
    displayName: readText(row, "displayName", "display_name") ?? "Unknown",
    username: readText(row, "username"),
    plates: readNumeric(row, "plates") ?? 0,
    lifetimePurchasedPlates: readNumeric(row, "lifetimePurchasedPlates", "lifetime_purchased_plates") ?? 0,
    deviceId: readText(row, "deviceId", "device_id"),
    avatarUrl: readText(row, "avatarUrl", "avatar_url"),
    ageVerified: readBoolean(row, "ageVerified", "age_verified") ?? false,
    gdprConsent: readBoolean(row, "gdprConsent", "gdpr_consent"),
    pushToken: readText(row, "pushToken", "push_token"),
    referredBy: readText(row, "referredBy", "referred_by"),
    referralCode: readText(row, "referralCode", "referral_code"),
    bio: readText(row, "bio"),
    createdAt: readDate(row, "createdAt", "created_at") ?? new Date(),
    updatedAt: readDate(row, "updatedAt", "updated_at") ?? new Date(),
    deletedAt: readDate(row, "deletedAt", "deleted_at"),
  };
}

function normalizeDonation(row: Record<string, unknown>): Donation {
  return {
    id: readRequiredText(row, "id"),
    userId: readRequiredText(row, "userId", "user_id"),
    challengeId: readText(row, "challengeId", "challenge_id"),
    charityName: readText(row, "charityName", "charity_name") ?? "Charity",
    charityEin: readText(row, "charityEin", "charity_ein"),
    platesAmount: readNumeric(row, "platesAmount", "plates_amount") ?? 0,
    usdValue: readNumeric(row, "usdValue", "usd_value") ?? 0,
    status: readText(row, "status") ?? "pending",
    receiptUrl: readText(row, "receiptUrl", "receipt_url"),
    createdAt: readDate(row, "createdAt", "created_at") ?? new Date(),
  };
}

function anonymousUser(): User {
  const now = new Date();
  return {
    id: "00000000-0000-0000-0000-000000000000",
    displayName: "Unknown",
    username: null,
    plates: 0,
    lifetimePurchasedPlates: 0,
    deviceId: null,
    avatarUrl: null,
    ageVerified: false,
    gdprConsent: null,
    pushToken: null,
    referredBy: null,
    referralCode: null,
    bio: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function readRequiredText(row: Record<string, unknown>, camelKey: string, snakeKey?: string): string {
  const value = readText(row, camelKey, snakeKey);
  if (!value) throw new Error(`Missing ${snakeKey ?? camelKey}.`);
  return value;
}

function readText(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): string | null {
  const value = row[camelKey] ?? row[snakeKey];
  return typeof value === "string" ? value : null;
}

function readNumeric(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): number | undefined {
  const value = row[camelKey] ?? row[snakeKey];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readBoolean(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): boolean | null {
  const value = row[camelKey] ?? row[snakeKey];
  return typeof value === "boolean" ? value : null;
}

function readDate(row: Record<string, unknown>, camelKey: string, snakeKey = camelToSnake(camelKey)): Date | null {
  const value = row[camelKey] ?? row[snakeKey];
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function camelToSnake(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLocaleLowerCase()}`);
}

function isMissingRpcError(message: string, functionName: string): boolean {
  return message.toLocaleLowerCase().includes(functionName.toLocaleLowerCase())
    || message.toLocaleLowerCase().includes("could not find the function");
}
