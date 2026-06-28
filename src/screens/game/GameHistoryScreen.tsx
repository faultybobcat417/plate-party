import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/composite/EmptyState";
import { Card } from "../../components/primitives/Card";
import type { GameSessionRecord } from "../../api/game";
import type { PlayStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGameStore } from "../../stores/useGameStore";
import { colors, spacing, typography } from "../../theme";

export function GameHistoryScreen() {
  const { userId } = useCurrentUser();
  const { sessions, isLoading, error, fetchSessions, clearError } = useGameStore();
  const stats = useMemo(() => buildStats(sessions), [sessions]);

  const refresh = useCallback(() => {
    clearError();
    void fetchSessions(userId ?? undefined);
  }, [clearError, fetchSessions, userId]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PLAY</Text>
        <Text style={styles.title}>Game History</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Played" value={String(stats.played)} />
        <Stat label="Wins" value={String(stats.wins)} />
        <Stat label="Win Rate" value={`${stats.winRate}%`} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.glaze[600]} />}
        renderItem={({ item }) => <HistoryRow session={item} currentUserId={userId ?? undefined} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.glaze[600]} />
          ) : (
            <EmptyState
              icon="🎮"
              title="No games yet"
              message="Start a plate-backed game from the Play tab."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function HistoryRow({ session, currentUserId }: { session: GameSessionRecord; currentUserId?: string }) {
  const result = getResultLabel(session, currentUserId);
  return (
    <Card style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>{formatGameType(session.gameType)}</Text>
        <Text style={[styles.result, result === "Won" && styles.resultWin]}>{result}</Text>
      </View>
      <Text style={styles.meta}>
        {session.wagerAmount ?? 0} plates · {session.status} · {formatDate(session.createdAt)}
      </Text>
    </Card>
  );
}

function buildStats(sessions: GameSessionRecord[]) {
  const completed = sessions.filter((session) => session.status === "completed" || Boolean(session.completedAt));
  const wins = completed.filter((session) => Boolean(session.winnerId)).length;
  return {
    played: completed.length,
    wins,
    winRate: completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0,
  };
}

function getResultLabel(session: GameSessionRecord, currentUserId?: string): string {
  if (!session.completedAt && session.status !== "completed") return "In Progress";
  if (!session.winnerId) return "Tie";
  return session.winnerId === currentUserId ? "Won" : "Lost";
}

function formatGameType(value: string): string {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  header: {
    padding: spacing[4],
  },
  eyebrow: {
    color: colors.glaze[300],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  statCard: {
    flex: 1,
    gap: spacing[1],
  },
  statValue: {
    color: colors.glaze[700],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.ash[600],
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
  },
  errorText: {
    color: colors.wine[300],
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing[4],
  },
  list: {
    flexGrow: 1,
    paddingBottom: spacing[8],
  },
  row: {
    gap: spacing[2],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  rowHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  result: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  resultWin: {
    color: colors.glaze[700],
  },
  meta: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
  },
});
