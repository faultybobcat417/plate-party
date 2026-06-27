import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Party, PartyMember } from "../db/schema";

interface PartyState {
  parties: Party[];
  currentParty: Party | null;
  members: PartyMember[];
  loading: boolean;
  fetchUserParties: (userId: string) => Promise<void>;
  setCurrentParty: (party: Party | null) => void;
  fetchMembers: (partyId: string) => Promise<void>;
}

export const usePartyStore = create<PartyState>((set) => ({
  parties: [],
  currentParty: null,
  members: [],
  loading: false,
  fetchUserParties: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase.from("party_members").select("party_id").eq("user_id", userId).is("deleted_at", null);
    if (error || !data?.length) { set({ parties: [], loading: false }); return; }
    const partyIds = data.map((m) => m.party_id);
    const { data: parties } = await supabase.from("parties").select("*").in("id", partyIds).is("deleted_at", null).order("created_at", { ascending: false });
    set({ parties: (parties || []) as Party[], loading: false });
  },
  setCurrentParty: (party) => set({ currentParty: party }),
  fetchMembers: async (partyId: string) => {
    const { data, error } = await supabase.from("party_members").select("*").eq("party_id", partyId).is("deleted_at", null);
    if (!error) set({ members: (data || []) as PartyMember[] });
  },
}));
