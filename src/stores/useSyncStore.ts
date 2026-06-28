import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  countPendingOutbox,
  getOutboxStats,
  processOutbox,
  type OutboxStats,
  type SyncPeer,
} from "../api/sync";
import {
  getOfflineQueueStats,
  processOfflineQueue,
  startOfflineQueueProcessor,
  subscribeToOfflineQueue,
} from "../lib/offline";

interface SyncState {
  pendingCount: number;
  isOnline: boolean;
  isProcessing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  outboxStats: OutboxStats;

  loadPendingCount: () => Promise<void>;
  loadOutboxStats: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  processOutbox: (peers?: SyncPeer[]) => Promise<void>;
  startSyncMonitor: () => () => void;
  setOnline: (isOnline: boolean) => void;
  clearError: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingCount: 0,
      isOnline: true,
      isProcessing: false,
      lastSyncTime: null,
      syncError: null,
      outboxStats: { pending: 0, sending: 0, sent: 0, failed: 0, conflicted: 0 },

      loadPendingCount: async () => {
        try {
          const count = await countPendingOutbox();
          set({ pendingCount: count });
        } catch (error) {
          set({ syncError: error instanceof Error ? error.message : "Unknown error" });
        }
      },

      loadOutboxStats: async () => {
        try {
          const stats = await getOutboxStats();
          set({ outboxStats: stats, pendingCount: stats.pending });
        } catch (error) {
          set({ syncError: error instanceof Error ? error.message : "Unknown error" });
        }
      },

      refreshStatus: async () => {
        const stats = await getOfflineQueueStats();
        set({
          pendingCount: stats.pending,
          isOnline: stats.isOnline,
          isProcessing: stats.processing,
          lastSyncTime: stats.lastProcessedAt,
          syncError: stats.lastError,
          outboxStats: {
            pending: stats.pending,
            sending: stats.processing ? stats.pending : 0,
            sent: 0,
            failed: stats.lastError ? 1 : 0,
            conflicted: 0,
          },
        });
      },

      processOutbox: async (peers = []) => {
        set({ isProcessing: true, syncError: null });
        try {
          await processOutbox(peers);
          await processOfflineQueue();
          await get().refreshStatus();
          set({ isProcessing: false, lastSyncTime: new Date().toISOString() });
        } catch (error) {
          set({ syncError: error instanceof Error ? error.message : "Unknown error", isProcessing: false });
        }
      },

      startSyncMonitor: () => {
        startOfflineQueueProcessor();
        void get().refreshStatus();
        return subscribeToOfflineQueue((stats) => {
          set({
            pendingCount: stats.pending,
            isOnline: stats.isOnline,
            isProcessing: stats.processing,
            lastSyncTime: stats.lastProcessedAt,
            syncError: stats.lastError,
            outboxStats: {
              pending: stats.pending,
              sending: stats.processing ? stats.pending : 0,
              sent: 0,
              failed: stats.lastError ? 1 : 0,
              conflicted: 0,
            },
          });
        });
      },

      setOnline: (isOnline) => set({ isOnline }),
      clearError: () => set({ syncError: null }),
    }),
    {
      name: "sync-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
