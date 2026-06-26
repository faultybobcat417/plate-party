import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { type OnboardingStep, type UserIntention } from "../types/onboarding";

const ONBOARDING_COMPLETE_KEY = "onboarding_complete";
const ONBOARDING_STEP_KEY = "onboarding_step";

export interface FirstGoal {
  title: string;
  stake: number;
}

interface OnboardingState {
  step: OnboardingStep;
  intention: UserIntention | null;
  selectedCharities: string[];
  platesEarned: number;
  isComplete: boolean;
  firstGoal: FirstGoal | null;

  setStep: (step: OnboardingStep) => void;
  setIntention: (intention: UserIntention) => void;
  setSelectedCharities: (ids: string[]) => void;
  addPlates: (amount: number) => void;
  setFirstGoal: (goal: FirstGoal) => void;
  markComplete: () => Promise<void>;
  reset: () => Promise<void>;
  getPlatesForStep: (step: OnboardingStep) => number;
}

const PLATE_REWARDS: Record<OnboardingStep, number> = {
  welcome: 100,
  intention: 100,
  charities: 100,
  tutorial: 100,
  firstGoal: 200,
  complete: 0,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: "welcome",
      intention: null,
      selectedCharities: [],
      platesEarned: 0,
      isComplete: false,
      firstGoal: null,

      setStep: (step) => set({ step }),

      setIntention: (intention) => {
        set({ intention });
      },

      setSelectedCharities: (ids) => {
        set({ selectedCharities: ids });
      },

      addPlates: (amount) => {
        set({ platesEarned: get().platesEarned + amount });
      },

      setFirstGoal: (goal) => set({ firstGoal: goal }),

      markComplete: async () => {
        set({ isComplete: true, step: "complete" });
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      },

      reset: async () => {
        set({
          step: "welcome",
          intention: null,
          selectedCharities: [],
          platesEarned: 0,
          isComplete: false,
          firstGoal: null,
        });
        await AsyncStorage.multiRemove([ONBOARDING_COMPLETE_KEY, ONBOARDING_STEP_KEY]);
      },

      getPlatesForStep: (step) => {
        if (step === "charities") {
          const count = get().selectedCharities.length;
          return Math.min(count, 3) * 100;
        }
        return PLATE_REWARDS[step] || 0;
      },
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === "true";
}
