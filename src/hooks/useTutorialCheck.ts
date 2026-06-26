import { useEffect, useCallback } from "react";
import { useTutorialStore, type TutorialTab } from "../stores/useTutorialStore";

export function useTutorialCheck(tab: TutorialTab, onComplete?: (stepId: string) => void) {
  const { steps, completeStep, getPendingStepsForTab } = useTutorialStore();

  const pendingSteps = getPendingStepsForTab(tab);
  const hasAnyPending = pendingSteps.length > 0;

  const checkAndCompleteVisit = useCallback(() => {
    const visitStepId = `${tab}_visit`;
    const step = steps.find((s) => s.id === visitStepId);
    if (step && !step.completed && !step.skipped) {
      completeStep(visitStepId);
      onComplete?.(visitStepId);
    }
  }, [tab, steps, completeStep, onComplete]);

  useEffect(() => {
    checkAndCompleteVisit();
  }, [checkAndCompleteVisit]);

  return {
    pendingSteps,
    hasAnyPending,
    checkAndCompleteVisit,
  };
}
