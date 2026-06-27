import { create } from "zustand";

import {
  joinParty,
  listPublicParties,
  searchPublicParties,
  superRequestParty,
} from "../api/party-discovery";
import type { PartyFilters, PublicParty } from "../api/party-discovery";

type SwipeAction = "skip" | "join" | "super";

type PartyDiscoveryState = {
  parties: PublicParty[];
  currentIndex: number;
  swipeHistory: { partyId: string; action: SwipeAction }[];
  searchQuery: string;
  filters: PartyFilters;
  isLoading: boolean;
  error: string | null;
};

type PartyDiscoveryActions = {
  loadParties: () => Promise<void>;
  setSearchQuery: (query: string) => Promise<void>;
  setFilters: (filters: PartyFilters) => Promise<void>;
  swipeLeft: () => void;
  swipeRight: (userId: string) => Promise<void>;
  superRequest: (userId: string) => Promise<void>;
  clearError: () => void;
};

type PartyDiscoveryStore = PartyDiscoveryState & PartyDiscoveryActions;

const initialState: PartyDiscoveryState = {
  parties: [],
  currentIndex: 0,
  swipeHistory: [],
  searchQuery: "",
  filters: {},
  isLoading: false,
  error: null,
};

export const usePartyDiscoveryStore = create<PartyDiscoveryStore>()((set, get) => ({
  ...initialState,

  loadParties: async () => {
    set({ isLoading: true, error: null });
    try {
      const parties = await listPublicParties();
      set({ parties, currentIndex: 0, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load parties",
        isLoading: false,
      });
    }
  },

  setSearchQuery: async (query) => {
    set({ searchQuery: query, isLoading: true, error: null });
    try {
      const parties = await searchPublicParties(query, get().filters);
      set({ parties, currentIndex: 0, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Search failed",
        isLoading: false,
      });
    }
  },

  setFilters: async (filters) => {
    set({ filters, isLoading: true, error: null });
    try {
      const parties = await searchPublicParties(get().searchQuery, filters);
      set({ parties, currentIndex: 0, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to apply filters",
        isLoading: false,
      });
    }
  },

  swipeLeft: () => {
    const { currentIndex, parties, swipeHistory } = get();
    if (currentIndex >= parties.length) return;
    const party = parties[currentIndex];
    set({
      swipeHistory: [...swipeHistory, { partyId: party.id, action: "skip" }],
      currentIndex: currentIndex + 1,
    });
  },

  swipeRight: async (userId: string) => {
    const { currentIndex, parties, swipeHistory } = get();
    if (currentIndex >= parties.length) return;
    const party = parties[currentIndex];
    set({ isLoading: true, error: null });
    try {
      await joinParty(party.id, userId);
      set({
        swipeHistory: [...swipeHistory, { partyId: party.id, action: "join" }],
        currentIndex: currentIndex + 1,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Join failed",
        isLoading: false,
      });
    }
  },

  superRequest: async (userId: string) => {
    const { currentIndex, parties, swipeHistory } = get();
    if (currentIndex >= parties.length) return;
    const party = parties[currentIndex];
    set({ isLoading: true, error: null });
    try {
      await superRequestParty(party.id, userId);
      set({
        swipeHistory: [...swipeHistory, { partyId: party.id, action: "super" }],
        currentIndex: currentIndex + 1,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Super request failed",
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
