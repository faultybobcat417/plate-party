import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { colors, spacing, typography } from "../../theme";
import type { Market } from "../../stores/useMarketStore";

interface MarketCardProps {
  market: Market;
  onPress?: () => void;
  onTradePress?: () => void;
  compact?: boolean;
}

export function MarketCard({ market, onPress, onTradePress, compact }: MarketCardProps) {
  const yesPercent = Math.min(Math.round(market.yesPrice * 100), 99);
  const noPercent = 100 - yesPercent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${market.title}, ${yesPercent} percent yes`}
    >
      <Text style={styles.title} numberOfLines={2}>
        {market.title}
      </Text>

      {market.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {market.description}
        </Text>
      ) : null}

      {/* Price Bar */}
      <View style={styles.oddsBarContainer}>
        <View style={styles.oddsBar}>
          <View style={[styles.oddsYes, { flex: yesPercent / 100 }]} />
          <View style={[styles.oddsNo, { flex: noPercent / 100 }]} />
        </View>
        <View style={styles.oddsLabels}>
          <Text style={styles.oddsYesLabel}>Yes {yesPercent}%</Text>
          <Text style={styles.oddsNoLabel}>No {noPercent}%</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {market.category?.toUpperCase() || "MARKET"}
          </Text>
        </View>
        <Text style={styles.volume}>
          Vol: {market.volume.toLocaleString()} plates
        </Text>
        {onTradePress ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onTradePress();
            }}
            style={styles.tradeButton}
            accessibilityRole="button"
            accessibilityLabel="Trade this market"
          >
            <Text style={styles.tradeButtonText}>Trade</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...theme.shadows.md,
  },
  cardCompact: {
    padding: spacing[3],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.neutral[900],
    lineHeight: typography.lineHeights.lg,
    marginBottom: spacing[1],
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.neutral[500],
    lineHeight: typography.lineHeights.base,
    marginBottom: spacing[3],
  },
  oddsBarContainer: {
    marginBottom: spacing[3],
  },
  oddsBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: colors.neutral[200],
  },
  oddsYes: {
    backgroundColor: colors.primary.base,
    borderTopLeftRadius: 99,
    borderBottomLeftRadius: 99,
  },
  oddsNo: {
    backgroundColor: colors.neutral[300],
    borderTopRightRadius: 99,
    borderBottomRightRadius: 99,
  },
  oddsLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[1],
  },
  oddsYesLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary.base,
  },
  oddsNoLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[400],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing[2],
  },
  categoryBadge: {
    backgroundColor: colors.primary.subtle,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 99,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary.base,
    letterSpacing: 0.5,
  },
  volume: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
    flex: 1,
    textAlign: "center",
  },
  tradeButton: {
    backgroundColor: colors.primary.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 99,
    ...theme.shadows.sm,
  },
  tradeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
  },
});

import { theme } from "../../theme";
