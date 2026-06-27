import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import { Challenge, type ProofSubmission } from "../api/challenge";

export type SortOption =
  | "newest"
  | "popular"
  | "endingSoon"
  | "relevance"
  | "ending-soon"
  | "biggest-pot"
  | "just-dropped";

type ChallengeDraft = Partial<Challenge> & Pick<Challenge, "title">;

interface ChallengeState {
  challenges: Challenge[];
  sortedChallenges: Challenge[];
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  sortBy: SortOption;
  pendingProofs: Map<string, ProofSubmission[]>;

  addChallenge: (challenge: ChallengeDraft) => void;
  loadChallenges: () => Promise<void>;
  fetchOpen: () => Promise<void>;
  setSort: (sort: SortOption) => void;
  submitProof: (params: { challengeId: string; submitterId: string; proofType: string; proofData?: string }) => Promise<void>;
  clearError: () => void;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      challenges: [],
      sortedChallenges: [],
      isLoading: false,
      loading: false,
      error: null,
      sortBy: "newest",
      pendingProofs: new Map(),

      addChallenge: (challenge) => {
        const nextChallenge: Challenge = {
          id: challenge.id ?? Crypto.randomUUID(),
          title: challenge.title,
          description: challenge.description,
          type: challenge.type ?? "public",
          status: challenge.status ?? "open",
          deadline: challenge.deadline ?? challenge.expiresAt?.toString() ?? new Date(Date.now() + 86400000).toISOString(),
          rewardPlates: challenge.rewardPlates ?? challenge.rewardAmount ?? 0,
          rewardAmount: challenge.rewardAmount ?? challenge.rewardPlates ?? 0,
          stakeAmount: challenge.stakeAmount ?? 0,
          creatorId: challenge.creatorId,
          createdAt: challenge.createdAt ?? new Date().toISOString(),
          updatedAt: challenge.updatedAt ?? new Date().toISOString(),
          deletedAt: challenge.deletedAt ?? null,
          participantCount: challenge.participantCount ?? 0,
          proofRequired: challenge.proofRequired ?? true,
          expiresAt: challenge.expiresAt ?? challenge.deadline ?? new Date(Date.now() + 86400000).toISOString(),
        };
        set((state) => ({
          challenges: [nextChallenge, ...state.challenges],
          sortedChallenges: [nextChallenge, ...state.sortedChallenges],
        }));
      },

      loadChallenges: async () => {
        set({ isLoading: true, loading: true, error: null });
        try {
          // For now, just use local challenges
          const { challenges } = get();
          set({ sortedChallenges: challenges, isLoading: false, loading: false });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : "Failed to load challenges", isLoading: false, loading: false });
        }
      },

      fetchOpen: async () => {
        await get().loadChallenges();
      },

      setSort: (sortBy) => {
        set({ sortBy });
        const { challenges } = get();
        const sorted = [...challenges];
        if (sortBy === "newest" || sortBy === "just-dropped") {
          sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } else if (sortBy === "popular" || sortBy === "relevance") {
          sorted.sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0));
        } else if (sortBy === "endingSoon" || sortBy === "ending-soon") {
          sorted.sort((a, b) => new Date(a.expiresAt || 0).getTime() - new Date(b.expiresAt || 0).getTime());
        } else if (sortBy === "biggest-pot") {
          sorted.sort((a, b) => (b.rewardPlates || b.rewardAmount || 0) - (a.rewardPlates || a.rewardAmount || 0));
        }
        set({ sortedChallenges: sorted });
      },

      submitProof: async (_params) => {
        // Stub — will implement real proof submission later
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "challenge-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
