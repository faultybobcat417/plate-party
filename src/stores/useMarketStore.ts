import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  status?: 'open' | 'closed' | 'resolved';
  resolution?: 'yes' | 'no' | null;
  relatedMarkets?: Market[];
}

export interface MarketDetail extends Market {
  relatedMarkets: Market[];
  priceHistory: Array<{ date: string; yesPrice: number; noPrice: number }>;
  totalVolume: number;
  liquidity: number;
  spread: number;
}

interface MarketState {
  markets: Market[];
  watchlist: string[];
  selectedMarket: MarketDetail | null;
  isLoading: boolean;
  error: string | null;
  loadMarkets: () => Promise<void>;
  loadMarketDetails: (marketId: string) => Promise<MarketDetail>;
  fetchMarkets: () => Promise<void>;
  fetchMarketById: (id: string) => Promise<Market>;
  toggleWatchlist: (marketId: string) => void;
  addToWatchlist: (marketId: string) => void;
  removeFromWatchlist: (marketId: string) => void;
  selectMarket: (market: MarketDetail | null) => void;
  executeTrade: (marketId: string, position: 'yes' | 'no', amount: number) => Promise<void>;
  clearError: () => void;
}

const mockMarkets: Market[] = [
  { id: 'm1', title: 'Will it rain tomorrow?', description: 'Predict the weather', category: 'Science', yesPrice: 0.65, noPrice: 0.35, volume: 1200, imageUrl: 'https://picsum.photos/seed/weather/400/200' },
  { id: 'm2', title: 'Team A wins the finals?', description: 'Sports prediction', category: 'Sports', yesPrice: 0.45, noPrice: 0.55, volume: 3400, imageUrl: 'https://picsum.photos/seed/sports/400/200' },
  { id: 'm3', title: 'Bitcoin hits $100k by EOY?', description: 'Crypto prediction', category: 'Crypto', yesPrice: 0.72, noPrice: 0.28, volume: 8900, imageUrl: 'https://picsum.photos/seed/crypto/400/200' },
  { id: 'm4', title: 'Election winner prediction', description: 'Political forecast', category: 'Politics', yesPrice: 0.55, noPrice: 0.45, volume: 5600, imageUrl: 'https://picsum.photos/seed/politics/400/200' },
  { id: 'm5', title: 'New Marvel movie tops box office?', description: 'Entertainment', category: 'Entertainment', yesPrice: 0.60, noPrice: 0.40, volume: 2100, imageUrl: 'https://picsum.photos/seed/movies/400/200' },
  { id: 'm6', title: 'Fed cuts rates in Q3?', description: 'Economic forecast', category: 'Economy', yesPrice: 0.38, noPrice: 0.62, volume: 4500, imageUrl: 'https://picsum.photos/seed/economy/400/200' },
];

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      markets: mockMarkets,
      watchlist: [],
      selectedMarket: null,
      isLoading: false,
      error: null,
      loadMarkets: async () => {
        set({ isLoading: true });
        try {
          await new Promise((r) => setTimeout(r, 500));
          set({ markets: mockMarkets, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      loadMarketDetails: async (marketId) => {
        set({ isLoading: true });
        try {
          const market = get().markets.find((m) => m.id === marketId);
          if (!market) throw new Error('Market not found');
          const detail: MarketDetail = {
            ...market,
            relatedMarkets: get().markets.filter((m) => m.id !== marketId).slice(0, 3),
            priceHistory: [],
            totalVolume: market.volume,
            liquidity: 1000,
            spread: 0.1,
          };
          set({ selectedMarket: detail, isLoading: false });
          return detail;
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to load', isLoading: false });
          throw err;
        }
      },
      fetchMarkets: async () => {
        set({ isLoading: true });
        try {
          await new Promise((r) => setTimeout(r, 500));
          set({ markets: mockMarkets, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      fetchMarketById: async (id) => {
        const market = get().markets.find((m) => m.id === id);
        if (!market) throw new Error('Market not found');
        return market;
      },
      toggleWatchlist: (marketId) => {
        set((state) => ({
          watchlist: state.watchlist.includes(marketId)
            ? state.watchlist.filter((id) => id !== marketId)
            : [...state.watchlist, marketId],
        }));
      },
      addToWatchlist: (marketId) => {
        set((state) => ({
          watchlist: state.watchlist.includes(marketId) ? state.watchlist : [...state.watchlist, marketId],
        }));
      },
      removeFromWatchlist: (marketId) => {
        set((state) => ({
          watchlist: state.watchlist.filter((id) => id !== marketId),
        }));
      },
      selectMarket: (market) => set({ selectedMarket: market }),
      executeTrade: async (marketId, position, amount) => {
        // TODO: implement trade execution
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'market-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
