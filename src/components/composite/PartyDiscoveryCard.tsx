import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";
import { colors, spacing, typography } from "../../theme";
import type { PublicParty } from "../../api/party-discovery";

export type PartyDiscoveryCardProps = {
  party: PublicParty;
  onSkip: () => void;
  onJoin: () => void;
  onSuperRequest: () => void;
  isJoined: boolean;
  isSuperRequested: boolean;
};

const vibeEmoji: Record<PublicParty["vibe"], string> = {
  competitive: "🔥",
  casual: "😎",
  charity: "❤️",
  "high-stakes": "💎",
};

export function PartyDiscoveryCard({
  party,
  onSkip,
  onJoin,
  onSuperRequest,
  isJoined,
  isSuperRequested,
}: PartyDiscoveryCardProps) {
  const spotsLeft = party.maxMembers - party.memberCount;
  const isFull = spotsLeft <= 0;

  return (
    <Card variant="elevated" padding={0} style={styles.card}>
      <View style={styles.imageArea}>
        <Text style={styles.hostImage}>{party.hostImage}</Text>
        <View style={styles.gradient} />
        <View style={styles.overlay}>
          <View style={styles.profilePic}>
            <Text style={styles.profilePicEmoji}>{party.hostProfilePic}</Text>
          </View>
          <View style={styles.hostBadge}>
            <Text style={styles.hostName}>{party.hostName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text style={styles.partyName}>{party.name}</Text>
          <View style={styles.vibeBadge}>
            <Text style={styles.vibeText}>
              {vibeEmoji[party.vibe]} {party.vibe}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{party.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>🍽 {party.plateStakes}</Text>
            <Text style={styles.statLabel}>plate stakes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              👥 {party.memberCount} / {party.maxMembers}
            </Text>
            <Text style={styles.statLabel}>members</Text>
          </View>
          <View style={styles.stat}>
            <Text
              style={[
                styles.statValue,
                spotsLeft <= 3 ? styles.urgentText : null,
              ]}
            >
              {spotsLeft <= 3 ? "🔥" : "🪑"} {spotsLeft} left
            </Text>
            <Text style={styles.statLabel}>spots</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationText}>📍 {party.location}</Text>
          {isSuperRequested && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>🔥 Priority</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <Button
            title="👈 Skip"
            variant="secondary"
            size="sm"
            onPress={onSkip}
          />
        </View>
        <View style={[styles.actionButton, styles.joinButton]}>
          <Button
            title={isJoined ? "✅ Joined" : isFull ? "🚫 Full" : "👉 Join"}
            variant="primary"
            size="sm"
            disabled={isJoined || isFull}
            onPress={onJoin}
          />
        </View>
        <View style={styles.actionButton}>
          <Pressable onPress={onSuperRequest} disabled={isSuperRequested || isFull}>
            <View
              style={[
                styles.superButton,
                (isSuperRequested || isFull) && styles.superButtonDisabled,
              ]}
            >
              <Text style={styles.superButtonText}>⬆️ 5 Plates</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  imageArea: {
    alignItems: "center",
    backgroundColor: colors.glaze[100],
    flex: 3,
    justifyContent: "center",
    minHeight: 220,
    overflow: "hidden",
    position: "relative",
  },
  hostImage: {
    fontSize: 96,
  },
  gradient: {
    backgroundColor: "rgba(0,0,0,0.25)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  overlay: {
    alignItems: "center",
    bottom: spacing[3],
    flexDirection: "row",
    left: spacing[3],
    position: "absolute",
  },
  profilePic: {
    alignItems: "center",
    backgroundColor: colors.linen[50],
    borderColor: colors.linen[50],
    borderRadius: 28,
    borderWidth: 3,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  profilePicEmoji: {
    fontSize: 28,
  },
  hostBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    marginLeft: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  hostName: {
    color: colors.linen[50],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  infoSection: {
    flex: 2,
    padding: spacing[4],
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  partyName: {
    color: colors.ink[900],
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  vibeBadge: {
    backgroundColor: colors.ash[100],
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  vibeText: {
    color: colors.ink[700],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: "capitalize",
  },
  description: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  statsRow: {
    backgroundColor: colors.ash[100],
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing[3],
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  urgentText: {
    color: colors.wine[500],
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  locationText: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
  },
  priorityBadge: {
    backgroundColor: colors.mustard[100],
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  priorityText: {
    color: colors.mustard[800],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[4],
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
  },
  joinButton: {
    flex: 1.5,
  },
  superButton: {
    alignItems: "center",
    backgroundColor: colors.mustard[500],
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
  },
  superButtonDisabled: {
    opacity: 0.5,
  },
  superButtonText: {
    color: colors.ink[900],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
