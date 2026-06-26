import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getBetsForUser,
  getBetsForWager,
  placeBet,
  type BetWithDetails,
  type PlaceBetInput,
  type UserBetWithDetails,
} from "../api/bet";
import {
  getActiveBets,
  getBetHistory,
  getMarketStats,
  type ActiveBet,
  type BetHistoryEntry,
  type MarketStats,
} from "../api/marketTracker";

interface BetState {
  betsForWager: BetWithDetails[];
  userBets: UserBetWithDetails[];
  activeBets: ActiveBet[];
  betHistory: BetHistoryEntry[];
  marketStats: MarketStats | null;
  isLoading: boolean;
  error: string | null;

  loadBetsForWager: (wagerId: string) => Promise<void>;
  loadActiveBets: (userId: string) => Promise<void>;
  loadBetHistory: (userId: string) => Promise<void>;
  loadMarketStats: (userId: string) => Promise<void>;
  placeBet: (input: PlaceBetInput) => Promise<void>;
  clearError: () => void;
}

export const useBetStore = create<BetState>()(
  persist(
    (set, get) => ({
      betsForWager: [],
      userBets: [],
      activeBets: [],
      betHistory: [],
      marketStats: null,
      isLoading: false,
      error: null,

      loadBetsForWager: async (wagerId) => {
        set({ isLoading: true, error: null });
        try {
          const bets = await getBetsForWager(wagerId);
          set({ betsForWager: bets, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadActiveBets: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const bets = await getActiveBets(userId);
          set({ activeBets: bets, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadBetHistory: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const history = await getBetHistory(userId);
          set({ betHistory: history, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadMarketStats: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const stats = await getMarketStats(userId);
          set({ marketStats: stats, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      placeBet: async (input) => {
        set({ isLoading: true, error: null });
        try {
          await placeBet(input);
          const bets = await getBetsForWager(input.wagerId);
          set({ betsForWager: bets, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "bet-store-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
