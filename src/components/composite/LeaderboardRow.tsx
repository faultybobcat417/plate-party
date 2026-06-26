import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme";
import type { GroupLeaderboardEntry, LeaderboardEntry } from "../../api/leaderboard";

export type LeaderboardRowProps = {
  entry: LeaderboardEntry | GroupLeaderboardEntry;
  type: "individual" | "group";
  isCurrentUser?: boolean;
  gapToNext?: number | null;
};

const CURRENT_USER_ID = "u-16";

export function LeaderboardRow({
  entry,
  type,
  isCurrentUser = false,
  gapToNext,
}: LeaderboardRowProps) {
  const avatar =
    type === "individual" ? (entry as LeaderboardEntry).avatar : "👥";
  const streak =
    type === "individual" ? (entry as LeaderboardEntry).streak : null;
  const memberCount =
    type === "group" ? (entry as GroupLeaderboardEntry).memberCount : null;

  const rankColor =
    entry.rank <= 10 ? colors.mustard[700] : colors.ash[500];

  const rankChange = entry.rankChange ?? 0;
  const changeSymbol = rankChange > 0 ? "↑" : rankChange < 0 ? "↓" : "–";
  const changeColor = rankChange > 0 ? "#22C55E" : rankChange < 0 ? "#EF4444" : colors.ash[400];

  const progress =
    gapToNext && gapToNext > 0
      ? Math.max(0, Math.min(100, (1 - gapToNext / (entry.plates + gapToNext)) * 100))
      : entry.rank === 1
        ? 100
        : 0;

  return (
    <View style={[styles.row, isCurrentUser && styles.currentRow]}>
      <View style={styles.rankColumn}>
        <Text style={[styles.rank, { color: rankColor }]}>#{entry.rank}</Text>
        <Text style={[styles.changeIndicator, { color: changeColor }]}>
          {changeSymbol}
        </Text>
      </View>

      <Text style={styles.avatar}>{avatar}</Text>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={styles.subtitle}>
          {type === "group" && memberCount !== null
            ? `${memberCount} members`
            : streak && streak > 0
              ? `🔥 ${streak} day streak`
              : "Competing today"}
        </Text>

        {gapToNext !== null && gapToNext !== undefined && gapToNext > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.gapText}>
              {gapToNext.toLocaleString()} plates from #{entry.rank - 1}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.platesColumn}>
        <Text style={styles.plates}>🍽 {entry.plates.toLocaleString()}</Text>
        {isCurrentUser && (
          <View style={styles.youBadge}>
            <Text style={styles.youText}>You</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function isCurrentUserEntry(entry: LeaderboardEntry | GroupLeaderboardEntry): boolean {
  return "userId" in entry && entry.userId === CURRENT_USER_ID;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.ash[200],
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  currentRow: {
    backgroundColor: "rgba(58, 135, 168, 0.08)",
    borderLeftColor: colors.glaze[600],
    borderLeftWidth: 3,
  },
  rankColumn: {
    alignItems: "center",
    minWidth: 44,
  },
  rank: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  changeIndicator: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  avatar: {
    fontSize: 24,
    marginRight: spacing[3],
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  progressSection: {
    marginTop: spacing[2],
  },
  progressBar: {
    backgroundColor: colors.ash[200],
    borderRadius: 4,
    height: 8,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    backgroundColor: "#22C55E",
    borderRadius: 4,
    height: "100%",
  },
  gapText: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  platesColumn: {
    alignItems: "flex-end",
    marginLeft: spacing[3],
  },
  plates: {
    color: colors.mustard[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  youBadge: {
    backgroundColor: colors.glaze[600],
    borderRadius: 8,
    marginTop: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  youText: {
    color: colors.linen[50],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
