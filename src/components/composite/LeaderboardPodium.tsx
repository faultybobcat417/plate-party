import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme";
import type {
  GroupLeaderboardEntry,
  LeaderboardEntry,
} from "../../api/leaderboard";

const { width: SCREEN_W } = Dimensions.get("window");

export type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[] | GroupLeaderboardEntry[];
  type: "individual" | "group";
};

const PODIUM_COLORS = {
  gold: {
    background: "rgba(245, 158, 11, 0.15)",
    border: "#F59E0B",
    block: "rgba(245, 158, 11, 0.25)",
  },
  silver: {
    background: "rgba(192, 192, 192, 0.15)",
    border: "#C0C0C0",
    block: "rgba(192, 192, 192, 0.25)",
  },
  bronze: {
    background: "rgba(205, 127, 50, 0.15)",
    border: "#CD7F32",
    block: "rgba(205, 127, 50, 0.25)",
  },
};

export function LeaderboardPodium({ entries, type }: LeaderboardPodiumProps) {
  const top3 = entries.slice(0, 3);

  if (top3.length === 0) return null;

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerTranslate, {
        toValue: SCREEN_W,
        duration: 2000,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [shimmerTranslate]);

  const getName = (entry: LeaderboardEntry | GroupLeaderboardEntry) =>
    entry.name;
  const getPlates = (entry: LeaderboardEntry | GroupLeaderboardEntry) =>
    entry.plates;
  const getAvatar = (entry: LeaderboardEntry | GroupLeaderboardEntry) => {
    if (type === "individual") return (entry as LeaderboardEntry).avatar;
    return "🏆";
  };
  const getSubtitle = (entry: LeaderboardEntry | GroupLeaderboardEntry) => {
    if (type === "group") {
      return `${(entry as GroupLeaderboardEntry).memberCount} members`;
    }
    const streak = (entry as LeaderboardEntry).streak;
    return streak > 0 ? `🔥 ${streak} day streak` : "";
  };

  return (
    <View style={styles.container}>
      <View style={styles.podiumRow}>
        {second && (
          <View style={[styles.podiumItem, styles.secondPlace]}>
            <View
              style={[
                styles.avatarRing,
                {
                  backgroundColor: PODIUM_COLORS.silver.background,
                  borderColor: PODIUM_COLORS.silver.border,
                },
              ]}
            >
              <Text style={styles.avatar}>{getAvatar(second)}</Text>
            </View>
            <Text style={styles.medal}>🥈</Text>
            <Text style={styles.name} numberOfLines={1}>
              {getName(second)}
            </Text>
            <Text style={styles.plates}>
              🍽 {getPlates(second).toLocaleString()}
            </Text>
            <Text style={styles.subtitle}>{getSubtitle(second)}</Text>
            <View
              style={[
                styles.podiumBlock,
                {
                  backgroundColor: PODIUM_COLORS.silver.block,
                  borderTopColor: PODIUM_COLORS.silver.border,
                },
              ]}
            >
              <Text style={styles.blockRank}>2</Text>
            </View>
          </View>
        )}

        {first && (
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <Text style={styles.crown}>👑</Text>
            <View style={styles.shimmerContainer}>
              <View
                style={[
                  styles.avatarRing,
                  styles.goldRing,
                  {
                    backgroundColor: PODIUM_COLORS.gold.background,
                    borderColor: PODIUM_COLORS.gold.border,
                  },
                ]}
              >
                <Text style={[styles.avatar, styles.firstAvatar]}>
                  {getAvatar(first)}
                </Text>
              </View>
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              />
            </View>
            <Text style={styles.medal}>🥇</Text>
            <Text style={[styles.name, styles.firstName]} numberOfLines={1}>
              {getName(first)}
            </Text>
            <Text style={[styles.plates, styles.firstPlates]}>
              🍽 {getPlates(first).toLocaleString()}
            </Text>
            <Text style={styles.subtitle}>{getSubtitle(first)}</Text>
            <View
              style={[
                styles.podiumBlock,
                styles.goldBlock,
                {
                  backgroundColor: PODIUM_COLORS.gold.block,
                  borderTopColor: PODIUM_COLORS.gold.border,
                },
              ]}
            >
              <Text style={[styles.blockRank, styles.firstBlockRank]}>1</Text>
            </View>
          </View>
        )}

        {third && (
          <View style={[styles.podiumItem, styles.thirdPlace]}>
            <View
              style={[
                styles.avatarRing,
                {
                  backgroundColor: PODIUM_COLORS.bronze.background,
                  borderColor: PODIUM_COLORS.bronze.border,
                },
              ]}
            >
              <Text style={styles.avatar}>{getAvatar(third)}</Text>
            </View>
            <Text style={styles.medal}>🥉</Text>
            <Text style={styles.name} numberOfLines={1}>
              {getName(third)}
            </Text>
            <Text style={styles.plates}>
              🍽 {getPlates(third).toLocaleString()}
            </Text>
            <Text style={styles.subtitle}>{getSubtitle(third)}</Text>
            <View
              style={[
                styles.podiumBlock,
                {
                  backgroundColor: PODIUM_COLORS.bronze.block,
                  borderTopColor: PODIUM_COLORS.bronze.border,
                },
              ]}
            >
              <Text style={styles.blockRank}>3</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing[5],
  },
  podiumRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  podiumItem: {
    alignItems: "center",
    width: SCREEN_W * 0.28,
  },
  firstPlace: {
    width: SCREEN_W * 0.34,
    zIndex: 2,
  },
  secondPlace: {
    paddingBottom: spacing[5],
  },
  thirdPlace: {
    paddingBottom: spacing[7],
  },
  crown: {
    fontSize: 20,
    marginBottom: spacing[1],
  },
  shimmerContainer: {
    borderRadius: 38,
    overflow: "hidden",
  },
  avatarRing: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 3,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing[2],
    width: 56,
  },
  goldRing: {
    borderRadius: 38,
    height: 76,
    width: 76,
  },
  avatar: {
    fontSize: 28,
  },
  firstAvatar: {
    fontSize: 38,
  },
  shimmer: {
    backgroundColor: "rgba(255,255,255,0.35)",
    height: "100%",
    position: "absolute",
    width: 40,
  },
  medal: {
    fontSize: 16,
    marginBottom: spacing[1],
  },
  name: {
    color: colors.ink[900],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[1],
    textAlign: "center",
  },
  firstName: {
    fontSize: typography.sizes.base,
  },
  plates: {
    color: colors.mustard[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[1],
  },
  firstPlates: {
    fontSize: typography.sizes.base,
  },
  subtitle: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginBottom: spacing[2],
  },
  podiumBlock: {
    alignItems: "center",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 3,
    justifyContent: "center",
    width: "100%",
  },
  goldBlock: {
    height: 90,
  },
  blockRank: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    opacity: 0.6,
  },
  firstBlockRank: {
    fontSize: typography.sizes["2xl"],
    opacity: 0.8,
  },
});
