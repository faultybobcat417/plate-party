import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  Challenge,
  type CreateChallengeInput,
  type ProofSubmission,
  createChallenge,
  deleteChallenge as deleteChallengeApi,
  getChallenges,
  getOpenChallenges,
  submitProof as submitProofApi,
  type SubmitProofInput,
  updateChallenge as updateChallengeApi,
  type UpdateChallengeInput,
} from "../api/challenge";
import {
  registerOfflineMutationHandler,
  runOfflineAwareMutation,
  startOfflineQueueProcessor,
} from "../lib/offline";

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
  cursor: string | null;
  hasMore: boolean;

  addChallenge: (challenge: ChallengeDraft | CreateChallengeInput) => Promise<Challenge>;
  createChallenge: (input: CreateChallengeInput) => Promise<Challenge>;
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  loadChallenges: () => Promise<void>;
  loadMoreChallenges: () => Promise<void>;
  fetchOpen: () => Promise<void>;
  setSort: (sort: SortOption) => void;
  submitProof: (params: { challengeId: string; submitterId: string; proofType: string; proofData?: string }) => Promise<void>;
  clearError: () => void;
}

const CHALLENGE_CREATE = "challenge.create";
const CHALLENGE_UPDATE = "challenge.update";
const CHALLENGE_DELETE = "challenge.delete";
const CHALLENGE_SUBMIT_PROOF = "challenge.submitProof";

