import { StyleSheet, Text, View } from "react-native";

import { Badge } from "../primitives/Badge";
import { colors, spacing, typography } from "../../theme";

export type PlateChipProps = {
  amount: number;
  showBadge?: boolean;
  badgeLabel?: string;
};

export function PlateChip({ amount, showBadge = false, badgeLabel }: PlateChipProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.plates}>🍽 {amount}</Text>
      {showBadge && badgeLabel ? <Badge label={badgeLabel} variant="info" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  plates: {
    color: colors.ink[800],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
