import * as Crypto from "expo-crypto";

export type BetStatus = "pending" | "active" | "locked" | "won" | "lost" | "void";
export type BetSide = "yes" | "no";

export interface Bet {
  id: string;
  userId: string;
  marketId?: string;
  wagerId: string;
  optionId?: string;
  amount: number;
  platesWagered: number;
  side: BetSide;
  createdAt: string;
  status: BetStatus;
}

export type PlaceBetInput = {
  userId: string;
  wagerId: string;
  optionId?: string;
  marketId?: string;
  amount?: number;
  platesWagered?: number;
  side?: BetSide;
};

export type BetWithDetails = Bet & {
  optionLabel?: string;
  displayName?: string;
};

export type UserBetWithDetails = BetWithDetails & {
  wagerTitle?: string;
};

export async function placeBet(input: PlaceBetInput): Promise<Bet> {
  const platesWagered = input.platesWagered ?? input.amount ?? 0;

  return {
    id: Crypto.randomUUID(),
    userId: input.userId,
    marketId: input.marketId,
    wagerId: input.wagerId,
    optionId: input.optionId,
    amount: platesWagered,
    platesWagered,
    side: input.side ?? "yes",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export async function getBetsForMarket(_marketId: string): Promise<Bet[]> {
  return [];
}

export async function getUserBets(_userId: string): Promise<Bet[]> {
  return [];
}

export async function getBetsForUser(userId: string): Promise<UserBetWithDetails[]> {
  const bets = await getUserBets(userId);
  return bets;
}

export async function getBetsForWager(_wagerId: string): Promise<BetWithDetails[]> {
  return [];
}

export async function lockBetsForWager(_wagerId: string, _deviceId?: string): Promise<void> {}
