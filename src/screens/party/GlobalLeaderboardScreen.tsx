import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { LeaderboardPodium } from "../../components/composite/LeaderboardPodium";
import {
  isCurrentUserEntry,
  LeaderboardRow,
} from "../../components/composite/LeaderboardRow";
import { Button } from "../../components/primitives/Button";
import { EmptyState } from "../../components/composite/EmptyState";
import { useLeaderboardStore } from "../../stores/useLeaderboardStore";
import { colors, spacing, typography } from "../../theme";
import type { PartyStackParamList } from "../../navigation/types";
import type {
  GroupLeaderboardEntry,
  LeaderboardEntry,
} from "../../api/leaderboard";

export type GlobalLeaderboardScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "GlobalLeaderboard"
>;

function getGapToNext(
  entries: LeaderboardEntry[] | GroupLeaderboardEntry[],
  rank: number,
): number | null {
  const current = entries.find((entry) => entry.rank === rank);
  const next = entries.find((entry) => entry.rank === rank - 1);

  if (!current || !next) return null;
  return next.plates - current.plates;
}

export function GlobalLeaderboardScreen() {
  const {
    entries,
    isLoading,
    error,
    mode,
    type,
    userRank,
    loadLeaderboard,
    setMode,
    setType,
    clearError,
  } = useLeaderboardStore();

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  const top3 = entries.slice(0, 3);
  const top100 = entries.slice(3);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>Daily / Monthly top performers</Text>
        </View>
      </View>

      <View style={styles.toggleSection}>
        <View style={styles.toggleRow}>
          <Button
            title="📅 Daily"
            size="sm"
            variant={mode === "daily" ? "primary" : "secondary"}
            onPress={() => setMode("daily")}
          />
          <Button
            title="📆 Monthly"
            size="sm"
            variant={mode === "monthly" ? "primary" : "secondary"}
            onPress={() => setMode("monthly")}
          />
        </View>

        <View style={styles.toggleRow}>
          <Button
            title="👤 Individual"
            size="sm"
            variant={type === "individual" ? "primary" : "secondary"}
            onPress={() => setType("individual")}
          />
          <Button
            title="👥 Group"
            size="sm"
            variant={type === "group" ? "primary" : "secondary"}
            onPress={() => setType("group")}
          />
        </View>
      </View>

      {isLoading && entries.length === 0 && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.glaze[600]} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Button
            title="Dismiss"
            onPress={clearError}
            variant="secondary"
          />
        </View>
      )}

      {!isLoading && entries.length === 0 && (
        <View style={styles.centered}>
          <EmptyState
            icon="🎯"
            title="Be the first on the leaderboard!"
            message="Join a party and start winning."
          />
        </View>
      )}

      {!isLoading && entries.length > 0 && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <LeaderboardPodium entries={top3} type={type} />

          {userRank && userRank <= 100 && (
            <View style={styles.yourRankBanner}>
              <Text style={styles.yourRankText}>
                You are <Text style={styles.rankHighlight}>#{userRank}</Text>
              </Text>
              {(() => {
                const gap = getGapToNext(entries, userRank);
                return gap !== null && gap > 0 ? (
                  <Text style={styles.yourRankSub}>
                    {gap.toLocaleString()} plates from #{userRank - 1}
                  </Text>
                ) : null;
              })()}
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>🏆 Top 100</Text>
            <Text style={styles.listHeaderSub}>
              {entries.length} competing
            </Text>
          </View>

          {top100.map((entry) => (
            <LeaderboardRow
              key={type === "individual" ? (entry as LeaderboardEntry).userId : (entry as GroupLeaderboardEntry).groupId}
              entry={entry}
              type={type}
              isCurrentUser={type === "individual" && isCurrentUserEntry(entry)}
              gapToNext={getGapToNext(entries, entry.rank)}
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
  toggleSection: {
    gap: spacing[2],
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
  },
  loadingText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginTop: spacing[3],
  },
  errorText: {
    color: colors.wine[500],
    fontSize: typography.sizes.base,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  yourRankBanner: {
    alignItems: "center",
    backgroundColor: colors.linen[50],
    borderColor: colors.glaze[600],
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: spacing[4],
    marginVertical: spacing[3],
    padding: spacing[4],
  },
  yourRankText: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  rankHighlight: {
    color: colors.mustard[700],
    fontSize: typography.sizes.xl,
  },
  yourRankSub: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  listHeader: {
    alignItems: "center",
    borderTopColor: colors.ash[200],
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  listHeaderText: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  listHeaderSub: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
  },
});
