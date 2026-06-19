import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createWager,
  getActiveWagerForParty,
  getWagerWithOptions,
  listWagersForParty,
  lockExpiredOpenWagers,
  type CreateWagerInput,
  type WagerWithOptions,
} from "../api/wager";
import type { Uuid, Wager } from "../db/schema";

export type WagerStoreState = {
  wagers: Wager[];
  currentWager: WagerWithOptions | null;
  activeWager: WagerWithOptions | null;
  isLoading: boolean;
  error: string | null;
};

export type WagerStoreActions = {
  loadWagersForParty: (partyId: Uuid, limit?: number) => Promise<void>;
  loadWager: (wagerId: Uuid) => Promise<void>;
  loadActiveWagerForParty: (partyId: Uuid) => Promise<void>;
  createWager: (input: CreateWagerInput) => Promise<WagerWithOptions>;
  lockExpiredWagers: (deviceId: string) => Promise<Wager[]>;
  setCurrentWager: (wager: WagerWithOptions | null) => void;
  clearError: () => void;
};

export type WagerStore = WagerStoreState & WagerStoreActions;

const initialState: WagerStoreState = {
  wagers: [],
  currentWager: null,
  activeWager: null,
  isLoading: false,
  error: null,
};

export const useWagerStore = create<WagerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadWagersForParty: async (partyId, limit) => {
        set({ isLoading: true, error: null });

        try {
          const wagers = await listWagersForParty(partyId, limit);
          set({ wagers, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load wagers.",
            isLoading: false,
          });
        }
      },

      loadWager: async (wagerId) => {
        set({ isLoading: true, error: null });

        try {
          const wager = await getWagerWithOptions(wagerId);
          set({ currentWager: wager, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load wager.",
            isLoading: false,
          });
        }
      },

      loadActiveWagerForParty: async (partyId) => {
        set({ isLoading: true, error: null });

        try {
          const wager = await getActiveWagerForParty(partyId);
          set({ activeWager: wager, currentWager: wager, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load active wager.",
            isLoading: false,
          });
        }
      },

      createWager: async (input) => {
        set({ isLoading: true, error: null });

        try {
          const result = await createWager(input);
          const wagers = [result.wager, ...get().wagers];
          set({
            wagers,
            currentWager: result,
            activeWager: result,
            isLoading: false,
          });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to create wager.",
            isLoading: false,
          });
          throw error;
        }
      },

      lockExpiredWagers: async (deviceId) => {
        set({ isLoading: true, error: null });

        try {
          const locked = await lockExpiredOpenWagers(deviceId);
          set({ isLoading: false });
          return locked;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to lock expired wagers.",
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentWager: (wager) => {
        set({ currentWager: wager });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "wager-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        wagers: state.wagers,
        currentWager: state.currentWager,
        activeWager: state.activeWager,
      }),
    },
  ),
);
