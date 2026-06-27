import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { User } from "../db/schema";

interface UserState {
  profile: User | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  setProfile: (profile: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,

  fetchProfile: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      set({ profile: data as User, loading: false });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      set({ loading: false });
    }
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data as User });
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  },

  setProfile: (profile) => set({ profile }),
}));
