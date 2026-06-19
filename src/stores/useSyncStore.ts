import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  applyInboundMutations,
  countPendingOutbox,
  getOutboxStats,
  listPendingMutations,
  processOutbox,
  type InboundMutation,
  type OutboxStats,
  type ProcessOutboxResult,
  type SyncPeer,
} from "../api/sync";
import type { SyncOutboxEntry } from "../db/schema";

export type SyncStoreState = {
  pendingCount: number;
  outboxStats: OutboxStats;
  pendingMutations: SyncOutboxEntry[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
};

export type SyncStoreActions = {
  loadPendingCount: () => Promise<void>;
  loadOutboxStats: () => Promise<void>;
  loadPendingMutations: (limit?: number) => Promise<void>;
  processOutbox: (peers: SyncPeer[], limit?: number) => Promise<ProcessOutboxResult>;
  applyInboundMutations: (mutations: InboundMutation[]) => Promise<void>;
  clearError: () => void;
};

export type SyncStore = SyncStoreState & SyncStoreActions;

const initialState: SyncStoreState = {
  pendingCount: 0,
  outboxStats: {
    pending: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    conflicted: 0,
  },
  pendingMutations: [],
  isLoading: false,
  isProcessing: false,
  error: null,
};

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      ...initialState,

      loadPendingCount: async () => {
        set({ isLoading: true, error: null });

        try {
          const pendingCount = await countPendingOutbox();
          set({ pendingCount, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load pending count.",
            isLoading: false,
          });
        }
      },

      loadOutboxStats: async () => {
        set({ isLoading: true, error: null });

        try {
          const outboxStats = await getOutboxStats();
          set({ outboxStats, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load outbox stats.",
            isLoading: false,
          });
        }
      },

      loadPendingMutations: async (limit) => {
        set({ isLoading: true, error: null });

        try {
          const pendingMutations = await listPendingMutations(limit);
          set({ pendingMutations, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load pending mutations.",
            isLoading: false,
          });
        }
      },

      processOutbox: async (peers, limit) => {
        set({ isProcessing: true, error: null });

        try {
          const result = await processOutbox(peers, limit);
          const pendingCount = await countPendingOutbox();
          const outboxStats = await getOutboxStats();
          const pendingMutations = await listPendingMutations(limit);
          set({
            pendingCount,
            outboxStats,
            pendingMutations,
            isProcessing: false,
          });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to process outbox.",
            isProcessing: false,
          });
          throw error;
        }
      },

      applyInboundMutations: async (mutations) => {
        set({ isProcessing: true, error: null });

        try {
          await applyInboundMutations(mutations);
          const pendingCount = await countPendingOutbox();
          const outboxStats = await getOutboxStats();
          set({ pendingCount, outboxStats, isProcessing: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to apply inbound mutations.",
            isProcessing: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "sync-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pendingCount: state.pendingCount,
        outboxStats: state.outboxStats,
        pendingMutations: state.pendingMutations,
      }),
    },
  ),
);
