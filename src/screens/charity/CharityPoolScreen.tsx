import { useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Card } from "../../components/primitives/Card";
import { ActivityFeedItem } from "../../components/composite/ActivityFeedItem";
import { EmptyState } from "../../components/composite/EmptyState";
import type { PartyStackParamList } from "../../navigation/types";
import { useLedgerStore } from "../../stores/useLedgerStore";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "CharityPool">;

export function CharityPoolScreen({ route }: Props) {
  const { partyId } = route.params;
  const entries = useLedgerStore((state) => state.entries);
  const accountBalances = useLedgerStore((state) => state.accountBalances);
  const loadLedgerEntriesForParty = useLedgerStore((state) => state.loadLedgerEntriesForParty);
  const loadPartyAccountBalances = useLedgerStore((state) => state.loadPartyAccountBalances);
  const isLoading = useLedgerStore((state) => state.isLoading);
  const currentParty = usePartyStore((state) => state.currentParty);
  const loadParty = usePartyStore((state) => state.loadParty);

  useEffect(() => {
    void loadLedgerEntriesForParty(partyId!);
    void loadPartyAccountBalances(partyId!);
    void loadParty(partyId!);
  }, [partyId, loadLedgerEntriesForParty, loadPartyAccountBalances, loadParty]);

  const poolTotal = useMemo(() => {
    const fromBalances = accountBalances.find(
      (balance) => (balance as any).accountType === "charity_pool" && (balance as any).accountId === partyId,
    );
    return fromBalances?.balance ?? currentParty?.charityPoolPlates ?? 0;
  }, [accountBalances, currentParty, partyId]);

  const poolEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.accountType === "charity_pool" || entry.sourceTable === "pool_transactions")
      .slice()
      .reverse();
  }, [entries]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Charity Pool</Text>
        {currentParty ? (
          <Text style={styles.orgName}>{currentParty.charityOrgName}</Text>
        ) : null}

        <Card variant="elevated" padding={6} style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Plates</Text>
          <Text style={styles.totalAmount}>{poolTotal} 🍽</Text>
          <Text style={styles.totalHint}>Every lost wager feeds the pool.</Text>
        </Card>

        <Text style={styles.sectionTitle}>Pool Activity</Text>
        {isLoading && poolEntries.length === 0 ? (
          <Text style={styles.loadingText}>Loading activity...</Text>
        ) : poolEntries.length === 0 ? (
          <EmptyState
            icon="🏊"
            title="No pool activity yet"
            message="When wagers resolve, the charity pool will grow."
          />
        ) : (
          poolEntries.map((entry) => (
            <ActivityFeedItem
              key={entry.id}
              title={entry.memo || "Charity pool entry"}
              subtitle={entry.sourceTable.replace(/_/g, " ")}
              timestamp={entry.createdAt}
              amount={entry.plateDelta}
              type={entry.sourceTable === "pool_transactions" ? "pool" : "wager"}
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
  scroll: {
    padding: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[1],
  },
  orgName: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginBottom: spacing[4],
  },
  totalCard: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  totalLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[1],
  },
  totalAmount: {
    color: colors.glaze[700],
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[1],
  },
  totalHint: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.ink[700],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  loadingText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
});
