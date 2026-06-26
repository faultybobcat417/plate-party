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

interface SyncState {
  pendingCount: number;
  isOnline: boolean;
  isProcessing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  outboxStats: OutboxStats;

  loadPendingCount: () => Promise<void>;
  loadOutboxStats: () => Promise<void>;
  processOutbox: (peers: SyncPeer[]) => Promise<void>;
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
          set({ outboxStats: stats });
        } catch (error) {
          set({ syncError: error instanceof Error ? error.message : "Unknown error" });
        }
      },

      processOutbox: async (peers) => {
        set({ isProcessing: true, syncError: null });
        try {
          await processOutbox(peers);
          set({ isProcessing: false, lastSyncTime: new Date().toISOString() });
        } catch (error) {
          set({ syncError: error instanceof Error ? error.message : "Unknown error", isProcessing: false });
        }
      },

      setOnline: (isOnline) => set({ isOnline }),
      clearError: () => set({ syncError: null }),
    }),
    {
      name: "sync-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
