import AsyncStorage from "@react-native-async-storage/async-storage";

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
}

export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const id = profile.id || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newProfile: UserProfile = {
    id,
    displayName: profile.displayName || "Plate Tester",
    username: profile.username || `user_${id.slice(-6)}`,
    plates: profile.plates ?? 100,
    avatarUrl: profile.avatarUrl || null,
    deviceId: profile.deviceId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  // This function exists for backward compatibility with old imports.
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
