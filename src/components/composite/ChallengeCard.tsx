import { View, Text, Pressable, StyleSheet } from "react-native";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { Card } from "../primitives/Card";
import type { Challenge, ProofSubmission } from "../../api/challenge";

export type ChallengeCardProps = {
  challenge: Challenge;
  pendingProofs?: ProofSubmission[];
  onPress: () => void;
  onSubmitProof: () => void;
};

function getStatusColor(status: Challenge["status"]) {
  switch (status) {
    case "open": return colors.glaze[600];
    case "claimed": return "#F59E0B";
    case "completed": return "#10B981";
    case "expired": return colors.ash[500];
    default: return colors.ash[500];
  }
}

function getTimeRemaining(deadline: string): string {
  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) return "No deadline";
  const diff = deadlineMs - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

function getUrgency(deadline: string): boolean {
  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) return false;
  const diff = deadlineMs - Date.now();
  return diff > 0 && diff < 6 * 60 * 60 * 1000;
}

export function ChallengeCard({ challenge, pendingProofs, onPress, onSubmitProof }: ChallengeCardProps) {
  const statusColor = getStatusColor(challenge.status);
  const timeRemaining = getTimeRemaining(challenge.deadline);
  const isUrgent = getUrgency(challenge.deadline);
  const hasPending = (pendingProofs?.length ?? 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${challenge.title ?? "Challenge"}, ${timeRemaining}, reward ${challenge.rewardPlates ?? 0} plates`}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.typeText, { color: statusColor }]}>
              {challenge.type === "self" ? "🎯" : challenge.type === "bounty" ? "🏆" : "👥"} {challenge.type}
            </Text>
          </View>
          <Text style={[styles.time, isUrgent && styles.timeUrgent]}>
            {isUrgent ? "🔥 " : ""}{timeRemaining}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>
        {challenge.description && (
          <Text style={styles.description} numberOfLines={2}>{challenge.description}</Text>
        )}

        <View style={styles.footer}>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardEmoji}>🍽</Text>
            <Text style={styles.rewardAmount}>{challenge.rewardPlates}</Text>
          </View>

          {challenge.status === "open" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Submit proof for ${challenge.title ?? "challenge"}`}
              onPress={(e) => {
                e.stopPropagation();
                onSubmitProof();
              }}
              style={({ pressed }) => [
                styles.proofButton,
                pressed && styles.proofButtonPressed,
              ]}
            >
              <Text style={styles.proofButtonText}>Submit Proof</Text>
            </Pressable>
          )}

          {hasPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>⏳ Pending</Text>
            </View>
          )}
        </View>

        {hasPending && pendingProofs && (
          <View style={styles.proofList}>
            {pendingProofs.map((proof) => (
              <View key={proof.id} style={styles.proofItem}>
                <Text style={styles.proofType}>
                  {proof.proofType === "camera" ? "📷" : proof.proofType === "photo" ? "🖼️" : proof.proofType === "file" ? "📁" : "📝"} {proof.proofType}
                </Text>
                <Text style={styles.proofTime}>
                  {Number.isNaN(new Date(proof.submittedAt ?? "").getTime())
                    ? "Just now"
                    : new Date(proof.submittedAt ?? "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
    padding: spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  typeBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 9999,
  },
  typeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  timeUrgent: {
    color: "#EF4444",
    fontWeight: typography.weights.bold,
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
    lineHeight: 22,
  },
  description: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[3],
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing[2],
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glaze[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 9999,
  },
  rewardEmoji: {
    fontSize: 14,
    marginRight: spacing[1],
  },
  rewardAmount: {
    color: colors.glaze[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  proofButton: {
    backgroundColor: colors.glaze[600],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 8,
  },
  proofButtonPressed: {
    opacity: 0.85,
  },
  proofButtonText: {
    color: colors.linen[100],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  pendingBadge: {
    backgroundColor: "#8B5CF620",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 8,
  },
  pendingText: {
    color: "#8B5CF6",
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  proofList: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ash[200],
    gap: spacing[2],
  },
  proofItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.ash[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
  proofType: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
  },
  proofTime: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
  },
});
