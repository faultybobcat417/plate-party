import { create } from "zustand";
import { type User } from "../db/schema";

export interface UserStoreState {
  user: User | null;
  profile: User | null;
  topGivers: User[];
  isLoading: boolean;
  loading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setProfile: (profile: User | null) => void;
  addPlates: (amount: number) => Promise<void>;
  deductPlates: (amount: number) => Promise<void>;
  fetchTopGivers: () => Promise<User[]>;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updatesOrUserId: Partial<User> | string, updates?: Partial<User>) => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: null,
  profile: null,
  topGivers: [],
  isLoading: false,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  addPlates: async (amount) => {
    set({ isLoading: true, loading: true });
    try {
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, plates: currentUser.plates + amount };
        set({ user: updated, profile: updated, error: null });
      }
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Failed to add plates" });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  deductPlates: async (amount) => {
    set({ isLoading: true, loading: true });
    try {
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, plates: Math.max(0, currentUser.plates - amount) };
        set({ user: updated, profile: updated, error: null });
      }
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Failed to deduct plates" });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  fetchTopGivers: async () => {
    set({ isLoading: true, loading: true });
    try {
      const mockGivers: User[] = [];
      set({ topGivers: mockGivers, error: null });
      return mockGivers;
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Failed to fetch top givers" });
      return [];
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  fetchProfile: async (_userId) => {
    set({ isLoading: true, loading: true });
    try {
      set({ error: null });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Failed to fetch profile" });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  updateProfile: async (inputOrUserId: Partial<User> | string, maybeUpdates?: Partial<User>) => {
    const updates = typeof inputOrUserId === "string" ? maybeUpdates ?? {} : inputOrUserId;
    const currentUser = get().user;
    const currentProfile = get().profile;
    set({
      user: currentUser ? { ...currentUser, ...updates } : currentUser,
      profile: currentProfile ? { ...currentProfile, ...updates } : currentProfile,
      error: null,
    });
  },
}));
