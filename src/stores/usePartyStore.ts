import { create } from "zustand";
import * as Crypto from "expo-crypto";

import {
  createParty as createPartyApi,
  deleteParty as deletePartyApi,
  getMembership,
  getParty,
  getPartyMembers,
  getUserParties,
  leaveParty as leavePartyApi,
  updateParty as updatePartyApi,
} from "../api/party";
import type { Party, PartyMember, PartyMemberRole } from "../db/schema";
import {
  registerOfflineMutationHandler,
  runOfflineAwareMutation,
  startOfflineQueueProcessor,
} from "../lib/offline";

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
  deleteParty: (partyId: string, deviceId?: string) => Promise<void>;
  setMemberRole: (partyId: string, userId: string, role: PartyMemberRole, deviceId?: string) => Promise<void>;
  clearError: () => void;
}

const PARTY_CREATE = "party.create";
const PARTY_UPDATE = "party.update";
const PARTY_LEAVE = "party.leave";
const PARTY_DELETE = "party.delete";

registerOfflineMutationHandler(PARTY_CREATE, async (payload) => {
  await createPartyApi({
    name: String(payload.name),
    hostId: String(payload.createdByUserId),
    charityOrgName: typeof payload.charityOrgName === "string" ? payload.charityOrgName : null,
    charityOrgUrl: typeof payload.charityOrgUrl === "string" ? payload.charityOrgUrl : null,
    defaultStakePlates: typeof payload.defaultStakePlates === "number" ? payload.defaultStakePlates : 1,
  });
});
registerOfflineMutationHandler(PARTY_UPDATE, async (payload) => {
  await updatePartyApi(String(payload.partyId), {
    name: typeof payload.name === "string" ? payload.name : undefined,
    charityOrgName: typeof payload.charityOrgName === "string" ? payload.charityOrgName : undefined,
    charityOrgUrl: typeof payload.charityOrgUrl === "string" ? payload.charityOrgUrl : null,
    defaultStakePlates: typeof payload.defaultStakePlates === "number" ? payload.defaultStakePlates : undefined,
  });
});
registerOfflineMutationHandler(PARTY_LEAVE, async (payload) => {
  await leavePartyApi(String(payload.partyId), typeof payload.userId === "string" ? payload.userId : undefined);
});
registerOfflineMutationHandler(PARTY_DELETE, async (payload) => {
  await deletePartyApi(String(payload.partyId));
});
startOfflineQueueProcessor();

