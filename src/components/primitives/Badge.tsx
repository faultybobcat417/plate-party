import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  const variants: Record<BadgeVariant, { background: string; color: string }> = {
    default: { background: colors.ash[200], color: colors.ink[700] },
    success: { background: colors.glaze[100], color: colors.glaze[800] },
    warning: { background: colors.mustard[100], color: colors.mustard[900] },
    danger: { background: colors.wine[100], color: colors.wine[700] },
    info: { background: colors.linen[200], color: colors.ink[700] },
  };

  const { background, color } = variants[variant];

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5] ?? 2,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
