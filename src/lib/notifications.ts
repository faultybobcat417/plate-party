let Notifications: any = null;
let Device: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Device = require("expo-device");
} catch {
  // Packages not installed
}

import { z } from "zod";
import { supabase } from "./supabase";
import { useNotificationStore, type NotificationType } from "../stores/useNotificationStore";

const PushTokenSchema = z.string().min(1);

function setupNotificationHandler(): void {
  if (!Notifications || !Notifications.setNotificationHandler) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device || !Notifications) {
    console.warn("[Push] expo-notifications or expo-device not installed.");
    return null;
  }
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  const token = PushTokenSchema.parse(tokenData.data);
  await storePushToken(token);
  return token;
}

async function storePushToken(token: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  await supabase
    .from("users")
    .update({ push_token: token, updated_at: new Date().toISOString() })
    .eq("id", session.user.id);

  useNotificationStore.getState().setPushToken(token);
}

export function handleNotificationResponse(response: any): void {
  const data = response?.notification?.request?.content?.data ?? {};
  const deepLink = typeof data.deepLink === "string" ? data.deepLink : undefined;

  if (deepLink) {
    // Deep link handling wired in App.tsx via Linking
  }
}

export async function scheduleLocalNotification(
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: any,
): Promise<string> {
  if (!Notifications) {
    console.warn("[Push] expo-notifications not installed; local notification skipped.");
    return "";
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type, ...data },
      sound: "default",
    },
    trigger: trigger ?? null,
  });

  await useNotificationStore.getState().createNotification({
    type,
    title,
    body,
    deepLink: data?.deepLink as string | undefined,
  });

  return id;
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  if (!Notifications) return 0;
  return Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}

export function addNotificationReceivedListener(
  listener: (notification: any) => void,
): () => void {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationReceivedListener(listener);
  return () => subscription.remove();
}

export function addNotificationResponseReceivedListener(
  listener: (response: any) => void,
): () => void {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener(listener);
  return () => subscription.remove();
}

setupNotificationHandler();
