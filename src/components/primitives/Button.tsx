import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors } from "../../theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const backgroundColors: Record<ButtonVariant, string> = {
    primary: colors.glaze[600],
    secondary: colors.ash[200],
    ghost: "transparent",
    danger: colors.wine[500],
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: colors.linen[50],
    secondary: colors.ink[800],
    ghost: colors.glaze[700],
    danger: colors.linen[50],
  };

  const sizes: Record<ButtonSize, { padding: number; fontSize: number }> = {
    sm: { padding: 8, fontSize: 12 },
    md: { padding: 12, fontSize: 14 },
    lg: { padding: 16, fontSize: 16 },
  };

  const sizeStyles = sizes[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.base,
          {
            backgroundColor: backgroundColors[variant],
            paddingVertical: sizeStyles.padding,
            paddingHorizontal: sizeStyles.padding * 2,
            opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          },
          style,
        ]) as import("react-native").ViewStyle
      }
      {...rest}
    >
      <Text style={[styles.text, { color: textColors[variant], fontSize: sizeStyles.fontSize }]}>
        {loading ? "Loading..." : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
  },
});
