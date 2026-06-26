import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { useOnboardingStore } from "../../stores/useOnboardingStore";
import { CharityPickerScreen } from "../charity/CharityPickerScreen";

export function OnboardingCharityScreen() {
  const { addPlates, setStep } = useOnboardingStore();

  const handleSaveComplete = () => {
    const { selectedCharities } = useOnboardingStore.getState();
    const bonus = Math.min(selectedCharities.length, 3) * 100;
    addPlates(bonus);
    setStep("tutorial");
  };

  return (
    <SafeAreaView style={styles.container}>
      <CharityPickerScreen onSaveComplete={handleSaveComplete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
});
