import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { Card } from "../primitives/Card";
import { colors, spacing, typography } from "../../theme";
import type { StakePost } from "../../api/stake";

export interface StakeCardProps {
  post: StakePost;
  onStake: (optionIndex: number) => void;
  onFollow?: (creatorId: string) => void;
}

function getTimeRemaining(deadline: string): string {
  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) return "No deadline";
  const diff = deadlineMs - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h left`;
}

function isUrgent(deadline: string): boolean {
  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) return false;
  const diff = deadlineMs - Date.now();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

function statusBadge(status: StakePost["status"]) {
  switch (status) {
    case "open":
      return { text: "🟢 Open", color: colors.win };
    case "locked":
      return { text: "🔒 Locked", color: colors.ash[500] };
    case "resolved":
      return { text: "✅ Resolved", color: colors.glaze[600] };
    case "cancelled":
      return { text: "❌ Cancelled", color: colors.lose };
    default:
      return { text: status, color: colors.ash[500] };
  }
}

export function StakeCard({ post, onStake, onFollow }: StakeCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const safeTarget = Math.max(post.targetPlates || 0, 1);
  const progress = Math.min((post.totalStaked || 0) / safeTarget, 1);
  const badge = statusBadge(post.status);
  const urgent = isUrgent(post.deadline);
  const timeLeft = getTimeRemaining(post.deadline);

  const options = post.options ?? [];
  const leadingIndex = options.length > 0
    ? options.reduce((best, opt, i, arr) =>
        (opt?.staked ?? 0) > (arr[best]?.staked ?? 0) ? i : best, 0)
    : 0;

  return (
    <Card style={styles.card} padding={4}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarSmall} accessibilityRole="image">
          <Text style={styles.avatarSmallText}>{post.creatorAvatar || "👤"}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.creatorName}>{post.creatorName || "Unknown"}</Text>
          <View style={[styles.badge, { backgroundColor: badge.color + "20" }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            setIsFollowing(!isFollowing);
            onFollow?.(post.creatorId || "");
          }}
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
        >
          <Text style={[styles.followText, isFollowing && styles.followingText]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {post.totalStaked} / {post.targetPlates} plates
        </Text>
        <Text style={[styles.timeLeft, urgent && styles.urgent]}>
          ⏰ {timeLeft}
        </Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Social Proof */}
      <Text style={styles.socialProof}>
        {post.participantCount} people staked
      </Text>

      {/* Options */}
      <View style={styles.optionsRow}>
        {options.map((opt, index) => {
          const staked = opt?.staked ?? 0;
          const isLeading = options.length > 1 && index === leadingIndex;
          const total = options.reduce((sum, o) => sum + (o?.staked ?? 0), 0) || 1;
          const pct = Math.round((staked / total) * 100);
          const isOpen = post.status === "open";
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`Stake ${staked} plates on ${opt?.label ?? "option"}`}
              accessibilityState={{ disabled: !isOpen }}
              style={({ pressed }) => [
                styles.optionBtn,
                isLeading ? styles.leadingOption : styles.trailingOption,
                (!isOpen || pressed) && styles.pressed,
              ]}
              onPress={() => onStake(index)}
              disabled={!isOpen}
            >
              <Text
                style={[
                  styles.optionLabel,
                  isLeading ? styles.leadingText : styles.trailingText,
                ]}
              >
                {opt?.label ?? "Option"}
              </Text>
              <Text
                style={[
                  styles.optionPct,
                  isLeading ? styles.leadingText : styles.trailingText,
                ]}
              >
                {isOpen ? "Attempt" : pct + "%"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glaze[600],
    marginLeft: 8,
  },
  followingBtn: {
    backgroundColor: colors.glaze[600],
    borderColor: colors.glaze[600],
  },
  followText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.glaze[600],
  },
  followingText: {
    color: "#fff",
  },
  card: {
    marginHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glaze[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  avatarSmallText: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creatorName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink[900],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: spacing[1],
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  content: {
    fontSize: typography.sizes.base,
    color: colors.ink[900],
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  progressText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.ink[700],
  },
  timeLeft: {
    fontSize: typography.sizes.sm,
    color: colors.ash[500],
  },
  urgent: {
    color: colors.lose,
    fontWeight: typography.weights.bold,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.ash[200],
    borderRadius: 4,
    marginBottom: spacing[2],
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.glaze[600],
    borderRadius: 4,
  },
  socialProof: {
    fontSize: typography.sizes.xs,
    color: colors.ash[500],
    marginBottom: spacing[3],
  },
  optionsRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  optionBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: spacing[2],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  leadingOption: {
    backgroundColor: colors.win + "20",
    borderColor: colors.win,
  },
  trailingOption: {
    backgroundColor: colors.lose + "15",
    borderColor: colors.lose,
  },
  pressed: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  optionPct: {
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  leadingText: {
    color: colors.win,
  },
  trailingText: {
    color: colors.lose,
  },
});
