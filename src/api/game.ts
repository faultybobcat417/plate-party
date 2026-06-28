import { z } from "zod";

import {
  IdempotencyKeySchema,
  getRequiredSession,
  invokeEdgeFunction,
  isRecord,
  readDateValue,
  readNumber,
  readString,
  type JsonObject,
  type JsonValue,
} from "./_shared";
import { PaginationSchema, PlateAmountSchema, UUIDSchema } from "../lib/validation";
import { supabase } from "../lib/supabase";

export const GAME_TYPES = [
  "tic-tac-toe",
  "memory",
  "word-guess",
  "questions",
  "rps",
  "quick-math",
] as const;

export type GameType = (typeof GAME_TYPES)[number];

export interface GameSessionRecord {
  id: string;
  userId?: string;
  player1Id?: string;
  player2Id?: string;
  gameType: GameType;
  score: number;
  answers: JsonValue[];
  timeTakenMs?: number | null;
  status: string;
  wagerAmount?: number;
  winnerId?: string | null;
  createdAt: string | Date;
  completedAt?: string | Date | null;
}

export interface CreateGameSessionInput {
  opponentId: string;
  gameType: GameType;
  wagerAmount: number;
  idempotencyKey?: string;
}

export interface ResolveGameInput {
  sessionId: string;
  winnerId?: string | null;
  idempotencyKey?: string;
}

export interface SubmitMoveInput {
  sessionId: string;
  move: JsonObject;
  turnNumber?: number;
}

export interface GameMove extends JsonObject {
  userId?: string;
  type?: string;
  turnNumber?: number;
  submittedAt?: string;
}

export type GameScore = {
  gameType: GameType;
  score: number;
  highScore: number;
  platesEarned: number;
  playedAt: string;
};

export type GameResult = {
  won: boolean;
  score: number;
  platesEarned: number;
};

const HIGH_SCORES: Record<GameType, number> = {
  "tic-tac-toe": 0,
  memory: 0,
  "word-guess": 0,
  questions: 0,
  rps: 0,
  "quick-math": 0,
};

const PLATE_BASE_RATES: Record<GameType, number> = {
  "tic-tac-toe": 10,
  memory: 5,
  "word-guess": 15,
  questions: 20,
  rps: 5,
  "quick-math": 2,
};

const GameTypeSchema = z.enum(GAME_TYPES);
const EdgeResultSchema = z.unknown();
const GameSessionRowSchema = z.record(z.string(), z.unknown());
const GameSessionRowsSchema = z.array(GameSessionRowSchema);

const CreateGameSessionSchema = z.object({
  opponentId: UUIDSchema,
  gameType: GameTypeSchema,
  wagerAmount: PlateAmountSchema,
  idempotencyKey: IdempotencyKeySchema,
});

const ResolveGameSchema = z.object({
  sessionId: UUIDSchema,
  winnerId: UUIDSchema.nullish(),
  idempotencyKey: IdempotencyKeySchema,
});

const SubmitMoveSchema = z.object({
  sessionId: UUIDSchema,
  move: z.record(z.string(), z.unknown()),
  turnNumber: z.number().int().min(0).optional(),
});

const SessionListSchema = PaginationSchema.extend({
  userId: UUIDSchema.optional(),
});

export function isGameType(value: string): value is GameType {
  return GAME_TYPES.includes(value as GameType);
}

export async function createGameSession(input: CreateGameSessionInput): Promise<GameSessionRecord> {
  const parsed = CreateGameSessionSchema.parse(input);
  const result = await invokeEdgeFunction(
    "create-game-session",
    {
      opponentId: parsed.opponentId,
      gameType: parsed.gameType,
      wagerAmount: parsed.wagerAmount,
    },
    EdgeResultSchema,
    parsed.idempotencyKey,
  );

  if (!isRecord(result)) {
    throw new Error("Create game session returned an unexpected response.");
  }

  return normalizeGameSession(result);
}

export async function resolveGame(input: ResolveGameInput): Promise<GameSessionRecord | null> {
  const parsed = ResolveGameSchema.parse(input);
  const result = await invokeEdgeFunction(
    "resolve-game",
    {
      sessionId: parsed.sessionId,
      winnerId: parsed.winnerId ?? null,
    },
    EdgeResultSchema,
    parsed.idempotencyKey,
  );

  return isRecord(result) ? normalizeGameSession(result) : getGameSession(parsed.sessionId);
}

