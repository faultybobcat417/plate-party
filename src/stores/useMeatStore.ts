import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createMeatPost,
  getMyMeatInteractions,
  interactWithMeatPost,
  listMeatPosts,
  updateMeatPostStatus,
  type CreateMeatPostInput,
  type InteractWithMeatPostInput,
  type MeatPost,
} from "../api/meat";
import {
  getMyDatingStats,
  getMyMatches,
  getDatingHistory,
  type DatingStats,
  type Match,
  type DatingHistoryEntry,
} from "../api/meetTracker";

interface MeatState {
  posts: MeatPost[];
  myPosts: MeatPost[];
  myInteractions: Awaited<ReturnType<typeof getMyMeatInteractions>>;
  datingStats: DatingStats | null;
  matches: Match[];
  datingHistory: DatingHistoryEntry[];
  isLoading: boolean;
  error: string | null;

  loadPosts: (userId?: string) => Promise<void>;
  loadMyInteractions: (userId: string) => Promise<void>;
  loadDatingStats: (userId: string) => Promise<void>;
  loadMatches: (userId: string) => Promise<void>;
  loadDatingHistory: (userId: string) => Promise<void>;
  addPost: (input: CreateMeatPostInput) => Promise<void>;
  interact: (input: InteractWithMeatPostInput) => Promise<void>;
  clearError: () => void;
}

export const useMeatStore = create<MeatState>()(
  persist(
    (set, get) => ({
      posts: [],
      myPosts: [],
      myInteractions: [],
      datingStats: null,
      matches: [],
      datingHistory: [],
      isLoading: false,
      error: null,

      loadPosts: async (userId?) => {
        set({ isLoading: true, error: null });
        try {
          const posts = await listMeatPosts(userId ?? "");
          set({ posts, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadMyInteractions: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const interactions = await getMyMeatInteractions(userId);
          set({ myInteractions: interactions, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadDatingStats: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const stats = await getMyDatingStats(userId);
          set({ datingStats: stats, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadMatches: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const matches = await getMyMatches(userId);
          set({ matches, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      loadDatingHistory: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const history = await getDatingHistory(userId);
          set({ datingHistory: history, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      addPost: async (input) => {
        set({ isLoading: true, error: null });
        try {
          await createMeatPost(input);
          set({ isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      interact: async (input) => {
        set({ isLoading: true, error: null });
        try {
          await interactWithMeatPost(input);
          set({ isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "meat-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
