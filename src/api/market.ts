export type MarketCategory = "sports" | "politics" | "entertainment" | "crypto" | "tech" | "other";

export function getCategoryEmoji(category: MarketCategory): string {
  const emojis: Record<MarketCategory, string> = {
    sports: "🏆",
    politics: "🏛️",
    entertainment: "🎬",
    crypto: "₿",
    tech: "💻",
    other: "📊",
  };
  return emojis[category] ?? emojis.other;
}

export function getCategoryLabel(category: MarketCategory): string {
  const labels: Record<MarketCategory, string> = {
    sports: "Sports",
    politics: "Politics",
    entertainment: "Entertainment",
    crypto: "Crypto",
    tech: "Tech",
    other: "Other",
  };
  return labels[category] ?? category;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  yesPrice: number;
  noPrice: number;
  volume: number;
  imageUrl?: string;
  endDate?: string;
  creatorId?: string;
  createdAt?: string;
  status?: "open" | "closed" | "resolved";
  resolution?: string | null;
}

export interface MarketDetail extends Market {
  totalVolume: number;
  resolutionSource?: string;
}

export async function fetchMarketsFromDb(): Promise<Market[]> {
  return [];
}

export async function fetchMarketByIdFromDb(id: string): Promise<MarketDetail> {
  return {
    id,
    title: "Market",
    description: "",
    category: "other",
    yesPrice: 0.5,
    noPrice: 0.5,
    volume: 0,
    totalVolume: 0,
    status: "open",
  };
}
