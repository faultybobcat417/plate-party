import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { Card } from "../primitives/Card";
import type { Market } from "../../api/market";

export type MarketCardProps = {
  market: Market;
  onPressYes: () => void;
  onPressNo: () => void;
  onPressCard: () => void;
};

export function MarketCard({ market, onPressYes, onPressNo, onPressCard }: MarketCardProps) {
  const yesPercent = Math.max(0, Math.min(100, market.yesPrice ?? 0));
  const noPercent = Math.max(0, Math.min(100, market.noPrice ?? 0));
  const totalPercent = yesPercent + noPercent || 1;
  const categoryLabel = (market.category ?? "market").toUpperCase();
  const volume = Number.isFinite(market.volume) ? market.volume : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${market.title ?? "Market"}, ${categoryLabel}`}
      onPress={onPressCard}
      style={({ pressed }) => [styles.cardWrapper, pressed && styles.cardPressed]}
    >
      <Card style={styles.card}>
        {/* Header: emoji + category + volume */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{market.imageUrl ?? "📊"}</Text>
          <View style={styles.meta}>
            <Text style={styles.category}>{categoryLabel}</Text>
            <Text style={styles.volume}>Vol: {volume.toLocaleString()} 🍽</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {market.title ?? "Untitled market"}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {market.description ?? ""}
        </Text>

        {/* Odds bar */}
        <View style={styles.oddsBar}>
          <View style={[styles.oddsYes, { flex: yesPercent / totalPercent }]} />
          <View style={[styles.oddsNo, { flex: noPercent / totalPercent }]} />
        </View>

        {/* Price row */}
        <View style={styles.priceRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Yes</Text>
            <Text style={styles.priceYes}>{yesPercent}¢</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>No</Text>
            <Text style={styles.priceNo}>{noPercent}¢</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buy Yes for ${market.title ?? "this market"}`}
            onPress={(e) => {
              e.stopPropagation();
              onPressYes();
            }}
            style={({ pressed }) => [
              styles.button,
              styles.yesButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonTextYes}>Buy Yes</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buy No for ${market.title ?? "this market"}`}
            onPress={(e) => {
              e.stopPropagation();
              onPressNo();
            }}
            style={({ pressed }) => [
              styles.button,
              styles.noButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonTextNo}>Buy No</Text>
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  cardPressed: {
    opacity: 0.95,
  },
  card: {
    padding: spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  emoji: {
    fontSize: 28,
    marginRight: spacing[3],
  },
  meta: {
    flex: 1,
  },
  category: {
    color: colors.glaze[600],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  volume: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
    lineHeight: 24,
  },
  description: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  oddsBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: spacing[3],
  },
  oddsYes: {
    backgroundColor: colors.win,
  },
  oddsNo: {
    backgroundColor: colors.lose,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  priceBlock: {
    alignItems: "center",
    flex: 1,
  },
  priceLabel: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[1],
  },
  priceYes: {
    color: colors.win,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  priceNo: {
    color: colors.lose,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  actions: {
    flexDirection: "row",
    gap: spacing[3],
  },
  button: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    minHeight: 44,
    justifyContent: "center",
  },
  yesButton: {
    backgroundColor: colors.win,
    borderColor: colors.win,
  },
  noButton: {
    backgroundColor: colors.lose,
    borderColor: colors.lose,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonTextYes: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  buttonTextNo: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
});
