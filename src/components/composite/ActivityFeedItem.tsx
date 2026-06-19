import { StyleSheet, Text, View } from "react-native";

import { Card } from "../primitives/Card";
import { colors, spacing, typography } from "../../theme";
import type { LedgerEntry, PoolTransaction } from "../../db/schema";

export type ActivityFeedItemProps = {
  title: string;
  subtitle?: string;
  timestamp: string;
  amount?: number;
  type?: "wager" | "pool" | "iou" | "bet";
};

const typeLabels: Record<NonNullable<ActivityFeedItemProps["type"]>, string> = {
  wager: "🎯 Wager",
  pool: "🏊 Pool",
  iou: "🧾 IOU",
  bet: "🎲 Bet",
};

export function ActivityFeedItem({
  title,
  subtitle,
  timestamp,
  amount,
  type = "wager",
}: ActivityFeedItemProps) {
  const formattedDate = new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card variant="default" padding={3} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{typeLabels[type][0]}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.timestamp}>{formattedDate}</Text>
        </View>
        {amount !== undefined ? (
          <Text
            style={[
              styles.amount,
              { color: amount >= 0 ? colors.glaze[700] : colors.wine[600] },
            ]}
          >
            {amount >= 0 ? `+${amount}` : amount} 🍽
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
  },
  row: {
    flexDirection: "row",
    gap: spacing[3],
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.ash[100],
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  icon: {
    fontSize: typography.sizes.lg,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5] ?? 2,
  },
  timestamp: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  amount: {
    alignSelf: "center",
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});
