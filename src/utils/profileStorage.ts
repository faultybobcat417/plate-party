import AsyncStorage from "@react-native-async-storage/async-storage";

import { createUuid } from "../db/schema";
import { colors } from "../theme";

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

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getOrCreateDeviceId(): Promise<string> {
  const profile = await loadProfile();
  if (profile?.deviceId) return profile.deviceId;
  const deviceId = createUuid();
  await saveProfile({
    id: createUuid(),
    displayName: "",
    avatarColor: AVATAR_COLORS[0].value,
    deviceId,
  });
  return deviceId;
}
