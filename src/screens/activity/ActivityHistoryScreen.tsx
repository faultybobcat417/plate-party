import { useEffect, useState, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getTransactions } from "../../api/plates";
import { colors, spacing, typography } from "../../theme";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import type { LedgerTransaction, LedgerTransactionType } from "../../api/plates";

const FILTERS: { label: string; value: LedgerTransactionType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Purchases", value: "purchase" },
  { label: "Wins", value: "win" },
  { label: "Losses", value: "loss" },
  { label: "Donations", value: "donate" },
  { label: "Refunds", value: "refund" },
];

const TYPE_COLORS: Record<string, string> = {
  purchase: colors.glaze[600],
  iap_purchase: colors.glaze[600],
  win: colors.win,
  loss: colors.lose,
  donate: colors.charity.impact,
  donation: colors.charity.impact,
  refund: colors.semantic.info,
  earn: colors.glaze[600],
  spend: colors.ash[400],
  bet_placed: colors.ash[400],
  wager_escrow: colors.ash[400],
  tutorial_reward: colors.glaze[600],
  goal_reward: colors.glaze[600],
};

export function ActivityHistoryScreen() {
  const { userId } = useCurrentUser();
  const [entries, setEntries] = useState<LedgerTransaction[]>([]);
  const [filter, setFilter] = useState<LedgerTransactionType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions(userId, { limit: 100 });
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const renderItem = ({ item }: { item: LedgerTransaction }) => {
    const isPositive = item.amount > 0;
    const color = TYPE_COLORS[item.type] ?? colors.ash[400];
    const date = new Date(item.createdAt).toLocaleDateString();

    return (
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.typeBadge, { color, borderColor: color }]}>{item.type}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={[styles.amount, { color: isPositive ? colors.win : colors.lose }]}>
          {isPositive ? "+" : ""}{item.amount}
        </Text>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Activity History</Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[styles.filterPill, filter === f.value && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {loading ? "Loading..." : "No activity found."}
            </Text>
          }
          refreshing={loading}
          onRefresh={load}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  title: { fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, color: colors.white, paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[3] },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], paddingHorizontal: spacing[5], marginBottom: spacing[4] },
  filterPill: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: 99, borderWidth: 1, borderColor: colors.ink[700], backgroundColor: colors.ink[800] },
  filterPillActive: { backgroundColor: colors.glaze[600], borderColor: colors.glaze[600] },
  filterText: { fontSize: typography.sizes.xs, color: colors.ash[400] },
  filterTextActive: { color: colors.white, fontWeight: typography.weights.bold },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[6] },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  left: { flex: 1 },
  typeBadge: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, textTransform: "uppercase", borderWidth: 1, borderRadius: 6, paddingHorizontal: spacing[2], paddingVertical: spacing[1], alignSelf: "flex-start", overflow: "hidden" },
  date: { fontSize: typography.sizes.xs, color: colors.ash[500], marginTop: spacing[1] },
  amount: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  emptyText: { color: colors.ash[500], textAlign: "center", marginTop: spacing[10], fontSize: typography.sizes.base },
});
