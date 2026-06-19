import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../primitives/Card";
import { colors, spacing, typography } from "../../theme";
import type { WagerOption } from "../../db/schema";

export type BetOptionCardProps = {
  option: WagerOption;
  selected: boolean;
  disabled?: boolean;
  betCount?: number;
  totalBets?: number;
  onPress: () => void;
};

export function BetOptionCard({
  option,
  selected,
  disabled = false,
  betCount = 0,
  totalBets = 0,
  onPress,
}: BetOptionCardProps) {
  const ratio = totalBets > 0 ? betCount / totalBets : 0;

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Card
        variant={selected ? "elevated" : "default"}
        padding={4}
        style={[
          styles.card,
          selected && { borderColor: colors.glaze[500], borderWidth: 2 },
          disabled && { opacity: 0.6 },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
          <Text style={styles.label}>{option.label}</Text>
        </View>
        {totalBets > 0 ? (
          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: `${ratio * 100}%` }]} />
            <Text style={styles.count}>{betCount} bets</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
  },
  radio: {
    borderColor: colors.ash[400],
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  radioSelected: {
    borderColor: colors.glaze[500],
  },
  radioDot: {
    alignSelf: "center",
    backgroundColor: colors.glaze[500],
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  label: {
    color: colors.ink[900],
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  barContainer: {
    marginTop: spacing[3],
  },
  bar: {
    backgroundColor: colors.glaze[200],
    borderRadius: 4,
    height: 8,
    marginBottom: spacing[1],
  },
  count: {
    color: colors.ash[600],
    fontSize: typography.sizes.xs,
  },
});
