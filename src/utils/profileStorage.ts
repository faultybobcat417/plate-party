import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../db/schema";

// COMPATIBILITY SHIM — maps old profileStorage API to Supabase
// All files that import from "../utils/profileStorage" or "../../utils/profileStorage"
// will now hit Supabase instead of local SQLite/AsyncStorage.

const PROFILE_KEY = "@plateparty:profile";
const USER_ID_KEY = "@plateparty:userId";

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

/**
 * Create a new user profile (legacy API).
 * Now: inserts into Supabase auth (anonymous) + public.users trigger.
 */
export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  const userId = data.user!.id;
  const newProfile: UserProfile = {
    id: userId,
    displayName: profile.displayName || "Plate Tester",
    username: profile.username || `user_${userId.slice(0, 8)}`,
    plates: 100,
    avatarUrl: profile.avatarUrl || null,
    deviceId: profile.deviceId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  await AsyncStorage.setItem(USER_ID_KEY, userId);

  return newProfile;
}

/**
 * Get the current user profile (legacy API).
 * Now: fetches from Supabase, falls back to AsyncStorage.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    const cached = await AsyncStorage.getItem(PROFILE_KEY);
    return cached ? JSON.parse(cached) : null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    const cached = await AsyncStorage.getItem(PROFILE_KEY);
    return cached ? JSON.parse(cached) : null;
  }

  const profile: UserProfile = {
    id: data.id,
    displayName: data.display_name,
    username: data.username,
    plates: data.plates,
    avatarUrl: data.avatar_url,
    deviceId: data.device_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

/**
 * Update user profile (legacy API).
 * Now: PATCH to Supabase + local cache.
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .update({
      display_name: updates.displayName,
      username: updates.username,
      avatar_url: updates.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) throw error;

  const profile = await getUserProfile();
  if (profile) {
    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    return updated;
  }
  return data as unknown as UserProfile;
}

/**
 * Sync local profile to database (legacy API).
 * Now: no-op — Supabase IS the database. Kept for compatibility.
 */
export async function syncProfileToDatabase(): Promise<void> {
  const profile = await getUserProfile();
  if (!profile) return;
  // Already synced via Supabase realtime/triggers
}

/**
 * Get current user ID (legacy API).
 * Now: returns Supabase auth user ID.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? (await AsyncStorage.getItem(USER_ID_KEY));
}

/**
 * Get plates balance (legacy API).
 * Now: from Supabase.
 */
export async function getPlates(): Promise<number> {
  const profile = await getUserProfile();
  return profile?.plates ?? 0;
}

/**
 * Set plates balance (legacy API).
 * Now: updates Supabase. USE WITH CAUTION — prefer atomic ledger ops.
 */
export async function setPlates(amount: number): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("No user");

  const { error } = await supabase
    .from("users")
    .update({ plates: amount, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Legacy: check if user has completed onboarding.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem("@plateparty:onboardingComplete");
  return val === "true";
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem("@plateparty:onboardingComplete", complete ? "true" : "false");
}

// Default export for compatibility
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
};
