import { openSQLiteDatabase } from "../db/connection";
import { type Uuid } from "../db/schema";

export type MarketStats = {
  totalBetsPlaced: number;
  totalBetsWon: number;
  totalBetsLost: number;
  totalBetsVoid: number;
  winRate: number;
  totalPlatesWagered: number;
  totalPlatesWon: number;
  totalPlatesLost: number;
  netPlates: number;
  currentStreak: number;
  longestStreak: number;
  activeBetsCount: number;
};

export type ActiveBet = {
  id: Uuid;
  wagerId: Uuid;
  question: string;
  optionLabel: string;
  platesWagered: number;
  placedAt: string;
  deadline: string;
  partyName: string;
  potentialWinnings: number;
};

export type BetHistoryEntry = {
  id: Uuid;
  wagerId: Uuid;
  question: string;
  optionLabel: string;
  platesWagered: number;
  status: string;
  placedAt: string;
  resolvedAt: string | null;
  wonAmount: number | null;
  partyName: string;
};

export class MarketTrackerError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "MarketTrackerError";
  }
}

export const getMarketStats = async (userId: Uuid): Promise<MarketStats> => {
  const db = await openSQLiteDatabase();

  const stats = await db.getFirstAsync<{
    total_bets: number;
    total_won: number;
    total_lost: number;
    total_void: number;
    total_wagered: number;
    total_won_plates: number | null;
    total_lost_plates: number | null;
  }>(
    `select
      count(*) as total_bets,
      sum(case when status = 'won' then 1 else 0 end) as total_won,
      sum(case when status = 'lost' then 1 else 0 end) as total_lost,
      sum(case when status = 'void' then 1 else 0 end) as total_void,
      sum(plates_wagered) as total_wagered,
      sum(case when status = 'won' then plates_wagered else 0 end) as total_won_plates,
      sum(case when status = 'lost' then plates_wagered else 0 end) as total_lost_plates
     from bets where user_id = ? and deleted_at is null`,
    userId,
  );

  const activeBets = await db.getFirstAsync<{ count: number }>(
    "select count(*) as count from bets where user_id = ? and status in ('pending', 'locked') and deleted_at is null",
    userId,
  );

  const memberStats = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
  }>(
    "select current_streak, longest_streak from party_members where user_id = ? limit 1",
    userId,
  );

  const totalBets = stats?.total_bets ?? 0;
  const totalWon = stats?.total_won ?? 0;
  const winRate = totalBets > 0 ? Math.round((totalWon / totalBets) * 100) : 0;

  return {
    totalBetsPlaced: totalBets,
    totalBetsWon: totalWon,
    totalBetsLost: stats?.total_lost ?? 0,
    totalBetsVoid: stats?.total_void ?? 0,
    winRate,
    totalPlatesWagered: stats?.total_wagered ?? 0,
    totalPlatesWon: Number(stats?.total_won_plates ?? 0),
    totalPlatesLost: Number(stats?.total_lost_plates ?? 0),
    netPlates: Number(stats?.total_won_plates ?? 0) - Number(stats?.total_lost_plates ?? 0),
    currentStreak: memberStats?.current_streak ?? 0,
    longestStreak: memberStats?.longest_streak ?? 0,
    activeBetsCount: activeBets?.count ?? 0,
  };
};

export const getActiveBets = async (userId: Uuid): Promise<ActiveBet[]> => {
  const db = await openSQLiteDatabase();

  const rows = await db.getAllAsync<ActiveBet>(
    `select
      b.id, b.wager_id as wagerId, w.question, wo.label as optionLabel,
      b.plates_wagered as platesWagered, b.placed_at as placedAt, w.deadline,
      p.name as partyName,
      (select coalesce(sum(plates_wagered), 0) from bets where wager_id = b.wager_id and status in ('pending', 'locked')) as potentialWinnings
     from bets b
     join wagers w on w.id = b.wager_id
     join wager_options wo on wo.id = b.option_id
     join parties p on p.id = w.party_id
     where b.user_id = ? and b.status in ('pending', 'locked') and b.deleted_at is null
     order by b.placed_at desc`,
    userId,
  );

  return rows.map((r) => ({
    ...r,
    potentialWinnings: Number(r.potentialWinnings),
  }));
};

export const getBetHistory = async (userId: Uuid, limit = 50): Promise<BetHistoryEntry[]> => {
  const db = await openSQLiteDatabase();

  const rows = await db.getAllAsync<BetHistoryEntry>(
    `select
      b.id, b.wager_id as wagerId, w.question, wo.label as optionLabel,
      b.plates_wagered as platesWagered, b.status, b.placed_at as placedAt,
      b.resolved_at as resolvedAt,
      case when b.status = 'won' then b.plates_wagered else null end as wonAmount,
      p.name as partyName
     from bets b
     join wagers w on w.id = b.wager_id
     join wager_options wo on wo.id = b.option_id
     join parties p on p.id = w.party_id
     where b.user_id = ? and b.status in ('won', 'lost', 'void') and b.deleted_at is null
     order by b.resolved_at desc nulls last, b.placed_at desc
     limit ?`,
    [userId, limit],
  );

  return rows;
};
