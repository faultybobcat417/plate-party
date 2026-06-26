import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type LeaderboardEntry,
  type GroupLeaderboardEntry,
  type LeaderboardMode,
  type LeaderboardType,
  getLeaderboard,
} from "../api/leaderboard";

interface LeaderboardStore {
  entries: LeaderboardEntry[] | GroupLeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  mode: LeaderboardMode;
  type: LeaderboardType;
  userRank: number | null;
  loadLeaderboard: () => Promise<void>;
  setMode: (mode: LeaderboardMode) => void;
  setType: (type: LeaderboardType) => void;
  clearError: () => void;
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoading: false,
      error: null,
      mode: "daily",
      type: "individual",
      userRank: null,

      loadLeaderboard: async () => {
        set({ isLoading: true });
        try {
          const { mode, type } = get();
          const entries = await getLeaderboard(mode, type);
          set({ entries, isLoading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : "Unknown error", isLoading: false });
        }
      },

      setMode: (mode) => set({ mode }),
      setType: (type) => set({ type }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "leaderboard-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
