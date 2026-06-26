import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  CHARITY_ORGS,
  getCharitiesByCategory,
  searchCharities,
} from "../api/charity";
import { type CharityCategory, type CharityOrg } from "../types/charity";

const MAX_SELECTIONS = 3;
const STORAGE_KEY = "selected_charity_ids";

interface CharityState {
  charities: CharityOrg[];
  selectedIds: string[];
  activeCategory: CharityCategory;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;

  loadCharities: () => void;
  loadSelections: () => Promise<void>;
  toggleSelection: (id: string) => void;
  setCategory: (category: CharityCategory) => void;
  setSearchQuery: (query: string) => void;
  saveSelections: () => Promise<void>;
  clearError: () => void;

  filteredCharities: () => CharityOrg[];
  selectedCharities: () => CharityOrg[];
  canSelectMore: () => boolean;
  selectionCount: () => number;
}

export const useCharityStore = create<CharityState>()(
  persist(
    (set, get) => ({
      charities: CHARITY_ORGS,
      selectedIds: [],
      activeCategory: "all",
      searchQuery: "",
      isLoading: false,
      error: null,
      isSaving: false,

      loadCharities: () => {
        set({ charities: CHARITY_ORGS, isLoading: false });
      },

      loadSelections: async () => {
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
            const ids = JSON.parse(stored) as string[];
            set({ selectedIds: ids });
          }
        } catch (err) {
          set({ error: err instanceof Error ? err.message : "Failed to load selections" });
        }
      },

      toggleSelection: (id) => {
        const { selectedIds } = get();
        if (selectedIds.includes(id)) {
          set({ selectedIds: selectedIds.filter((sid) => sid !== id) });
        } else if (selectedIds.length < MAX_SELECTIONS) {
          set({ selectedIds: [...selectedIds, id] });
        }
      },

      setCategory: (category) => {
        set({ activeCategory: category, searchQuery: "" });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      saveSelections: async () => {
        set({ isSaving: true, error: null });
        try {
          const { selectedIds } = get();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
          set({ isSaving: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to save selections",
            isSaving: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      filteredCharities: () => {
        const { activeCategory, searchQuery } = get();
        if (searchQuery.trim()) {
          return searchCharities(searchQuery);
        }
        return getCharitiesByCategory(activeCategory);
      },

      selectedCharities: () => {
        const { selectedIds } = get();
        return CHARITY_ORGS.filter((c) => selectedIds.includes(c.id));
      },

      canSelectMore: () => {
        return get().selectedIds.length < MAX_SELECTIONS;
      },

      selectionCount: () => {
        return get().selectedIds.length;
      },
    }),
    {
      name: "charity-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selectedIds: state.selectedIds }),
    }
  )
);
