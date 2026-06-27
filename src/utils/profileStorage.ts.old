import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = "@plateparty:profile";
const USER_ID_KEY = "@plateparty:userId";

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  plates: number;
  avatarUrl?: string | null;
  deviceId?: string;
}

export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const newProfile: UserProfile = {
    id: profile.id || `user_${Date.now()}`,
    displayName: profile.displayName || "Plate Tester",
    username: profile.username || `user_${Date.now()}`,
    plates: profile.plates || 100,
    avatarUrl: profile.avatarUrl || null,
    deviceId: profile.deviceId || null,
  };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  await AsyncStorage.setItem(USER_ID_KEY, newProfile.id);
  return newProfile;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const json = await AsyncStorage.getItem(PROFILE_KEY);
  return json ? JSON.parse(json) : null;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  const existing = await getUserProfile();
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
}

export async function syncProfileToDatabase(): Promise<void> {
  // No-op for now
}

export async function getCurrentUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_ID_KEY);
}

export async function getPlates(): Promise<number> {
  const profile = await getUserProfile();
  return profile?.plates || 0;
}

export async function setPlates(plates: number): Promise<void> {
  await updateUserProfile({ plates });
}

export async function ensureDefaultProfile(): Promise<void> {
  const existing = await getUserProfile();
  if (!existing) {
    await createUserProfile({});
  }
}
