import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  completeGoal as completeGoalApi,
  createGoal as createGoalApi,
  deleteGoal as deleteGoalApi,
  failGoal as failGoalApi,
  getGoals,
  type CreateGoalInput,
} from "../api/goal";
import type { Goal } from "../db/schema";
import {
  registerOfflineMutationHandler,
  runOfflineAwareMutation,
  startOfflineQueueProcessor,
} from "../lib/offline";

interface GoalState {
  goals: Goal[];
  activeGoals: Goal[];
  selectedGoal: Goal | null;
  isLoading: boolean;
  loading: boolean;
  error: string | null;

  fetchGoals: (userId?: string) => Promise<void>;
  fetchActiveGoals: (userId?: string) => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<Goal>;
  completeGoal: (goalId: string) => Promise<void>;
  failGoal: (goalId: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  setSelectedGoal: (goal: Goal | null) => void;
  clearError: () => void;
}

const GOAL_CREATE = "goal.create";
const GOAL_COMPLETE = "goal.complete";
const GOAL_FAIL = "goal.fail";
const GOAL_DELETE = "goal.delete";

registerOfflineMutationHandler(GOAL_CREATE, async (payload) => {
  await createGoalApi(payload as CreateGoalInput);
});
registerOfflineMutationHandler(GOAL_COMPLETE, async (payload) => {
  await completeGoalApi(String(payload.goalId));
});
registerOfflineMutationHandler(GOAL_FAIL, async (payload) => {
  await failGoalApi(String(payload.goalId));
});
registerOfflineMutationHandler(GOAL_DELETE, async (payload) => {
  await deleteGoalApi(String(payload.goalId));
});
startOfflineQueueProcessor();

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      activeGoals: [],
      selectedGoal: null,
      isLoading: false,
      loading: false,
      error: null,

      fetchGoals: async (userId) => {
        set({ isLoading: true, loading: true, error: null });
        try {
          const goals = await getGoals({ userId, limit: 100 });
          set({
            goals,
            activeGoals: goals.filter((goal) => goal.status === "active"),
            isLoading: false,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load goals",
            isLoading: false,
            loading: false,
          });
        }
      },

      fetchActiveGoals: async (userId) => {
        set({ isLoading: true, loading: true, error: null });
        try {
          const activeGoals = await getGoals({ userId, status: "active", limit: 100 });
          set({ activeGoals, isLoading: false, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load active goals",
            isLoading: false,
            loading: false,
          });
        }
      },

      createGoal: async (input) => {
        const optimisticGoal = buildOptimisticGoal(input);
        const previousGoals = get().goals;
        set({
          goals: [optimisticGoal, ...previousGoals],
          activeGoals: [optimisticGoal, ...get().activeGoals],
          selectedGoal: optimisticGoal,
          isLoading: true,
          loading: true,
          error: null,
        });

        try {
          const result = await runOfflineAwareMutation(GOAL_CREATE, toGoalPayload(input), () => createGoalApi(input));
          if (result.status === "executed") {
            const saved = result.result;
            set((state) => ({
              goals: state.goals.map((goal) => (goal.id === optimisticGoal.id ? saved : goal)),
              activeGoals: state.activeGoals.map((goal) => (goal.id === optimisticGoal.id ? saved : goal)),
              selectedGoal: saved,
            }));
            return saved;
          }
          return optimisticGoal;
        } catch (error) {
          set({
            goals: previousGoals,
            activeGoals: previousGoals.filter((goal) => goal.status === "active"),
            selectedGoal: null,
            error: error instanceof Error ? error.message : "Failed to create goal",
          });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      completeGoal: async (goalId) => {
        await updateGoalStatus(goalId, "completed", set, get, () =>
          runOfflineAwareMutation(GOAL_COMPLETE, { goalId }, () => completeGoalApi(goalId)),
        );
      },

      failGoal: async (goalId) => {
        await updateGoalStatus(goalId, "failed", set, get, () =>
          runOfflineAwareMutation(GOAL_FAIL, { goalId }, () => failGoalApi(goalId)),
        );
      },

      deleteGoal: async (goalId) => {
        const previousGoals = get().goals;
        set({
          goals: previousGoals.filter((goal) => goal.id !== goalId),
          activeGoals: get().activeGoals.filter((goal) => goal.id !== goalId),
          selectedGoal: get().selectedGoal?.id === goalId ? null : get().selectedGoal,
          isLoading: true,
          loading: true,
          error: null,
        });

        try {
          await runOfflineAwareMutation(GOAL_DELETE, { goalId }, () => deleteGoalApi(goalId));
        } catch (error) {
          set({
            goals: previousGoals,
            activeGoals: previousGoals.filter((goal) => goal.status === "active"),
            error: error instanceof Error ? error.message : "Failed to delete goal",
          });
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      setSelectedGoal: (goal) => set({ selectedGoal: goal }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "goal-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

type SetGoalState = Partial<GoalState> | ((state: GoalState) => Partial<GoalState>);
type GetGoalState = typeof useGoalStore.getState;

async function updateGoalStatus(
  goalId: string,
  status: Goal["status"],
  set: (partial: SetGoalState) => void,
  get: GetGoalState,
  run: () => Promise<unknown>,
): Promise<void> {
  const previousGoals = get().goals;
  const completedAt = status === "completed" || status === "failed" ? new Date() : null;
  const update = (goal: Goal): Goal => (goal.id === goalId ? { ...goal, status, completedAt } : goal);
  const selectedGoal = get().selectedGoal;
  set({
    goals: previousGoals.map(update),
    activeGoals: get().activeGoals.map(update).filter((goal) => goal.status === "active"),
    selectedGoal: selectedGoal?.id === goalId ? update(selectedGoal) : selectedGoal,
    isLoading: true,
    loading: true,
    error: null,
  });

  try {
    await run();
  } catch (error) {
    set({
      goals: previousGoals,
      activeGoals: previousGoals.filter((goal) => goal.status === "active"),
      error: error instanceof Error ? error.message : `Failed to mark goal ${status}`,
    });
    throw error;
  } finally {
    set({ isLoading: false, loading: false });
  }
}

function buildOptimisticGoal(input: CreateGoalInput): Goal {
  return {
    id: Crypto.randomUUID(),
    userId: input.userId ?? "",
    title: input.title,
    description: input.description ?? null,
    stakeAmount: input.stakeAmount ?? 0,
    deadline: input.deadline ? new Date(input.deadline) : null,
    status: "active",
    streakWeeks: 0,
    createdAt: new Date(),
    completedAt: null,
    deletedAt: null,
  };
}

function toGoalPayload(input: CreateGoalInput): Record<string, unknown> {
  return {
    userId: input.userId,
    title: input.title,
    description: input.description,
    stakeAmount: input.stakeAmount,
    deadline: input.deadline instanceof Date ? input.deadline.toISOString() : input.deadline,
  };
}
