import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getPartyAccountBalances,
  listAllLedgerEntries,
  listLedgerEntriesForParty,
  type AccountBalance,
} from "../api/ledger";
import { LedgerEntry } from "../db/schema";

interface LedgerState {
  entries: LedgerEntry[];
  accountBalances: AccountBalance[];
  isLoading: boolean;
  error: string | null;

  loadLedgerEntriesForParty: (partyId: string, limit?: number) => Promise<void>;
  loadPartyAccountBalances: (partyId: string) => Promise<void>;
  loadAllEntries: (limit?: number) => Promise<void>;
  clearError: () => void;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      entries: [],
      accountBalances: [],
      isLoading: false,
      error: null,

      loadLedgerEntriesForParty: async (partyId, limit = 100) => {
        set({ isLoading: true, error: null });
        try {
          const entries = await listLedgerEntriesForParty(partyId, limit);
          set({ entries: entries as any, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadPartyAccountBalances: async (partyId) => {
        set({ isLoading: true, error: null });
        try {
          const balances = await getPartyAccountBalances(partyId);
          set({ accountBalances: balances, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadAllEntries: async (limit = 200) => {
        set({ isLoading: true, error: null });
        try {
          const entries = await listAllLedgerEntries(limit);
          set({ entries: entries as any, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "ledger-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
