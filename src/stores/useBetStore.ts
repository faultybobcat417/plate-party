import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getBetsForWager,
  getUserBets,
  placeBet,
  type BetWithUser,
  type BetWithWager,
  type PlaceBetInput,
} from "../api/bet";
import type { Bet, Uuid } from "../db/schema";

export type BetStoreState = {
  betsForWager: BetWithUser[];
  userBets: BetWithWager[];
  currentBet: Bet | null;
  isLoading: boolean;
  error: string | null;
};

export type BetStoreActions = {
  loadBetsForWager: (wagerId: Uuid) => Promise<void>;
  loadUserBets: (userId: Uuid, limit?: number) => Promise<void>;
  placeBet: (input: PlaceBetInput) => Promise<Bet>;
  setCurrentBet: (bet: Bet | null) => void;
  clearError: () => void;
};

export type BetStore = BetStoreState & BetStoreActions;

const initialState: BetStoreState = {
  betsForWager: [],
  userBets: [],
  currentBet: null,
  isLoading: false,
  error: null,
};

export const useBetStore = create<BetStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadBetsForWager: async (wagerId) => {
        set({ isLoading: true, error: null });

        try {
          const bets = await getBetsForWager(wagerId);
          set({ betsForWager: bets, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load bets.",
            isLoading: false,
          });
        }
      },

      loadUserBets: async (userId, limit) => {
        set({ isLoading: true, error: null });

        try {
          const bets = await getUserBets(userId, limit);
          set({ userBets: bets, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load user bets.",
            isLoading: false,
          });
        }
      },

      placeBet: async (input) => {
        set({ isLoading: true, error: null });

        try {
          const bet = await placeBet(input);
          const userBets = [bet as BetWithWager, ...get().userBets];
          const betsForWager = [...get().betsForWager];
          const existingIndex = betsForWager.findIndex(
            (existing) => existing.userId === bet.userId,
          );

          if (existingIndex >= 0) {
            betsForWager[existingIndex] = { ...betsForWager[existingIndex], ...bet };
          }

          set({
            currentBet: bet,
            userBets,
            betsForWager,
            isLoading: false,
          });
          return bet;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to place bet.",
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentBet: (bet) => {
        set({ currentBet: bet });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "bet-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        betsForWager: state.betsForWager,
        userBets: state.userBets,
        currentBet: state.currentBet,
      }),
    },
  ),
);
