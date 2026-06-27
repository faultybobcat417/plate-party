import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createParty, getParty, getPartyMembers, joinPartyByInviteCode, leaveParty,
  listPartiesForUser, setMemberRole, updateParty,
  type CreatePartyInput, type JoinPartyInput, type PartyMemberWithUser,
  type PartyWithMembership, type UpdatePartyInput,
} from "../api/party";
import { Party } from "../db/schema";

interface PartyState {
  parties: PartyWithMembership[];
  currentParty: Party | null;
  currentPartyMembers: PartyMemberWithUser[];
  isLoading: boolean;
  error: string | null;
  loadPartiesForUser: (userId: string) => Promise<void>;
  loadParty: (partyId: string) => Promise<void>;
  loadPartyMembers: (partyId: string) => Promise<void>;
  createParty: (input: CreatePartyInput) => Promise<PartyWithMembership>;
  joinParty: (input: JoinPartyInput) => Promise<PartyWithMembership>;
  updateParty: (input: UpdatePartyInput) => Promise<Party>;
  leaveParty: (partyId: string, userId: string, deviceId: string) => Promise<void>;
  setMemberRole: (partyId: string, userId: string, role: "host" | "member", deviceId: string) => Promise<void>;
  clearError: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set, get) => ({
      parties: [], currentParty: null, currentPartyMembers: [], isLoading: false, error: null,
      loadPartiesForUser: async (userId) => {
        set({ isLoading: true, error: null });
        try { const parties = await listPartiesForUser(userId); set({ parties, isLoading: false }); }
        catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); }
      },
      loadParty: async (partyId) => {
        set({ isLoading: true, error: null });
        try { const party = await getParty(partyId); set({ currentParty: party, isLoading: false }); }
        catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); }
      },
      loadPartyMembers: async (partyId) => {
        set({ isLoading: true, error: null });
        try { const members = await getPartyMembers(partyId); set({ currentPartyMembers: members, isLoading: false }); }
        catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); }
      },
      createParty: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const result = await createParty(input);
          set((state) => ({ parties: [...state.parties, result], currentParty: result.party, currentPartyMembers: result.membership ? [result.membership as PartyMemberWithUser] : state.currentPartyMembers, isLoading: false }));
          return result;
        } catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); throw error; }
      },
      joinParty: async (input) => {
        set({ isLoading: true, error: null });
        try { const result = await joinPartyByInviteCode(input); set((state) => ({ parties: [...state.parties, result], currentParty: result.party, isLoading: false })); return result; }
        catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); throw error; }
      },
      updateParty: async (input) => {
        set({ isLoading: true, error: null });
        try { const party = await updateParty(input); set((state) => ({ parties: state.parties.map((p) => p.party.id === party.id ? { ...p, party } : p), currentParty: state.currentParty?.id === party.id ? party : state.currentParty, isLoading: false })); return party; }
        catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); throw error; }
      },
      leaveParty: async (partyId, userId, deviceId) => {
        set({ isLoading: true, error: null });
        try { await leaveParty(partyId, userId, deviceId); set((state) => ({ parties: state.parties.filter((p) => p.party.id !== partyId), currentParty: state.currentParty?.id === partyId ? null : state.currentParty, currentPartyMembers: state.currentPartyMembers.filter((m) => m.partyId !== partyId), isLoading: false })); }
        catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); }
      },
      setMemberRole: async (partyId, userId, role, deviceId) => {
        set({ isLoading: true, error: null });
        try { await setMemberRole(partyId, userId, role, deviceId); set((state) => ({ currentPartyMembers: state.currentPartyMembers.map((m) => m.partyId === partyId && m.userId === userId ? { ...m, role } : m), isLoading: false })); }
        catch (error) { set({ error: error instanceof Error ? error.message : "Unknown error", isLoading: false }); }
      },
      clearError: () => set({ error: null }),
    }),
    { name: "party-store", storage: createJSONStorage(() => AsyncStorage) }
  )
);
