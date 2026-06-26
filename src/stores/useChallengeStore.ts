import { create } from "zustand";

import {
  type Challenge,
  type ChallengeStatus,
  type CreateChallengeInput,
  type SubmitProofInput,
  type ProofSubmission,
  listChallenges,
  createChallenge,
  submitProof,
  getPendingProofs,
  reviewProof,
} from "../api/challenge";

export type SortOption = "relevance" | "ending-soon" | "biggest-pot" | "just-dropped";

type ChallengeStore = {
  challenges: Challenge[];
  sortedChallenges: Challenge[];
  isLoading: boolean;
  error: string | null;
  sortBy: SortOption;
  pendingProofs: Map<string, ProofSubmission[]>;

  loadChallenges: (status?: ChallengeStatus) => Promise<void>;
  addChallenge: (input: CreateChallengeInput) => Promise<Challenge>;
  submitProof: (input: SubmitProofInput) => Promise<ProofSubmission>;
  reviewProof: (proofId: string, challengeId: string, approved: boolean) => Promise<ProofSubmission>;
  setSort: (sort: SortOption) => void;
  clearError: () => void;
};

const initialState = {
  challenges: [],
  sortedChallenges: [],
  isLoading: false,
  error: null,
  sortBy: "relevance" as SortOption,
  pendingProofs: new Map<string, ProofSubmission[]>(),
};

function sortChallenges(challenges: Challenge[], sortBy: SortOption): Challenge[] {
  const sorted = [...challenges];
  switch (sortBy) {
    case "ending-soon":
      return sorted.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    case "biggest-pot":
      return sorted.sort((a, b) => b.rewardPlates - a.rewardPlates);
    case "just-dropped":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "relevance":
    default:
      // Mix of ending soon + high reward
      return sorted.sort((a, b) => {
        const aUrgency = new Date(a.deadline).getTime() - Date.now();
        const bUrgency = new Date(b.deadline).getTime() - Date.now();
        const aScore = a.rewardPlates * 10 + (aUrgency < 86400000 ? 1000 : 0);
        const bScore = b.rewardPlates * 10 + (bUrgency < 86400000 ? 1000 : 0);
        return bScore - aScore;
      });
  }
}

export const useChallengeStore = create<ChallengeStore>()((set, get) => ({
  ...initialState,

  loadChallenges: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const challenges = await listChallenges(status);
      const pendingProofs = new Map<string, ProofSubmission[]>();
      for (const c of challenges) {
        const proofs = await getPendingProofs(c.id);
        if (proofs.length > 0) pendingProofs.set(c.id, proofs);
      }
      set({
        challenges,
        sortedChallenges: sortChallenges(challenges, get().sortBy),
        pendingProofs,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load challenges.",
        isLoading: false,
      });
    }
  },

  addChallenge: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const challenge = await createChallenge(input);
      const all = [challenge, ...get().challenges];
      set({
        challenges: all,
        sortedChallenges: sortChallenges(all, get().sortBy),
        isLoading: false,
      });
      return challenge;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create challenge.",
        isLoading: false,
      });
      throw error;
    }
  },

  submitProof: async (input) => {
    const proof = await submitProof(input);
    const pending = new Map(get().pendingProofs);
    const existing = pending.get(input.challengeId) ?? [];
    pending.set(input.challengeId, [...existing, proof]);
    set({ pendingProofs: pending });
    return proof;
  },

  reviewProof: async (proofId, challengeId, approved) => {
    const proof = await reviewProof(proofId, challengeId, approved);
    const pending = new Map(get().pendingProofs);
    const existing = pending.get(challengeId) ?? [];
    pending.set(challengeId, existing.map((p) => (p.id === proofId ? proof : p)));
    set({ pendingProofs: pending });
    return proof;
  },

  setSort: (sortBy) => {
    set({
      sortBy,
      sortedChallenges: sortChallenges(get().challenges, sortBy),
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