export async function getGameSession(sessionId: string): Promise<GameSessionRecord | null> {
  await getRequiredSession();
  const id = UUIDSchema.parse(sessionId);
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data && isRecord(data) ? normalizeGameSession(data) : null;
}

export async function getGameSessions(input: Partial<z.infer<typeof SessionListSchema>> = {}): Promise<GameSessionRecord[]> {
  const session = await getRequiredSession();
  const parsed = SessionListSchema.parse(input);
  const userId = parsed.userId ?? session.user.id;
  let query = supabase
    .from("game_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(parsed.limit);

  if (parsed.cursor) query = query.lt("created_at", parsed.cursor);

  const { data, error } = await query;
  if (error) throw error;
  return GameSessionRowsSchema.parse(data ?? []).map(normalizeGameSession);
}

export async function submitMove(input: SubmitMoveInput): Promise<GameSessionRecord> {
  const authSession = await getRequiredSession();
  const parsed = SubmitMoveSchema.parse(input);
  const current = await getGameSession(parsed.sessionId);
  if (!current) throw new Error("Game session not found.");
  const isParticipant =
    !current.userId ||
    current.userId === authSession.user.id ||
    current.player1Id === authSession.user.id ||
    current.player2Id === authSession.user.id;
  if (!isParticipant) throw new Error("You are not a player in this game.");

  if (parsed.turnNumber !== undefined && parsed.turnNumber !== current.answers.length) {
    throw new Error("This move is out of order. Refresh the game and try again.");
  }

  const move: JsonObject = {
    ...parsed.move,
    userId: authSession.user.id,
    turnNumber: parsed.turnNumber,
    submittedAt: new Date().toISOString(),
  };
  const answers = [...current.answers, move];
  const { data, error } = await supabase
    .from("game_sessions")
    .update({ answers })
    .eq("id", parsed.sessionId)
    .in("status", ["queued", "playing", "active"])
    .select()
    .single();

  if (error) throw error;
  return normalizeGameSession(GameSessionRowSchema.parse(data));
}

export function calculatePlates(gameType: GameType, score: number, won: boolean): number {
  if (!won) return 0;
  const base = PLATE_BASE_RATES[gameType];
  if (!base || score <= 0) return 0;
  return base * score;
}

export function saveGameResult(gameType: GameType, result: GameResult): GameScore {
  const now = new Date().toISOString();
  const highScore = Math.max(result.score, HIGH_SCORES[gameType] ?? 0);
  HIGH_SCORES[gameType] = highScore;

  return {
    gameType,
    score: result.score,
    highScore,
    platesEarned: result.platesEarned,
    playedAt: now,
  };
}

export function getHighScore(gameType: GameType): number {
  return HIGH_SCORES[gameType] ?? 0;
}

export function getAllHighScores(): Record<GameType, number> {
  return { ...HIGH_SCORES };
}

export function setHighScores(scores: Partial<Record<GameType, number>>): void {
  for (const type of GAME_TYPES) {
    HIGH_SCORES[type] = scores[type] ?? 0;
  }
}

function normalizeGameSession(row: Record<string, unknown>): GameSessionRecord {
  const rawAnswers = row.answers;
  const answers = Array.isArray(rawAnswers) ? rawAnswers.filter(isJsonValue) : [];
  const gameType = GameTypeSchema.catch("questions").parse(readString(row, "gameType", "game_type"));

  return {
    id: readString(row, "id") ?? "",
    userId: readString(row, "userId", "user_id"),
    player1Id: readString(row, "player1Id", "player1_id"),
    player2Id: readString(row, "player2Id", "player2_id"),
    gameType,
    score: readNumber(row, "score") ?? 0,
    answers,
    timeTakenMs: readNumber(row, "timeTakenMs", "time_taken_ms") ?? null,
    status: readString(row, "status") ?? "playing",
    wagerAmount: readNumber(row, "wagerAmount", "wager_amount"),
    winnerId: readString(row, "winnerId", "winner_id") ?? null,
    createdAt: readDateValue(row, "createdAt", "created_at") ?? new Date().toISOString(),
    completedAt: readDateValue(row, "completedAt", "completed_at"),
  };
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((item) => item === undefined || isJsonValue(item));
}
