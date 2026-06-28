import { create } from "zustand";

import { deleteProfile as deleteProfileApi, getProfile, updateProfile as updateProfileApi } from "../api/user";
import { getBalance } from "../api/plates";
import { type User } from "../db/schema";
import {
  registerOfflineMutationHandler,
  runOfflineAwareMutation,
  startOfflineQueueProcessor,
} from "../lib/offline";

type ProfileUpdates = Partial<User>;

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
  refreshBalance: (userId?: string) => Promise<void>;
  fetchTopGivers: () => Promise<User[]>;
  fetchProfile: (userId?: string) => Promise<void>;
  updateProfile: (updatesOrUserId: ProfileUpdates | string, updates?: ProfileUpdates) => Promise<void>;
  deleteProfile: (userId?: string) => Promise<void>;
  clearError: () => void;
}

const USER_UPDATE_PROFILE = "user.updateProfile";
const USER_DELETE_PROFILE = "user.deleteProfile";

registerOfflineMutationHandler(USER_UPDATE_PROFILE, async (payload) => {
  await updateProfileApi(payload as { userId?: string; displayName?: string; username?: string | null; avatarUrl?: string | null });
});
registerOfflineMutationHandler(USER_DELETE_PROFILE, async (payload) => {
  await deleteProfileApi(typeof payload.userId === "string" ? payload.userId : undefined);
});
startOfflineQueueProcessor();

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
    set({ isLoading: true, loading: true, error: null });
    try {
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, plates: currentUser.plates + amount };
        set({ user: updated, profile: updated });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to add plates" });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  deductPlates: async (amount) => {
    set({ isLoading: true, loading: true, error: null });
    try {
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, plates: Math.max(0, currentUser.plates - amount) };
        set({ user: updated, profile: updated });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to deduct plates" });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  refreshBalance: async (userId) => {
    set({ isLoading: true, loading: true, error: null });
    try {
      const balance = await getBalance(userId);
      const currentUser = get().user;
      const currentProfile = get().profile;
      set({
        user: currentUser ? { ...currentUser, plates: balance } : currentUser,
        profile: currentProfile ? { ...currentProfile, plates: balance } : currentProfile,
        error: null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to refresh balance" });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  fetchTopGivers: async () => {
    set({ isLoading: true, loading: true, error: null });
    try {
      const mockGivers: User[] = [];
      set({ topGivers: mockGivers });
      return mockGivers;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch top givers" });
      return [];
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  fetchProfile: async (userId) => {
    set({ isLoading: true, loading: true, error: null });
    try {
      const profile = await getProfile(userId);
      set({ user: profile, profile, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch profile" });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  updateProfile: async (inputOrUserId, maybeUpdates) => {
    const userId = typeof inputOrUserId === "string" ? inputOrUserId : undefined;
    const updates = typeof inputOrUserId === "string" ? maybeUpdates ?? {} : inputOrUserId;
    const previousUser = get().user;
    const previousProfile = get().profile;

    set({
      user: previousUser ? { ...previousUser, ...updates } : previousUser,
      profile: previousProfile ? { ...previousProfile, ...updates } : previousProfile,
      isLoading: true,
      loading: true,
      error: null,
    });

    try {
      const result = await runOfflineAwareMutation(
        USER_UPDATE_PROFILE,
        toProfilePayload(userId, updates),
        () => updateProfileApi(userId ? { ...updates, userId } : updates),
      );
      if (result.status === "executed") {
        set({ user: result.result, profile: result.result });
      }
    } catch (error) {
      set({
        user: previousUser,
        profile: previousProfile,
        error: error instanceof Error ? error.message : "Failed to update profile",
      });
      throw error;
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  deleteProfile: async (userId) => {
    const previousUser = get().user;
    const previousProfile = get().profile;
    set({ user: null, profile: null, isLoading: true, loading: true, error: null });
    try {
      await runOfflineAwareMutation(USER_DELETE_PROFILE, userId ? { userId } : {}, () => deleteProfileApi(userId));
    } catch (error) {
      set({
        user: previousUser,
        profile: previousProfile,
        error: error instanceof Error ? error.message : "Failed to delete profile",
      });
      throw error;
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

function toProfilePayload(userId: string | undefined, updates: ProfileUpdates): Record<string, unknown> {
  return {
    ...(userId ? { userId } : {}),
    ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
    ...(updates.username !== undefined ? { username: updates.username } : {}),
    ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
  };
}
