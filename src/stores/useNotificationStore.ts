import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  registerOfflineMutationHandler,
  runOfflineAwareMutation,
  startOfflineQueueProcessor,
} from "../lib/offline";

export type NotificationType =
  | "challenge_won"
  | "challenge_lost"
  | "game_invite"
  | "party_invite"
  | "proof_reviewed"
  | "plate_purchase"
  | "streak_reminder";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLink?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  challengeResults: boolean;
  gameInvites: boolean;
  partyInvites: boolean;
  purchases: boolean;
  streakReminders: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  pushToken: string | null;
  isLoading: boolean;
  loading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  createNotification: (input: Omit<AppNotification, "id" | "createdAt" | "readAt">) => Promise<AppNotification>;
  markRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  setPushToken: (token: string | null) => Promise<void>;
  clearError: () => void;
}

const NOTIFICATION_UPDATE_PREFS = "notification.updatePreferences";
const NOTIFICATION_SET_TOKEN = "notification.setPushToken";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  challengeResults: true,
  gameInvites: true,
  partyInvites: true,
  purchases: true,
  streakReminders: true,
};

registerOfflineMutationHandler(NOTIFICATION_UPDATE_PREFS, async () => undefined);
registerOfflineMutationHandler(NOTIFICATION_SET_TOKEN, async () => undefined);
startOfflineQueueProcessor();

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: DEFAULT_PREFERENCES,
      pushToken: null,
      isLoading: false,
      loading: false,
      error: null,

      fetchNotifications: async () => {
        set({ isLoading: true, loading: true, error: null });
        set({ isLoading: false, loading: false });
      },

      createNotification: async (input) => {
        const notification: AppNotification = {
          ...input,
          id: Crypto.randomUUID(),
          readAt: null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notifications: [notification, ...state.notifications], error: null }));
        return notification;
      },

      markRead: async (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, readAt: new Date().toISOString() } : notification,
          ),
          error: null,
        }));
      },

      deleteNotification: async (notificationId) => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== notificationId),
          error: null,
        }));
      },

      updatePreferences: async (preferences) => {
        const previous = get().preferences;
        const next = { ...previous, ...preferences };
        set({ preferences: next, isLoading: true, loading: true, error: null });
        try {
          await runOfflineAwareMutation(NOTIFICATION_UPDATE_PREFS, next, async () => undefined);
        } catch (error) {
          set({ preferences: previous, error: error instanceof Error ? error.message : "Failed to save preferences" });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      setPushToken: async (token) => {
        const previous = get().pushToken;
        set({ pushToken: token, isLoading: true, loading: true, error: null });
        try {
          await runOfflineAwareMutation(NOTIFICATION_SET_TOKEN, { token }, async () => undefined);
        } catch (error) {
          set({ pushToken: previous, error: error instanceof Error ? error.message : "Failed to save push token" });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "notification-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
