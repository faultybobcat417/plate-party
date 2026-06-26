import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createWager,
  getActiveWagerForParty,
  getWagerWithOptions,
  type CreateWagerInput,
  type WagerWithOptions,
} from "../api/wager";

interface WagerState {
  wagers: WagerWithOptions[];
  currentWager: WagerWithOptions | null;
  activeWager: WagerWithOptions | null;
  isLoading: boolean;
  error: string | null;

  loadWager: (wagerId: string) => Promise<void>;
  loadActiveWagerForParty: (partyId: string) => Promise<void>;
  createWager: (input: CreateWagerInput) => Promise<WagerWithOptions>;
  clearError: () => void;
}

export const useWagerStore = create<WagerState>()(
  persist(
    (set, get) => ({
      wagers: [],
      currentWager: null,
      activeWager: null,
      isLoading: false,
      error: null,

      loadWager: async (wagerId) => {
        set({ isLoading: true, error: null });
        try {
          const wager = await getWagerWithOptions(wagerId);
          set({ currentWager: wager, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadActiveWagerForParty: async (partyId) => {
        set({ isLoading: true, error: null });
        try {
          const wager = await getActiveWagerForParty(partyId);
          set({ activeWager: wager, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      createWager: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const wager = await createWager(input);
          set((state) => ({
            wagers: [...state.wagers, wager],
            currentWager: wager,
            activeWager: wager,
            isLoading: false,
          }));
          return wager;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "wager-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
