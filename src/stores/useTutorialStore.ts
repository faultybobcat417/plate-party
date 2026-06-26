import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
  id: string;
  label: string;
  reward: number;
  tab?: string;
  completed?: boolean;
  skipped?: boolean;
  action?: string;
  title?: string;
  description?: string;
  plateReward?: number;
}

export type TutorialTab = 'feed' | 'market' | 'play' | 'profile' | 'stake';

interface TutorialState {
  steps: TutorialStep[];
  completedSteps: string[];
  pendingSteps: TutorialStep[];
  completeStep: (stepId: string) => void;
  skipStep: (stepId: string) => void;
  getProgress: () => { completed: number; total: number; percentage: number };
  getPendingStepsForTab: (tab: TutorialTab) => TutorialStep[];
}

const defaultSteps: TutorialStep[] = [
  { id: 'visit_feed', label: 'Visit My Feed', reward: 10 },
  { id: 'create_stake', label: 'Create a Stake', reward: 20 },
  { id: 'place_bet', label: 'Place a Bet', reward: 15 },
  { id: 'play_game', label: 'Play a Game', reward: 25 },
  { id: 'pick_winner', label: 'Pick a Winner', reward: 30 },
];

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      steps: defaultSteps,
      completedSteps: [],
      pendingSteps: defaultSteps,
      completeStep: (stepId) => {
        set((state) => {
          const completed = [...state.completedSteps, stepId];
          const pending = state.steps.filter((s) => !completed.includes(s.id));
          return { completedSteps: completed, pendingSteps: pending };
        });
      },
      skipStep: (stepId) => {
        set((state) => ({
          pendingSteps: state.pendingSteps.filter((s) => s.id !== stepId),
        }));
      },
      getProgress: () => {
        const state = get();
        const completed = state.completedSteps.length;
        const total = state.steps.length;
        return {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },
      getPendingStepsForTab: (tab) => {
        return get().pendingSteps;
      },
    }),
    {
      name: 'tutorial-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
