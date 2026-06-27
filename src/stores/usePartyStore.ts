import { create } from "zustand";
import * as Crypto from "expo-crypto";

import type { Party, PartyMember, PartyMemberRole } from "../db/schema";

export type PartyWithMembership = {
  party: Party;
  membership: PartyMember;
};

export type CreatePartyInput = {
  name: string;
  charityOrgName: string;
  charityOrgUrl?: string | null;
  defaultStakePlates: number;
  createdByUserId: string;
  deviceId: string;
};

export type UpdatePartyInput = {
  partyId: string;
  deviceId: string;
  name?: string;
  charityOrgName?: string;
  charityOrgUrl?: string | null;
  defaultStakePlates?: number;
};

interface PartyState {
  parties: PartyWithMembership[];
  currentParty: Party | null;
  members: PartyMember[];
  currentPartyMembers: PartyMember[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  fetchUserParties: (userId: string) => Promise<void>;
  loadPartiesForUser: (userId: string) => Promise<void>;
  setCurrentParty: (party: Party | null) => void;
  fetchMembers: (partyId: string) => Promise<void>;
  createParty: (input: CreatePartyInput) => Promise<PartyWithMembership>;
  leaveParty: (partyId: string, userId: string, deviceId?: string) => Promise<void>;
  loadParty: (partyId: string) => Promise<void>;
  loadPartyMembers: (partyId: string) => Promise<void>;
  updateParty: (input: UpdatePartyInput) => Promise<Party>;
  setMemberRole: (partyId: string, userId: string, role: PartyMemberRole, deviceId?: string) => Promise<void>;
  clearError: () => void;
}

const now = () => new Date();

function createPartyRecord(input: CreatePartyInput): Party {
  return {
    id: Crypto.randomUUID(),
    name: input.name,
    description: null,
    hostId: input.createdByUserId,
    inviteCode: "PLATES",
    isPrivate: false,
    charityPoolPlates: 0,
    charityOrgName: input.charityOrgName,
    charityOrgUrl: input.charityOrgUrl ?? null,
    defaultStakePlates: input.defaultStakePlates,
    realMoneyEnabled: false,
    createdAt: now(),
    updatedAt: now(),
    deletedAt: null,
  };
}

function createMembership(partyId: string, userId: string, role: PartyMemberRole): PartyMember {
  return {
    id: Crypto.randomUUID(),
    partyId,
    userId,
    role,
    plateBalance: 0,
    reservedPlateBalance: 0,
    totalPlatesWagered: 0,
    totalWins: 0,
    totalLosses: 0,
    currentStreak: 0,
    longestStreak: 0,
    joinedAt: now(),
    leftAt: null,
    deletedAt: null,
    displayName: role === "host" ? "Host" : "Member",
    avatarColor: "glaze",
  };
}

export const usePartyStore = create<PartyState>((set, get) => ({
  parties: [],
  currentParty: null,
  members: [],
  currentPartyMembers: [],
  loading: false,
  isLoading: false,
  error: null,

  fetchUserParties: async (_userId: string) => {
    set({ loading: false, isLoading: false, error: null });
  },

  loadPartiesForUser: async (userId: string) => {
    await get().fetchUserParties(userId);
  },

  setCurrentParty: (party) => set({ currentParty: party }),

  fetchMembers: async (partyId: string) => {
    const members = get().currentPartyMembers.filter((member) => member.partyId === partyId);
    set({ members, currentPartyMembers: members });
  },

  createParty: async (input) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const party = createPartyRecord(input);
      const membership = createMembership(party.id, input.createdByUserId, "host");
      const result = { party, membership };
      set((state) => ({
        parties: [...state.parties, result],
        currentParty: party,
        members: [membership],
        currentPartyMembers: [membership],
        loading: false,
        isLoading: false,
      }));
      return result;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error", loading: false, isLoading: false });
      throw error;
    }
  },

  leaveParty: async (partyId) => {
    set((state) => ({
      parties: state.parties.filter((item) => item.party.id !== partyId),
      currentParty: state.currentParty?.id === partyId ? null : state.currentParty,
      currentPartyMembers: state.currentPartyMembers.filter((member) => member.partyId !== partyId),
      members: state.members.filter((member) => member.partyId !== partyId),
    }));
  },

  loadParty: async (partyId) => {
    const party = get().parties.find((item) => item.party.id === partyId)?.party ?? null;
    set({ currentParty: party, loading: false, isLoading: false });
  },

  loadPartyMembers: async (partyId) => {
    await get().fetchMembers(partyId);
  },

  updateParty: async (input) => {
    const current = get().currentParty;
    if (!current || current.id !== input.partyId) {
      throw new Error("Party not found");
    }

    const party: Party = {
      ...current,
      name: input.name ?? current.name,
      charityOrgName: input.charityOrgName ?? current.charityOrgName,
      charityOrgUrl: input.charityOrgUrl ?? current.charityOrgUrl,
      defaultStakePlates: input.defaultStakePlates ?? current.defaultStakePlates,
      updatedAt: now(),
    };

    set((state) => ({
      currentParty: party,
      parties: state.parties.map((item) => (item.party.id === party.id ? { ...item, party } : item)),
    }));

    return party;
  },

  setMemberRole: async (partyId, userId, role) => {
    set((state) => {
      const update = (member: PartyMember) =>
        member.partyId === partyId && member.userId === userId ? { ...member, role } : member;
      return {
        currentPartyMembers: state.currentPartyMembers.map(update),
        members: state.members.map(update),
      };
    });
  },

  clearError: () => set({ error: null }),
}));

export default usePartyStore;