registerOfflineMutationHandler(CHALLENGE_CREATE, async (payload) => {
  await createChallenge(payload as CreateChallengeInput);
});
registerOfflineMutationHandler(CHALLENGE_UPDATE, async (payload) => {
  await updateChallengeApi(payload as UpdateChallengeInput);
});
registerOfflineMutationHandler(CHALLENGE_DELETE, async (payload) => {
  await deleteChallengeApi(String(payload.challengeId));
});
registerOfflineMutationHandler(CHALLENGE_SUBMIT_PROOF, async (payload) => {
  await submitProofApi(payload as SubmitProofInput);
});
startOfflineQueueProcessor();

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
      cursor: null,
      hasMore: true,

      addChallenge: async (challenge) => get().createChallenge(toCreateInput(challenge)),

      createChallenge: async (input) => {
        const optimistic = buildOptimisticChallenge(input);
        const previous = get().challenges;
        setChallenges(set, [optimistic, ...previous], get().sortBy);
        set({ isLoading: true, loading: true, error: null });

        try {
          const result = await runOfflineAwareMutation(CHALLENGE_CREATE, toChallengePayload(input), () => createChallenge(input));
          if (result.status === "executed") {
            const saved = result.result;
            const merged = get().challenges.map((challenge) => (challenge.id === optimistic.id ? saved : challenge));
            setChallenges(set, merged, get().sortBy);
            return saved;
          }
          return optimistic;
        } catch (error) {
          setChallenges(set, previous, get().sortBy);
          set({ error: error instanceof Error ? error.message : "Failed to create challenge" });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      updateChallenge: async (challengeId, updates) => {
        const previous = get().challenges;
        const nextChallenges = previous.map((challenge) =>
          challenge.id === challengeId ? { ...challenge, ...updates, updatedAt: new Date().toISOString() } : challenge,
        );
        setChallenges(set, nextChallenges, get().sortBy);
        set({ isLoading: true, loading: true, error: null });

        try {
          const payload = toUpdatePayload(challengeId, updates);
          const result = await runOfflineAwareMutation(CHALLENGE_UPDATE, payload, () => updateChallengeApi(payload));
          if (result.status === "executed") {
            setChallenges(
              set,
              get().challenges.map((challenge) => (challenge.id === challengeId ? result.result : challenge)),
              get().sortBy,
            );
          }
        } catch (error) {
          setChallenges(set, previous, get().sortBy);
          set({ error: error instanceof Error ? error.message : "Failed to update challenge" });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      deleteChallenge: async (challengeId) => {
        const previous = get().challenges;
        setChallenges(set, previous.filter((challenge) => challenge.id !== challengeId), get().sortBy);
        set({ isLoading: true, loading: true, error: null });

        try {
          await runOfflineAwareMutation(CHALLENGE_DELETE, { challengeId }, () => deleteChallengeApi(challengeId));
        } catch (error) {
          setChallenges(set, previous, get().sortBy);
          set({ error: error instanceof Error ? error.message : "Failed to delete challenge" });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      loadChallenges: async () => {
        set({ isLoading: true, loading: true, error: null });
        try {
          const challenges = await getOpenChallenges(25);
          const cursor = getNextCursor(challenges);
          setChallenges(set, challenges, get().sortBy);
          set({ cursor, hasMore: challenges.length === 25, isLoading: false, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to load challenges", isLoading: false, loading: false });
        }
      },

      loadMoreChallenges: async () => {
        const cursor = get().cursor;
        if (!cursor || !get().hasMore || get().isLoading) return;
        set({ isLoading: true, loading: true, error: null });
        try {
          const nextPage = await getChallenges({ status: "open", cursor, limit: 25 });
          const merged = mergeChallenges(get().challenges, nextPage);
          setChallenges(set, merged, get().sortBy);
          set({ cursor: getNextCursor(nextPage), hasMore: nextPage.length === 25, isLoading: false, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to load more challenges", isLoading: false, loading: false });
        }
      },

      fetchOpen: async () => {
        await get().loadChallenges();
      },

      setSort: (sortBy) => {
        set({ sortBy });
        setChallenges(set, get().challenges, sortBy);
      },

      submitProof: async (params) => {
        const proof: ProofSubmission = {
          id: Crypto.randomUUID(),
          challengeId: params.challengeId,
          submitterId: params.submitterId,
          proofType: normalizeProofType(params.proofType),
          proofData: params.proofData,
          submittedAt: new Date().toISOString(),
        };
        const previous = get().pendingProofs;
        const next = new Map(previous);
        next.set(params.challengeId, [...(next.get(params.challengeId) ?? []), proof]);
        set({ pendingProofs: next, isLoading: true, loading: true, error: null });

        try {
          await runOfflineAwareMutation(
            CHALLENGE_SUBMIT_PROOF,
            {
              challengeId: params.challengeId,
              proofData: params.proofData ?? proof.proofData ?? "Submitted from app",
              proofType: proof.proofType,
            },
            () =>
              submitProofApi({
                challengeId: params.challengeId,
                proofData: params.proofData ?? proof.proofData ?? "Submitted from app",
                proofType: proof.proofType,
              }),
          );
        } catch (error) {
          set({ pendingProofs: previous, error: error instanceof Error ? error.message : "Failed to submit proof" });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "challenge-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        challenges: state.challenges,
        sortedChallenges: state.sortedChallenges,
        sortBy: state.sortBy,
        cursor: state.cursor,
        hasMore: state.hasMore,
      }),
    },
  ),
);

type ChallengeSet = Partial<ChallengeState> | ((state: ChallengeState) => Partial<ChallengeState>);

function setChallenges(set: (partial: ChallengeSet) => void, challenges: Challenge[], sortBy: SortOption): void {
  set({
    challenges,
    sortedChallenges: sortChallenges(challenges, sortBy),
  });
}

function sortChallenges(challenges: Challenge[], sortBy: SortOption): Challenge[] {
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
  return sorted;
}

function mergeChallenges(existing: Challenge[], incoming: Challenge[]): Challenge[] {
  const byId = new Map(existing.map((challenge) => [challenge.id, challenge]));
  incoming.forEach((challenge) => byId.set(challenge.id, challenge));
  return Array.from(byId.values());
}

function getNextCursor(challenges: Challenge[]): string | null {
  const last = challenges[challenges.length - 1];
  if (!last) return null;
  const createdAt = last.createdAt instanceof Date ? last.createdAt.toISOString() : last.createdAt;
  return typeof createdAt === "string" ? createdAt : null;
}

function toCreateInput(challenge: ChallengeDraft | CreateChallengeInput): CreateChallengeInput {
  return {
    creatorId: "creatorId" in challenge ? challenge.creatorId : undefined,
    title: challenge.title,
    description: challenge.description ?? null,
    stakeAmount: challenge.stakeAmount ?? 0,
    rewardAmount: challenge.rewardAmount,
    rewardPlates: challenge.rewardPlates ?? challenge.rewardAmount ?? 1,
    type: challenge.type,
    deadline: challenge.deadline,
    expiresAt: challenge.expiresAt,
    proofRequirements: challenge.proofRequirements,
  };
}

function buildOptimisticChallenge(input: CreateChallengeInput): Challenge {
  const deadline = input.deadline ?? (input.expiresAt instanceof Date ? input.expiresAt.toISOString() : input.expiresAt) ?? new Date(Date.now() + 86400000).toISOString();
  return {
    id: Crypto.randomUUID(),
    creatorId: input.creatorId,
    title: input.title,
    description: input.description ?? null,
    type: input.type ?? "public",
    status: "open",
    deadline,
    expiresAt: deadline,
    stakeAmount: input.stakeAmount ?? 0,
    rewardAmount: input.rewardAmount ?? input.rewardPlates ?? 0,
    rewardPlates: input.rewardPlates ?? input.rewardAmount ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    proofRequired: true,
    proofRequirements: input.proofRequirements ?? [],
    participantCount: 0,
  };
}

function toChallengePayload(input: CreateChallengeInput): Record<string, unknown> {
  return {
    ...input,
    expiresAt: input.expiresAt instanceof Date ? input.expiresAt.toISOString() : input.expiresAt,
  };
}

function toUpdatePayload(challengeId: string, updates: Partial<Challenge>): UpdateChallengeInput {
  return {
    challengeId,
    title: updates.title,
    description: updates.description,
    rewardPlates: updates.rewardPlates,
    rewardAmount: updates.rewardAmount,
    stakeAmount: updates.stakeAmount,
    deadline: updates.deadline,
    expiresAt: updates.expiresAt instanceof Date ? updates.expiresAt.toISOString() : updates.expiresAt,
    status: updates.status,
  };
}

function normalizeProofType(value: string): ProofSubmission["proofType"] {
  if (value === "camera" || value === "photo" || value === "file" || value === "text") {
    return value;
  }
  return "text";
}
