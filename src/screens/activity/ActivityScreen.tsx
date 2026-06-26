import { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityFeedItem } from "../../components/composite/ActivityFeedItem";
import { EmptyState } from "../../components/composite/EmptyState";
import { useLedgerStore } from "../../stores/useLedgerStore";
import { colors, spacing, typography } from "../../theme";
import type { LedgerSourceTable } from "../../db/schema";

const sourceToType = (sourceTable: LedgerSourceTable): "wager" | "pool" | "iou" | "bet" => {
  switch (sourceTable) {
    case "pool_transactions":
      return "pool";
    case "ious":
      return "iou";
    case "bets":
      return "bet";
    case "manual_adjustments":
    default:
      return "wager";
  }
};

export function ActivityScreen() {
  const { entries, loadAllEntries } = useLedgerStore();

  useEffect(() => {
    void loadAllEntries();
  }, [loadAllEntries]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your recent moves</Text>
      </View>

      {entries.length === 0 ? (
        <EmptyState
          icon="🍽"
          title="No activity yet"
          message="Join a party and start betting to see activity here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {entries.map((entry) => (
            <ActivityFeedItem
              key={entry.id}
              title={entry.memo || `${entry.sourceTable.replace(/_/g, " ")}`}
              subtitle={`${entry.accountType.replace(/_/g, " ")} • ${entry.accountId.slice(0, 8)}`}
              timestamp={entry.createdAt}
              amount={entry.plateDelta}
              type={sourceToType(entry.sourceTable)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  list: {
    padding: spacing[4],
    gap: spacing[3],
  },
});
