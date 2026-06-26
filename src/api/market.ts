import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db/connection";
import { wagers, wagerOptions, bets } from "../db/schema";

export interface Market {
  id: string;
  title: string;
  description: string;
  category?: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate?: string;
  imageUrl?: string;
  creatorId?: string;
  createdAt?: string;
  status?: "open" | "closed" | "resolved";
  resolution?: "yes" | "no" | null;
}

export interface MarketDetail extends Market {
  relatedMarkets: Market[];
  priceHistory: Array<{ date: string; yesPrice: number; noPrice: number }>;
  totalVolume: number;
  liquidity: number;
  spread: number;
}

export type MarketCategory =
  | "technology"
  | "finance"
  | "sports"
  | "climate"
  | "politics"
  | "entertainment"
  | "science"
  | "default";

export function getCategoryEmoji(category?: string): string {
  const map: Record<string, string> = {
    technology: "💻", finance: "💰", sports: "🏆", climate: "🌍",
    politics: "🏛️", entertainment: "🎬", science: "🔬",
  };
  return map[category?.toLowerCase() || ""] || "📊";
}

export function getCategoryLabel(category?: string): string {
  return (category ? category.charAt(0).toUpperCase() + category.slice(1) : "General");
}

export async function fetchMarketsFromDb(): Promise<Market[]> {
  const db = await getDb();
  const wagerRows = await db.select().from(wagers).where(and(eq(wagers.status, "open"), sql`${wagers.deletedAt} is null`));
  const markets: Market[] = [];

  for (const wager of wagerRows) {
    const options = await db.select().from(wagerOptions).where(eq(wagerOptions.wagerId, wager.id));
    const betsForWager = await db.select().from(bets).where(eq(bets.wagerId, wager.id));
    const totalVolume = betsForWager.reduce((sum, b) => sum + b.platesWagered, 0);
    const yesOption = options.find((o) => o.label.toLowerCase() === "yes");
    const noOption = options.find((o) => o.label.toLowerCase() === "no");
    const yesPrice = yesOption ? Math.min((yesOption.sortOrder + 1) * 0.1, 0.99) : 0.5;
    const noPrice = noOption ? Math.min((noOption.sortOrder + 1) * 0.1, 0.99) : 0.5;

    markets.push({
      id: wager.id, title: wager.question, description: "", category: undefined,
      yesPrice, noPrice, volume: totalVolume, endDate: wager.deadline,
      creatorId: wager.createdByUserId, createdAt: wager.createdAt,
      status: wager.status === "open" ? "open" : "closed", resolution: null,
    });
  }
  return markets;
}

export async function fetchMarketByIdFromDb(id: string): Promise<MarketDetail> {
  const db = await getDb();
  const [wager] = await db.select().from(wagers).where(eq(wagers.id, id)).limit(1);
  if (!wager) throw new Error(`Market ${id} not found`);

  const options = await db.select().from(wagerOptions).where(eq(wagerOptions.wagerId, wager.id));
  const betsForWager = await db.select().from(bets).where(eq(bets.wagerId, wager.id));
  const totalVolume = betsForWager.reduce((sum, b) => sum + b.platesWagered, 0);
  const yesOption = options.find((o) => o.label.toLowerCase() === "yes");
  const noOption = options.find((o) => o.label.toLowerCase() === "no");
  const yesPrice = yesOption ? Math.min((yesOption.sortOrder + 1) * 0.1, 0.99) : 0.5;
  const noPrice = noOption ? Math.min((noOption.sortOrder + 1) * 0.1, 0.99) : 0.5;

  return {
    id: wager.id, title: wager.question, description: "", category: undefined,
    yesPrice, noPrice, volume: totalVolume, endDate: wager.deadline,
    creatorId: wager.createdByUserId, createdAt: wager.createdAt,
    status: wager.status === "open" ? "open" : "closed", resolution: null,
    relatedMarkets: [], priceHistory: [], totalVolume, liquidity: 1000, spread: 0.1,
  };
}
