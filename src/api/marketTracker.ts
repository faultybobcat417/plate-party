export type ActiveBet = {
  id: string;
  marketId: string;
  title: string;
  amount: number;
  position: "yes" | "no";
  createdAt: string;
};

export type BetHistoryEntry = ActiveBet & {
  status: "won" | "lost" | "void" | "active";
  payout?: number;
};

export type MarketStats = {
  activeCount: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
};

export type MarketAnalytics = {
  views: number;
  activeBets: number;
};

export async function trackMarketView(_marketId: string): Promise<void> {}

export async function getMarketAnalytics(_marketId: string): Promise<MarketAnalytics> {
  return { views: 0, activeBets: 0 };
}

export async function getActiveBets(_userId: string): Promise<ActiveBet[]> {
  return [];
}

export async function getBetHistory(_userId: string): Promise<BetHistoryEntry[]> {
  return [];
}

export async function getMarketStats(_userId: string): Promise<MarketStats> {
  return { activeCount: 0, totalWagered: 0, totalWon: 0, winRate: 0 };
}
