import { openSQLiteDatabase } from "../db/connection";
import { createDefaultHlc, createUuid, type Uuid } from "../db/schema";
import { enqueueMutation } from "./sync";

export type GameType = "trivia" | "plate_flip" | "wheel_spin" | "daily_challenge" | "speed_run" | "memory" | "questions" | "quick-math" | "rps" | "tic-tac-toe" | "word-guess";
export type GameResult = "win" | "loss" | "draw";

export type GameRecord = {
  id: Uuid;
  userId: Uuid;
  gameType: string;
  score: number;
  platesEarned: number;
  platesSpent: number;
  result: string;
  metadata: Record<string, unknown> | null;
  playedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hlc: string;
  lastModifiedByDeviceId: string | null;
};

export type RecordGameSessionInput = {
  userId: Uuid;
  gameType: GameType;
  score: number;
  platesEarned?: number;
  platesSpent?: number;
  result: GameResult;
  metadata?: Record<string, unknown>;
  deviceId?: string;
};

export type GameStats = {
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalPlatesEarned: number;
  totalPlatesSpent: number;
  netPlates: number;
  highScore: number;
  favoriteGame: string;
  winRate: number;
};

export type LeaderboardEntry = {
  userId: Uuid;
  displayName: string;
  avatarColor: string;
  totalScore: number;
  gamesPlayed: number;
  winRate: number;
};

export class GameRecordsError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "GameRecordsError";
  }
}

export const recordGameSession = async (input: RecordGameSessionInput): Promise<GameRecord> => {
  const db = await openSQLiteDatabase();
  const id = createUuid();
  const timestamp = new Date().toISOString();
  const hlc = createDefaultHlc();
  const deviceId = input.deviceId ?? "unknown";

  await db.runAsync(
    `insert into game_records (id, user_id, game_type, score, plates_earned, plates_spent, result, metadata, played_at, created_at, updated_at, hlc, last_modified_by_device_id)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, input.userId, input.gameType, input.score,
      input.platesEarned ?? 0, input.platesSpent ?? 0, input.result,
      JSON.stringify(input.metadata ?? {}), timestamp, timestamp, timestamp, hlc, deviceId,
    ],
  );

  const row = await db.getFirstAsync<GameRecord>(
    `select id, user_id as userId, game_type as gameType, score, plates_earned as platesEarned,
     plates_spent as platesSpent, result, metadata, played_at as playedAt, created_at as createdAt,
     updated_at as updatedAt, deleted_at as deletedAt, hlc, last_modified_by_device_id as lastModifiedByDeviceId
     from game_records where id = ?`,
    id,
  );

  if (!row) throw new GameRecordsError("Failed to record game session.");

  await enqueueMutation({
    tableName: "game_records",
    recordId: id,
    operation: "insert",
    payload: { id, userId: input.userId, gameType: input.gameType, score: input.score, result: input.result },
    deviceId,
    hlc,
  });

  return row;
};

export const getMyGameStats = async (userId: Uuid): Promise<GameStats> => {
  const db = await openSQLiteDatabase();

  const stats = await db.getFirstAsync<{
    total_games: number;
    total_wins: number;
    total_losses: number;
    total_draws: number;
    total_earned: number | null;
    total_spent: number | null;
    high_score: number | null;
  }>(
    `select
      count(*) as total_games,
      sum(case when result = 'win' then 1 else 0 end) as total_wins,
      sum(case when result = 'loss' then 1 else 0 end) as total_losses,
      sum(case when result = 'draw' then 1 else 0 end) as total_draws,
      sum(plates_earned) as total_earned,
      sum(plates_spent) as total_spent,
      max(score) as high_score
     from game_records where user_id = ? and deleted_at is null`,
    userId,
  );

  const favorite = await db.getFirstAsync<{ game_type: string; count: number }>(
    "select game_type, count(*) as count from game_records where user_id = ? and deleted_at is null group by game_type order by count desc limit 1",
    userId,
  );

  const totalGames = stats?.total_games ?? 0;
  const totalWins = stats?.total_wins ?? 0;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return {
    totalGamesPlayed: totalGames,
    totalWins,
    totalLosses: stats?.total_losses ?? 0,
    totalDraws: stats?.total_draws ?? 0,
    totalPlatesEarned: Number(stats?.total_earned ?? 0),
    totalPlatesSpent: Number(stats?.total_spent ?? 0),
    netPlates: Number(stats?.total_earned ?? 0) - Number(stats?.total_spent ?? 0),
    highScore: stats?.high_score ?? 0,
    favoriteGame: favorite?.game_type ?? "none",
    winRate,
  };
};

export const getGameLeaderboard = async (gameType: GameType, limit = 10): Promise<LeaderboardEntry[]> => {
  const db = await openSQLiteDatabase();

  const rows = await db.getAllAsync<LeaderboardEntry>(
    `select
      gr.user_id as userId,
      u.display_name as displayName,
      u.avatar_color as avatarColor,
      sum(gr.score) as totalScore,
      count(*) as gamesPlayed,
      round(100.0 * sum(case when gr.result = 'win' then 1 else 0 end) / count(*), 0) as winRate
     from game_records gr
     join users u on u.id = gr.user_id
     where gr.game_type = ? and gr.deleted_at is null
     group by gr.user_id, u.display_name, u.avatar_color
     order by totalScore desc
     limit ?`,
    [gameType, limit],
  );

  return rows;
};

export const getGameHistory = async (userId: Uuid, gameType?: GameType, limit = 50): Promise<GameRecord[]> => {
  const db = await openSQLiteDatabase();

  let sql = `select id, user_id as userId, game_type as gameType, score, plates_earned as platesEarned,
     plates_spent as platesSpent, result, metadata, played_at as playedAt, created_at as createdAt,
     updated_at as updatedAt, deleted_at as deletedAt, hlc, last_modified_by_device_id as lastModifiedByDeviceId
     from game_records where user_id = ? and deleted_at is null`;
  const params: (string | number)[] = [userId];

  if (gameType) {
    sql += " and game_type = ?";
    params.push(gameType);
  }

  sql += " order by played_at desc limit ?";
  params.push(limit);

  const rows = await db.getAllAsync<GameRecord>(sql, params);
  return rows;
};
