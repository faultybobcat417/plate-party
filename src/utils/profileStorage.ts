import AsyncStorage from "@react-native-async-storage/async-storage";

import { enqueueMutation } from "../api/sync";
import { getDb } from "../db/connection";
import { createDefaultHlc, createUuid, users } from "../db/schema";
import { colors } from "../theme";
import { CURRENT_USER_ID_KEY } from "./identity";

const PROFILE_KEY = "plate-party-profile";

export type UserProfile = {
  id: string;
  displayName: string;
  avatarColor: string;
  deviceId: string;
  venmoHandle?: string;
  cashAppHandle?: string;
  paypalMeHandle?: string;
};

export const AVATAR_COLORS = [
  { name: "Glaze", value: colors.glaze[500] },
  { name: "Mustard", value: colors.mustard[500] },
  { name: "Wine", value: colors.wine[500] },
  { name: "Clay", value: colors.clay[500] },
  { name: "Iron", value: colors.iron[500] },
];

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

async function upsertUserRow(
  profile: UserProfile,
): Promise<{ hlc: string; now: string }> {
  const db = await getDb();
  const now = new Date().toISOString();
  const hlc = createDefaultHlc();

  await db
    .insert(users)
    .values({
      id: profile.id,
      displayName: profile.displayName,
      avatarColor: profile.avatarColor,
      deviceId: profile.deviceId,
      venmoHandle: profile.venmoHandle ?? null,
      cashAppHandle: profile.cashAppHandle ?? null,
      paypalMeHandle: profile.paypalMeHandle ?? null,
      createdAt: now,
      updatedAt: now,
      hlc,
      lastModifiedByDeviceId: profile.deviceId,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        displayName: profile.displayName,
        avatarColor: profile.avatarColor,
        deviceId: profile.deviceId,
        venmoHandle: profile.venmoHandle ?? null,
        cashAppHandle: profile.cashAppHandle ?? null,
        paypalMeHandle: profile.paypalMeHandle ?? null,
        updatedAt: now,
        hlc,
        lastModifiedByDeviceId: profile.deviceId,
      },
    });

  return { hlc, now };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  try {
    const { hlc, now } = await upsertUserRow(profile);
    await AsyncStorage.setItem(CURRENT_USER_ID_KEY, profile.id);
    await enqueueMutation({
      tableName: "users",
      recordId: profile.id,
      operation: "upsert",
      payload: {
        id: profile.id,
        displayName: profile.displayName,
        avatarColor: profile.avatarColor,
        deviceId: profile.deviceId,
        venmoHandle: profile.venmoHandle ?? null,
        cashAppHandle: profile.cashAppHandle ?? null,
        paypalMeHandle: profile.paypalMeHandle ?? null,
        createdAt: now,
        updatedAt: now,
        hlc,
        lastModifiedByDeviceId: profile.deviceId,
      },
      deviceId: profile.deviceId,
      hlc,
    });
  } catch (error) {
    console.error("Failed to persist profile to SQLite:", error);
  }
}

export async function syncProfileToDatabase(): Promise<void> {
  const profile = await loadProfile();
  if (!profile) return;

  try {
    await upsertUserRow(profile);
    await AsyncStorage.setItem(CURRENT_USER_ID_KEY, profile.id);
  } catch (error) {
    console.error("Failed to sync existing profile to SQLite:", error);
  }
}

export async function ensureDefaultProfile(): Promise<UserProfile> {
  const existing = await loadProfile();
  if (existing) {
    await AsyncStorage.setItem(CURRENT_USER_ID_KEY, existing.id);
    return existing;
  }

  const profile: UserProfile = {
    id: createUuid(),
    displayName: "Plate Tester",
    avatarColor: AVATAR_COLORS[0].value,
    deviceId: createUuid(),
  };
  await saveProfile(profile);
  return profile;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const profile = await loadProfile();
  if (profile?.deviceId) {
    await AsyncStorage.setItem(CURRENT_USER_ID_KEY, profile.id);
    return profile.deviceId;
  }
  const deviceId = createUuid();
  await saveProfile({
    id: createUuid(),
    displayName: "",
    avatarColor: AVATAR_COLORS[0].value,
    deviceId,
  });
  return deviceId;
}
