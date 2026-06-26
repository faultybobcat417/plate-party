import { useEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useOnboardingStore } from "../../stores/useOnboardingStore";
import type { RootStackParamList } from "../../navigation/types";

import { OnboardingWelcomeScreen } from "./OnboardingWelcomeScreen";
import { OnboardingIntentionScreen } from "./OnboardingIntentionScreen";
import { OnboardingCharityScreen } from "./OnboardingCharityScreen";
import { OnboardingTutorialScreen } from "./OnboardingTutorialScreen";
import { OnboardingFirstGoalScreen } from "./OnboardingFirstGoalScreen";
import { OnboardingCompleteScreen } from "./OnboardingCompleteScreen";

export type OnboardingFlowScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Onboarding"
>;

export function OnboardingFlowScreen({ navigation }: OnboardingFlowScreenProps) {
  const step = useOnboardingStore((state) => state.step);

  useEffect(() => {
    if (step === "complete") {
      // After the celebration screen, push to CreateProfile
      const timer = setTimeout(() => {
        navigation.navigate("CreateProfile");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, navigation]);

  switch (step) {
    case "welcome":
      return <OnboardingWelcomeScreen />;
    case "intention":
      return <OnboardingIntentionScreen />;
    case "charities":
      return <OnboardingCharityScreen />;
    case "tutorial":
      return <OnboardingTutorialScreen />;
    case "firstGoal":
      return <OnboardingFirstGoalScreen />;
    case "complete":
      return <OnboardingCompleteScreen />;
    default:
      return <OnboardingWelcomeScreen />;
  }
}
