import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { colors, spacing, typography } from "../../theme";

export type NumericStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export function NumericStepper({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
}: NumericStepperProps) {
  const decrease = () => {
    const next = Math.max(min, value - step);
    if (next !== value) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    }
  };

  const increase = () => {
    const next = Math.min(max, value + step);
    if (next !== value) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        onPress={decrease}
        disabled={value <= min}
        style={({ pressed }) => [
          styles.button,
          { opacity: value <= min ? 0.4 : pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase"
        onPress={increase}
        disabled={value >= max}
        style={({ pressed }) => [
          styles.button,
          { opacity: value >= max ? 0.4 : pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.ash[200],
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  buttonText: {
    color: colors.ink[800],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  value: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginHorizontal: spacing[4],
    minWidth: 40,
    textAlign: "center",
  },
});
