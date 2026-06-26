import { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ActivityFeedItem } from "../../components/composite/ActivityFeedItem";
import { EmptyState } from "../../components/composite/EmptyState";
import type { ProfileStackParamList } from "../../navigation/types";
import { useLedgerStore } from "../../stores/useLedgerStore";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";
import type { LedgerSourceTable } from "../../db/schema";

type Props = NativeStackScreenProps<ProfileStackParamList, "ActivityHistory">;

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

export function ActivityHistoryScreen() {
  const currentParty = usePartyStore((state) => state.currentParty);
  const entries = useLedgerStore((state) => state.entries);
  const loadLedgerEntriesForParty = useLedgerStore((state) => state.loadLedgerEntriesForParty);
  const isLoading = useLedgerStore((state) => state.isLoading);

  useEffect(() => {
    if (currentParty) {
      void loadLedgerEntriesForParty(currentParty.id);
    }
  }, [currentParty, loadLedgerEntriesForParty]);

  const sortedEntries = [...entries].reverse();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!currentParty ? (
          <EmptyState
            icon="🍽"
            title="No party selected"
            message="Join or create a party to see activity."
          />
        ) : isLoading && sortedEntries.length === 0 ? (
          <Text style={styles.loadingText}>Loading activity...</Text>
        ) : sortedEntries.length === 0 ? (
          <EmptyState
            icon="🍽"
            title="No activity yet"
            message="Bets, wagers, and pool transfers will appear here."
          />
        ) : (
          sortedEntries.map((entry) => (
            <ActivityFeedItem
              key={entry.id}
              title={entry.memo || `${entry.sourceTable.replace(/_/g, " ")}`}
              subtitle={`${entry.accountType.replace(/_/g, " ")} • ${entry.accountId.slice(0, 8)}`}
              timestamp={entry.createdAt}
              amount={entry.plateDelta}
              type={sourceToType(entry.sourceTable)}
            />
          ))
        )}
      </ScrollView>
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
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  scroll: {
    padding: spacing[4],
  },
  loadingText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
});
