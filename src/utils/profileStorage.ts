import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const PROFILE_KEY = "@plateparty:profile";
const USER_ID_KEY = "@plateparty:userId";
const ONBOARDING_KEY = "@plateparty:onboardingComplete";
const AGE_VERIFIED_KEY = "@plateparty:ageVerified";

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  plates: number;
  avatarUrl?: string | null;
  deviceId?: string;
  createdAt?: string;
  updatedAt?: string;
  avatarColor?: string;
  venmoHandle?: string;
  cashAppHandle?: string;
  paypalMeHandle?: string;
}

export const AVATAR_COLORS = [
  { name: "Red", value: "#FF6B6B" },
  { name: "Teal", value: "#4ECDC4" },
  { name: "Blue", value: "#45B7D1" },
  { name: "Green", value: "#96CEB4" },
  { name: "Yellow", value: "#FFEAA7" },
  { name: "Purple", value: "#DDA0DD" },
  { name: "Mint", value: "#98D8C8" },
  { name: "Gold", value: "#F7DC6F" },
  { name: "Lavender", value: "#BB8FCE" },
  { name: "Sky", value: "#85C1E9" },
];

export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const id = profile.id || Crypto.randomUUID();
  const newProfile: UserProfile = {
    id,
    displayName: profile.displayName || "Plate Tester",
    username: profile.username || `user_${id.slice(-6)}`,
    plates: profile.plates ?? 100,
    avatarUrl: profile.avatarUrl || null,
    deviceId: profile.deviceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    avatarColor: profile.avatarColor,
    venmoHandle: profile.venmoHandle,
    cashAppHandle: profile.cashAppHandle,
    paypalMeHandle: profile.paypalMeHandle,
  };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  await AsyncStorage.setItem(USER_ID_KEY, id);
  return newProfile;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const cached = await AsyncStorage.getItem(PROFILE_KEY);
  return cached ? JSON.parse(cached) : null;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getUserProfile();
  if (!current) throw new Error("No profile found");
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  return updated;
}

export async function syncProfileToDatabase(): Promise<void> {
  // NO-OP: Supabase is the source of truth. Local profile is cache only.
}

export async function getCurrentUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_ID_KEY);
}

export async function getPlates(): Promise<number> {
  const profile = await getUserProfile();
  return profile?.plates ?? 0;
}

export async function setPlates(amount: number): Promise<void> {
  const profile = await getUserProfile();
  if (!profile) throw new Error("No profile found");
  await updateUserProfile({ plates: amount });
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === "true";
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, complete ? "true" : "false");
}

export async function isAgeVerified(): Promise<boolean> {
  const val = await AsyncStorage.getItem(AGE_VERIFIED_KEY);
  return val === "true";
}

export async function setAgeVerified(verified: boolean): Promise<void> {
  await AsyncStorage.setItem(AGE_VERIFIED_KEY, verified ? "true" : "false");
}

export const loadProfile = getUserProfile;
export const saveProfile = createUserProfile;

export default {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  syncProfileToDatabase,
  getCurrentUserId,
  getPlates,
  setPlates,
  hasCompletedOnboarding,
  setOnboardingComplete,
  isAgeVerified,
  setAgeVerified,
};