export const usePartyStore = create<PartyState>((set, get) => ({
  parties: [],
  currentParty: null,
  members: [],
  currentPartyMembers: [],
  loading: false,
  isLoading: false,
  error: null,

  fetchUserParties: async (userId) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const parties = await getUserParties(userId);
      const withMembership = await Promise.all(
        parties.map(async (party) => ({
          party,
          membership: (await getMembership(party.id, userId)) ?? createFallbackMembership(party.id, userId, party.hostId === userId ? "host" : "member"),
        })),
      );
      set({ parties: withMembership, loading: false, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load parties", loading: false, isLoading: false });
    }
  },

  loadPartiesForUser: async (userId) => {
    await get().fetchUserParties(userId);
  },

  setCurrentParty: (party) => set({ currentParty: party }),

  fetchMembers: async (partyId) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const members = await getPartyMembers(partyId);
      set({ members, currentPartyMembers: members, loading: false, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load members", loading: false, isLoading: false });
    }
  },

  createParty: async (input) => {
    const optimisticParty = createOptimisticParty(input);
    const optimisticMembership = createFallbackMembership(optimisticParty.id, input.createdByUserId, "host");
    const optimisticResult = { party: optimisticParty, membership: optimisticMembership };
    const previous = get().parties;
    set({
      parties: [...previous, optimisticResult],
      currentParty: optimisticParty,
      members: [optimisticMembership],
      currentPartyMembers: [optimisticMembership],
      loading: true,
      isLoading: true,
      error: null,
    });

    try {
      const result = await runOfflineAwareMutation(
        PARTY_CREATE,
        input,
        async () => {
          const party = await createPartyApi({
            name: input.name,
            hostId: input.createdByUserId,
            charityOrgName: input.charityOrgName,
            charityOrgUrl: input.charityOrgUrl ?? null,
            defaultStakePlates: input.defaultStakePlates,
          });
          const membership = (await getMembership(party.id, input.createdByUserId)) ?? createFallbackMembership(party.id, input.createdByUserId, "host");
          return { party, membership };
        },
      );

      if (result.status === "executed") {
        set((state) => ({
          parties: state.parties.map((item) => (item.party.id === optimisticParty.id ? result.result : item)),
          currentParty: result.result.party,
          members: [result.result.membership],
          currentPartyMembers: [result.result.membership],
        }));
        return result.result;
      }

      return optimisticResult;
    } catch (error) {
      set({
        parties: previous,
        currentParty: null,
        currentPartyMembers: [],
        members: [],
        error: error instanceof Error ? error.message : "Failed to create party",
      });
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  leaveParty: async (partyId, userId) => {
    const previous = get().parties;
    set({
      parties: previous.filter((item) => item.party.id !== partyId),
      currentParty: get().currentParty?.id === partyId ? null : get().currentParty,
      currentPartyMembers: get().currentPartyMembers.filter((member) => member.partyId !== partyId),
      members: get().members.filter((member) => member.partyId !== partyId),
      loading: true,
      isLoading: true,
      error: null,
    });

    try {
      await runOfflineAwareMutation(PARTY_LEAVE, { partyId, userId }, () => leavePartyApi(partyId, userId));
    } catch (error) {
      set({ parties: previous, error: error instanceof Error ? error.message : "Failed to leave party" });
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  loadParty: async (partyId) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const party = await getParty(partyId);
      set({ currentParty: party, loading: false, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load party", loading: false, isLoading: false });
    }
  },

  loadPartyMembers: async (partyId) => {
    await get().fetchMembers(partyId);
  },

  updateParty: async (input) => {
    const current = get().currentParty;
    if (!current || current.id !== input.partyId) {
      throw new Error("Party not found");
    }
    const optimistic = applyPartyUpdates(current, input);
    const previous = current;
    set((state) => ({
      currentParty: optimistic,
      parties: state.parties.map((item) => (item.party.id === optimistic.id ? { ...item, party: optimistic } : item)),
      loading: true,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await runOfflineAwareMutation(PARTY_UPDATE, input, () =>
        updatePartyApi(input.partyId, {
          name: input.name,
          charityOrgName: input.charityOrgName,
          charityOrgUrl: input.charityOrgUrl,
          defaultStakePlates: input.defaultStakePlates,
        }),
      );
      if (result.status === "executed") {
        set((state) => ({
          currentParty: result.result,
          parties: state.parties.map((item) => (item.party.id === result.result.id ? { ...item, party: result.result } : item)),
        }));
        return result.result;
      }
      return optimistic;
    } catch (error) {
      set((state) => ({
        currentParty: previous,
        parties: state.parties.map((item) => (item.party.id === previous.id ? { ...item, party: previous } : item)),
        error: error instanceof Error ? error.message : "Failed to update party",
      }));
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  deleteParty: async (partyId) => {
    const previous = get().parties;
    set({
      parties: previous.filter((item) => item.party.id !== partyId),
      currentParty: get().currentParty?.id === partyId ? null : get().currentParty,
      loading: true,
      isLoading: true,
      error: null,
    });
    try {
      await runOfflineAwareMutation(PARTY_DELETE, { partyId }, () => deletePartyApi(partyId));
    } catch (error) {
      set({ parties: previous, error: error instanceof Error ? error.message : "Failed to delete party" });
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
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

function createOptimisticParty(input: CreatePartyInput): Party {
  const now = new Date();
  return {
    id: Crypto.randomUUID(),
    name: input.name,
    description: null,
    hostId: input.createdByUserId,
    inviteCode: "PENDING",
    isPrivate: false,
    charityPoolPlates: 0,
    charityOrgName: input.charityOrgName,
    charityOrgUrl: input.charityOrgUrl ?? null,
    defaultStakePlates: input.defaultStakePlates,
    realMoneyEnabled: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function createFallbackMembership(partyId: string, userId: string, role: PartyMemberRole): PartyMember {
  const now = new Date();
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
    joinedAt: now,
    leftAt: null,
    deletedAt: null,
    displayName: role === "host" ? "Host" : "Member",
    avatarColor: "glaze",
  };
}

function applyPartyUpdates(party: Party, input: UpdatePartyInput): Party {
  return {
    ...party,
    name: input.name ?? party.name,
    charityOrgName: input.charityOrgName ?? party.charityOrgName,
    charityOrgUrl: input.charityOrgUrl ?? party.charityOrgUrl,
    defaultStakePlates: input.defaultStakePlates ?? party.defaultStakePlates,
    updatedAt: new Date(),
  };
}
