import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMarketsFromDb, fetchMarketByIdFromDb } from "../api/market";
import type { Market, MarketDetail } from "../api/market";
export type { Market, MarketDetail };
// Re-exported for component use

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
  executeTrade: (marketId: string, position: "yes" | "no", amount: number) => Promise<void>;
  clearError: () => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      markets: [], watchlist: [], selectedMarket: null, isLoading: false, error: null,
      loadMarkets: async () => {
        set({ isLoading: true });
        try { const markets = await fetchMarketsFromDb(); set({ markets, isLoading: false }); }
        catch (err) { set({ error: err instanceof Error ? err.message : "Failed to load markets", isLoading: false }); }
      },
      loadMarketDetails: async (marketId) => {
        set({ isLoading: true });
        try { const detail = await fetchMarketByIdFromDb(marketId); set({ selectedMarket: detail, isLoading: false }); return detail; }
        catch (err) { set({ error: err instanceof Error ? err.message : "Failed to load", isLoading: false }); throw err; }
      },
      fetchMarkets: async () => {
        set({ isLoading: true });
        try { const markets = await fetchMarketsFromDb(); set({ markets, isLoading: false }); }
        catch (err) { set({ error: err instanceof Error ? err.message : "Failed to load markets", isLoading: false }); }
      },
      fetchMarketById: async (id) => {
        const market = get().markets.find((m) => m.id === id);
        if (market) return market;
        const detail = await fetchMarketByIdFromDb(id);
        return { id: detail.id, title: detail.title, description: detail.description, category: detail.category, yesPrice: detail.yesPrice, noPrice: detail.noPrice, volume: detail.volume, endDate: detail.endDate, creatorId: detail.creatorId, createdAt: detail.createdAt, status: detail.status, resolution: detail.resolution };
      },
      toggleWatchlist: (marketId) => set((state) => ({ watchlist: state.watchlist.includes(marketId) ? state.watchlist.filter((id) => id !== marketId) : [...state.watchlist, marketId] })),
      addToWatchlist: (marketId) => set((state) => ({ watchlist: state.watchlist.includes(marketId) ? state.watchlist : [...state.watchlist, marketId] })),
      removeFromWatchlist: (marketId) => set((state) => ({ watchlist: state.watchlist.filter((id) => id !== marketId) })),
      selectMarket: (market) => set({ selectedMarket: market }),
      executeTrade: async (marketId, position, amount) => { console.log("Trade executed:", { marketId, position, amount }); },
      clearError: () => set({ error: null }),
    }),
    { name: "market-storage", storage: createJSONStorage(() => AsyncStorage), partialize: (state) => ({ watchlist: state.watchlist }) }
  )
);
