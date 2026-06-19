import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getLedgerBalance,
  getPartyAccountBalances,
  listLedgerEntriesForParty,
  reconcileStoredBalances,
  type AccountBalance,
} from "../api/ledger";
import type { LedgerAccountType, LedgerEntry, Uuid } from "../db/schema";

export type LedgerStoreState = {
  entries: LedgerEntry[];
  accountBalances: AccountBalance[];
  selectedBalance: number;
  isLoading: boolean;
  error: string | null;
};

export type LedgerStoreActions = {
  loadLedgerEntriesForParty: (partyId: Uuid, limit?: number) => Promise<void>;
  loadPartyAccountBalances: (partyId: Uuid) => Promise<void>;
  loadLedgerBalance: (
    accountType: LedgerAccountType,
    accountId: string,
    partyId?: Uuid,
  ) => Promise<void>;
  reconcilePartyBalances: (partyId: Uuid) => Promise<void>;
  clearError: () => void;
};

export type LedgerStore = LedgerStoreState & LedgerStoreActions;

const initialState: LedgerStoreState = {
  entries: [],
  accountBalances: [],
  selectedBalance: 0,
  isLoading: false,
  error: null,
};

export const useLedgerStore = create<LedgerStore>()(
  persist(
    (set) => ({
      ...initialState,

      loadLedgerEntriesForParty: async (partyId, limit) => {
        set({ isLoading: true, error: null });

        try {
          const entries = await listLedgerEntriesForParty(partyId, limit);
          set({ entries, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load ledger entries.",
            isLoading: false,
          });
        }
      },

      loadPartyAccountBalances: async (partyId) => {
        set({ isLoading: true, error: null });

        try {
          const accountBalances = await getPartyAccountBalances(partyId);
          set({ accountBalances, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load account balances.",
            isLoading: false,
          });
        }
      },

      loadLedgerBalance: async (accountType, accountId, partyId) => {
        set({ isLoading: true, error: null });

        try {
          const selectedBalance = await getLedgerBalance(accountType, accountId, partyId);
          set({ selectedBalance, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load ledger balance.",
            isLoading: false,
          });
        }
      },

      reconcilePartyBalances: async (partyId) => {
        set({ isLoading: true, error: null });

        try {
          await reconcileStoredBalances(partyId);
          const accountBalances = await getPartyAccountBalances(partyId);
          set({ accountBalances, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to reconcile balances.",
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "ledger-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
        accountBalances: state.accountBalances,
        selectedBalance: state.selectedBalance,
      }),
    },
  ),
);
