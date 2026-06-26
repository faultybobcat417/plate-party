import { loadProfile } from "../utils/profileStorage";

export type MarketCategory = "sports" | "politics" | "crypto" | "weather" | "memes";

export type MarketOutcome = "yes" | "no";

export type Market = {
  id: string;
  title: string;
  category: MarketCategory;
  description: string;
  yesPrice: number; // 0-100 (cents per share)
  noPrice: number; // 0-100
  volume: number; // total plates traded
  expiresAt: string;
  resolved: boolean;
  resolutionOutcome: MarketOutcome | null;
  imageUrl?: string;
};

export type Trade = {
  id: string;
  marketId: string;
  userId: string;
  outcome: MarketOutcome;
  plates: number;
  dollars: number | null;
  price: number; // price at time of trade
  createdAt: string;
};

export type PlaceTradeInput = {
  marketId: string;
  outcome: MarketOutcome;
  plates: number;
  dollars: number | null;
};

const MOCK_MARKETS: Market[] = [
  {
    id: "mkt-1",
    title: "Raptors win NBA Championship 2026",
    category: "sports",
    description: "Will the Toronto Raptors win the 2026 NBA Finals?",
    yesPrice: 12,
    noPrice: 88,
    volume: 2450,
    expiresAt: "2026-06-30T23:59:59Z",
    resolved: false,
    resolutionOutcome: null,
    imageUrl: "🏀",
  },
  {
    id: "mkt-2",
    title: "BTC hits $200K before July",
    category: "crypto",
    description: "Will Bitcoin reach $200,000 USD on any exchange before July 1, 2026?",
    yesPrice: 34,
    noPrice: 66,
    volume: 18900,
    expiresAt: "2026-07-01T00:00:00Z",
    resolved: false,
    resolutionOutcome: null,
    imageUrl: "₿",
  },
  {
    id: "mkt-3",
    title: "It rains on Canada Day in Toronto",
    category: "weather",
    description: "Will there be measurable precipitation in Toronto on July 1, 2026?",
    yesPrice: 55,
    noPrice: 45,
    volume: 890,
    expiresAt: "2026-07-01T23:59:59Z",
    resolved: false,
    resolutionOutcome: null,
    imageUrl: "🌧️",
  },
  {
    id: "mkt-4",
    title: "Federal election called before fall",
    category: "politics",
    description: "Will a federal election be called in Canada before September 2026?",
    yesPrice: 62,
    noPrice: 38,
    volume: 4200,
    expiresAt: "2026-09-01T00:00:00Z",
    resolved: false,
    resolutionOutcome: null,
    imageUrl: "🏛️",
  },
  {
    id: "mkt-5",
    title: "Pepe coin flips Dogecoin market cap",
    category: "memes",
    description: "Will PEPE overtake DOGE in market capitalization for at least one day?",
    yesPrice: 18,
    noPrice: 82,
    volume: 5600,
    expiresAt: "2026-08-01T00:00:00Z",
    resolved: false,
    resolutionOutcome: null,
    imageUrl: "🐸",
  },
];

export async function listMarkets(category?: MarketCategory): Promise<Market[]> {
  // TODO: wire to SQLite when ready
  if (category) {
    return MOCK_MARKETS.filter((m) => m.category === category);
  }
  return MOCK_MARKETS;
}

export async function getMarket(id: string): Promise<Market | null> {
  return MOCK_MARKETS.find((m) => m.id === id) ?? null;
}

export async function placeTrade(input: PlaceTradeInput): Promise<Trade> {
  // TODO: wire to SQLite + ledger when ready
  if (!input.marketId) {
    throw new Error("Market is required.");
  }
  if (input.plates <= 0 || !Number.isFinite(input.plates)) {
    throw new Error("Plate amount must be a positive number.");
  }
  if (input.dollars !== null && (input.dollars < 0 || !Number.isFinite(input.dollars))) {
    throw new Error("Dollar amount must be non-negative.");
  }

  const market = await getMarket(input.marketId);
  if (!market) {
    throw new Error("Market not found.");
  }

  const price = input.outcome === "yes" ? market.yesPrice : market.noPrice;
  if (price <= 0) {
    throw new Error("Market price must be greater than zero.");
  }

  const profile = await loadProfile();
  const userId = profile?.id ?? "user-1";

  const trade: Trade = {
    id: `trade-${Date.now()}`,
    marketId: input.marketId,
    userId,
    outcome: input.outcome,
    plates: input.plates,
    dollars: input.dollars,
    price,
    createdAt: new Date().toISOString(),
  };

  market.volume += input.plates;
  return trade;
}

export function getCategoryLabel(category: MarketCategory): string {
  const labels: Record<MarketCategory, string> = {
    sports: "Sports",
    politics: "Politics",
    crypto: "Crypto",
    weather: "Weather",
    memes: "Memes",
  };
  return labels[category];
}

export function getCategoryEmoji(category: MarketCategory): string {
  const emojis: Record<MarketCategory, string> = {
    sports: "🏈",
    politics: "🏛️",
    crypto: "₿",
    weather: "🌤️",
    memes: "🐸",
  };
  return emojis[category];
}
