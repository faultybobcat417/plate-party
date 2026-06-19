import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createParty,
  getParty,
  getPartyMembers,
  joinPartyByInviteCode,
  leaveParty,
  listPartiesForUser,
  setMemberRole,
  updateParty,
  type CreatePartyInput,
  type JoinPartyInput,
  type PartyMemberWithUser,
  type PartyWithMembership,
  type UpdatePartyInput,
} from "../api/party";
import type { Party, PartyMemberRole, Uuid } from "../db/schema";

export type PartyStoreState = {
  parties: PartyWithMembership[];
  currentParty: Party | null;
  currentPartyMembers: PartyMemberWithUser[];
  isLoading: boolean;
  error: string | null;
};

export type PartyStoreActions = {
  loadPartiesForUser: (userId: Uuid) => Promise<void>;
  loadParty: (partyId: Uuid) => Promise<void>;
  loadPartyMembers: (partyId: Uuid) => Promise<void>;
  createParty: (input: CreatePartyInput) => Promise<PartyWithMembership>;
  updateParty: (input: UpdatePartyInput) => Promise<Party>;
  joinParty: (input: JoinPartyInput) => Promise<PartyWithMembership>;
  leaveParty: (partyId: Uuid, userId: Uuid, deviceId: string) => Promise<void>;
  setMemberRole: (
    partyId: Uuid,
    userId: Uuid,
    role: PartyMemberRole,
    deviceId: string,
  ) => Promise<void>;
  setCurrentParty: (party: Party | null) => void;
  clearError: () => void;
};

export type PartyStore = PartyStoreState & PartyStoreActions;

const initialState: PartyStoreState = {
  parties: [],
  currentParty: null,
  currentPartyMembers: [],
  isLoading: false,
  error: null,
};

export const usePartyStore = create<PartyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadPartiesForUser: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          const parties = await listPartiesForUser(userId);
          set({ parties, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load parties.",
            isLoading: false,
          });
        }
      },

      loadParty: async (partyId) => {
        set({ isLoading: true, error: null });

        try {
          const party = await getParty(partyId);
          set({ currentParty: party, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load party.",
            isLoading: false,
          });
        }
      },

      loadPartyMembers: async (partyId) => {
        set({ isLoading: true, error: null });

        try {
          const members = await getPartyMembers(partyId);
          set({ currentPartyMembers: members, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load party members.",
            isLoading: false,
          });
        }
      },

      createParty: async (input) => {
        set({ isLoading: true, error: null });

        try {
          const result = await createParty(input);
          const parties = [result, ...get().parties];
          set({
            parties,
            currentParty: result.party,
            currentPartyMembers: [
              {
                ...result.membership,
                displayName: "",
                avatarColor: "",
              },
            ],
            isLoading: false,
          });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to create party.",
            isLoading: false,
          });
          throw error;
        }
      },

      updateParty: async (input) => {
        set({ isLoading: true, error: null });

        try {
          const party = await updateParty(input);
          const parties = get().parties.map((item) =>
            item.party.id === party.id ? { ...item, party } : item,
          );
          set({
            parties,
            currentParty:
              get().currentParty?.id === party.id ? party : get().currentParty,
            isLoading: false,
          });
          return party;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to update party.",
            isLoading: false,
          });
          throw error;
        }
      },

      joinParty: async (input) => {
        set({ isLoading: true, error: null });

        try {
          const result = await joinPartyByInviteCode(input);
          const parties = [result, ...get().parties];
          set({
            parties,
            currentParty: result.party,
            isLoading: false,
          });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to join party.",
            isLoading: false,
          });
          throw error;
        }
      },

      leaveParty: async (partyId, userId, deviceId) => {
        set({ isLoading: true, error: null });

        try {
          await leaveParty(partyId, userId, deviceId);
          const parties = get().parties.filter((item) => item.party.id !== partyId);
          set({
            parties,
            currentParty:
              get().currentParty?.id === partyId ? null : get().currentParty,
            currentPartyMembers:
              get().currentParty?.id === partyId ? [] : get().currentPartyMembers,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to leave party.",
            isLoading: false,
          });
          throw error;
        }
      },

      setMemberRole: async (partyId, userId, role, deviceId) => {
        set({ isLoading: true, error: null });

        try {
          await setMemberRole(partyId, userId, role, deviceId);
          const members = get().currentPartyMembers.map((member) =>
            member.userId === userId ? { ...member, role } : member,
          );
          set({ currentPartyMembers: members, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to set member role.",
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentParty: (party) => {
        set({ currentParty: party, currentPartyMembers: [] });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "party-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        parties: state.parties,
        currentParty: state.currentParty,
        currentPartyMembers: state.currentPartyMembers,
      }),
    },
  ),
);
