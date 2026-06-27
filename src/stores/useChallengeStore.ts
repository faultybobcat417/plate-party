import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Challenge, ChallengeEntry } from "../db/schema";

interface ChallengeState {
  challenges: Challenge[];
  entries: ChallengeEntry[];
  loading: boolean;
  fetchOpen: () => Promise<void>;
  fetchUser: (userId: string) => Promise<void>;
  fetchEntries: (challengeId: string) => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  challenges: [],
  entries: [],
  loading: false,
  fetchOpen: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("challenges").select("*").eq("status", "open").is("deleted_at", null).order("created_at", { ascending: false }).limit(50);
    if (!error) set({ challenges: (data || []) as Challenge[], loading: false });
    else set({ loading: false });
  },
  fetchUser: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase.from("challenges").select("*").eq("creator_id", userId).is("deleted_at", null).order("created_at", { ascending: false });
    if (!error) set({ challenges: (data || []) as Challenge[], loading: false });
    else set({ loading: false });
  },
  fetchEntries: async (challengeId: string) => {
    const { data, error } = await supabase.from("challenge_entries").select("*").eq("challenge_id", challengeId).is("deleted_at", null);
    if (!error) set({ entries: (data || []) as ChallengeEntry[] });
  },
}));
