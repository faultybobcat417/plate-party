import React, { useCallback } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

interface FreePlateButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}

export function FreePlateButton({ onPress, disabled, label = "Claim Free Plate" }: FreePlateButtonProps) {
  const handlePress = useCallback(() => {
    if (!disabled) onPress();
  }, [onPress, disabled]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.text}>🎁 {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.charity.plate,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
  },
});

import { theme } from "../../theme";
