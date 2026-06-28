import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { usePartyStore } from "../../stores/usePartyStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";
import type { PartyStackParamList } from "../../navigation/types";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { ReportModal } from "../../components/composite/ReportModal";
import type { ReportReason } from "../../components/composite/ReportModal";
import { supabase } from "../../lib/supabase";
import { getActiveChallenges, type ActiveChallenge } from "../../api/challenges";

export type PartyDetailScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "PartyDetail"
>;

export function PartyDetailScreen({ navigation, route }: PartyDetailScreenProps) {
  const { partyId } = route.params;
  const {
    currentParty,
    currentPartyMembers,
    isLoading: partyLoading,
    loadParty,
    loadPartyMembers,
    leaveParty,
    deleteParty,
  } = usePartyStore();
  const { userId } = useCurrentUser();
  const [reportVisible, setReportVisible] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  useEffect(() => {
    void loadParty(partyId);
    void loadPartyMembers(partyId);
  }, [partyId, loadParty, loadPartyMembers]);

  useEffect(() => {
    let alive = true;
    setChallengesLoading(true);
    setChallengeError(null);
    getActiveChallenges(partyId)
      .then((challenges) => {
        if (alive) setActiveChallenges(challenges);
      })
      .catch((error) => {
        if (alive) setChallengeError(error instanceof Error ? error.message : "Failed to load challenges.");
      })
      .finally(() => {
        if (alive) setChallengesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [partyId]);

  const isHost = currentPartyMembers.some(
    (m) => m.userId === userId && m.role === "host"
  );

  const handleCopyCode = useCallback(() => {
    if (currentParty?.inviteCode) {
      Clipboard.setString(currentParty.inviteCode);
      Alert.alert("Copied", "Invite code copied to clipboard.");
    }
  }, [currentParty?.inviteCode]);

  const handleLeave = useCallback(() => {
    if (!userId) return;
    Alert.alert(
      "Leave Party",
      "Are you sure you want to leave this party?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveParty(partyId, userId);
              navigation.navigate("PartyList");
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to leave party.");
            }
          },
        },
      ]
    );
  }, [userId, partyId, leaveParty, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Party",
      "This cannot be undone. All members will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteParty(partyId);
              navigation.navigate("PartyList");
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete party.");
            }
          },
        },
      ]
    );
  }, [partyId, deleteParty, navigation]);

  const handleReport = useCallback(async (reason: ReportReason, description: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("reports").insert({
      reporter_id: session.user.id,
      target_type: "party",
      target_id: partyId,
      reason,
      description: description || null,
    });
    setReportVisible(false);
    Alert.alert("Reported", "Thank you. We will review this report.");
  }, [partyId]);

  if (partyLoading && !currentParty) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.glaze[500]} />
      </View>
    );
  }

  if (!currentParty) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>Party not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Build leaderboard from currentPartyMembers
  const leaderboard = currentPartyMembers
    .map((member) => ({
      userId: member.userId,
      displayName: member.displayName || "Unknown",
      platesWon: member.totalWins * (currentParty?.defaultStakePlates ?? 1),
    }))
    .sort((a, b) => b.platesWon - a.platesWon);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.partyName}>{currentParty.name}</Text>
            {currentParty.description ? (
              <Text style={styles.partyDesc}>{currentParty.description}</Text>
            ) : null}
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Code: {currentParty.inviteCode}</Text>
              <Pressable onPress={handleCopyCode} style={styles.copyBtn}>
                <Text style={styles.copyBtnText}>Copy</Text>
              </Pressable>
            </View>
            {isHost && <Text style={styles.badge}>Host</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Members ({currentPartyMembers.length})</Text>
            {currentPartyMembers.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(member.displayName || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.displayName || "Unknown"}
                    {member.userId === userId ? " (You)" : ""}
                  </Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <Text style={styles.memberStats}>🍽 {member.plateBalance}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              {activeChallenges.length > 3 ? <Text style={styles.seeAllText}>See All &gt;</Text> : null}
            </View>

            {challengesLoading ? (
              <ActivityIndicator color={colors.glaze[500]} style={styles.challengeLoader} />
            ) : challengeError ? (
              <Text style={styles.errorText}>{challengeError}</Text>
            ) : activeChallenges.length === 0 ? (
              <View style={styles.emptyChallengeBox}>
                <Text style={styles.emptyText}>No active challenges.</Text>
                <Pressable
                  accessibilityLabel="Create challenge"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate("CreateChallenge", { partyId })}
                >
                  <Text style={styles.createOneText}>Create One</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.challengeRail}
              >
                {activeChallenges.slice(0, 3).map((challenge) => (
                  <Pressable
                    accessibilityLabel={`Open challenge ${challenge.title}`}
                    accessibilityRole="button"
                    key={challenge.id}
                    onPress={() => navigation.navigate("ChallengeDetail", { challengeId: challenge.id })}
                    style={styles.challengeCard}
                  >
                    <Text style={styles.challengeTitle} numberOfLines={2}>{challenge.title}</Text>
                    <Text style={styles.challengeMeta}>Stake {challenge.stakeAmount} plates</Text>
                    <Text style={styles.challengePot}>{challenge.totalPot || challenge.stakeAmount} pot</Text>
                    <Text style={styles.challengeMeta}>{challenge.entryCount} entries</Text>
                    <Text style={styles.challengeMeta}>{formatRemaining(challenge.expiresAt)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            {leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No wins yet. Start playing!</Text>
            ) : (
              leaderboard.slice(0, 10).map((entry, index) => (
                <View key={entry.userId} style={styles.leaderRow}>
                  <Text style={styles.leaderRank}>#{index + 1}</Text>
                  <Text style={styles.leaderName}>{entry.displayName}</Text>
                  <Text style={styles.leaderScore}>{entry.platesWon} plates</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => navigation.navigate("CreateChallenge", { partyId })}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>Create Challenge</Text>
            </Pressable>

            <Pressable onPress={() => setReportVisible(true)} style={styles.actionBtnSecondary}>
              <Text style={styles.actionBtnSecondaryText}>Report Party</Text>
            </Pressable>

            {!isHost && (
              <Pressable onPress={handleLeave} style={styles.actionBtnDanger}>
                <Text style={styles.actionBtnDangerText}>Leave Party</Text>
              </Pressable>
            )}

            {isHost && (
              <Pressable onPress={handleDelete} style={styles.actionBtnDanger}>
                <Text style={styles.actionBtnDangerText}>Delete Party</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        <ReportModal
          visible={reportVisible}
          targetType="party"
          targetId={partyId}
          onSubmit={handleReport}
          onDismiss={() => setReportVisible(false)}
        />
        <Pressable
          accessibilityLabel="Create challenge"
          accessibilityRole="button"
          onPress={() => navigation.navigate("CreateChallenge", { partyId })}
          style={styles.fab}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

function formatRemaining(value: Date | null): string {
  if (!value) return "Open";
  const diffMs = value.getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours >= 24) return `${Math.floor(hours / 24)}d remaining`;
  if (hours >= 1) return `${hours}h remaining`;
  return `${Math.max(1, Math.floor(diffMs / (60 * 1000)))}m remaining`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  center: { justifyContent: "center", alignItems: "center" },
  scroll: { padding: spacing[5], paddingBottom: spacing[10] },
  header: { marginBottom: spacing[6] },
  partyName: { fontSize: typography.sizes["3xl"], fontWeight: typography.weights.bold, color: colors.white },
  partyDesc: { fontSize: typography.sizes.base, color: colors.ash[400], marginTop: spacing[2] },
  codeRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], marginTop: spacing[3] },
  codeLabel: { fontSize: typography.sizes.sm, color: colors.ash[300], fontFamily: typography.fontFamily.mono },
  copyBtn: { backgroundColor: colors.ink[800], paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: 8 },
  copyBtnText: { color: colors.glaze[500], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.glaze[600],
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 6,
    marginTop: spacing[2],
    overflow: "hidden",
  },
  section: { marginBottom: spacing[6] },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing[3] },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[3] },
  seeAllText: { color: colors.glaze[400], fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing[2], gap: spacing[3] },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.glaze[600], justifyContent: "center", alignItems: "center" },
  avatarText: { color: colors.white, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm },
  memberInfo: { flex: 1 },
  memberName: { fontSize: typography.sizes.base, color: colors.white, fontWeight: typography.weights.medium },
  memberRole: { fontSize: typography.sizes.xs, color: colors.ash[500], textTransform: "capitalize" },
  memberStats: { fontSize: typography.sizes.sm, color: colors.ash[400] },
  leaderRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  leaderRank: { width: 32, fontSize: typography.sizes.sm, color: colors.glaze[500], fontWeight: typography.weights.bold },
  leaderName: { flex: 1, fontSize: typography.sizes.base, color: colors.white },
  leaderScore: { fontSize: typography.sizes.sm, color: colors.ash[400] },
  emptyText: { color: colors.ash[500], fontSize: typography.sizes.base, textAlign: "center", marginVertical: spacing[4] },
  errorText: { color: colors.wine[400], fontSize: typography.sizes.sm, textAlign: "center", marginVertical: spacing[3] },
  challengeLoader: { marginVertical: spacing[4] },
  emptyChallengeBox: { alignItems: "center", backgroundColor: colors.ink[800], borderColor: colors.ink[700], borderRadius: 8, borderWidth: 1, padding: spacing[4] },
  createOneText: { color: colors.glaze[400], fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  challengeRail: { gap: spacing[3], paddingRight: spacing[5] },
  challengeCard: { backgroundColor: colors.ink[800], borderColor: colors.ink[700], borderRadius: 8, borderWidth: 1, gap: spacing[2], minHeight: 148, padding: spacing[4], width: 220 },
  challengeTitle: { color: colors.white, fontSize: typography.sizes.base, fontWeight: typography.weights.bold, lineHeight: typography.lineHeights.base },
  challengeMeta: { color: colors.ash[400], fontSize: typography.sizes.sm },
  challengePot: { color: colors.gold, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  actions: { gap: spacing[3], marginTop: spacing[4] },
  actionBtn: { backgroundColor: colors.glaze[600], paddingVertical: spacing[4], borderRadius: 12, alignItems: "center" },
  actionBtnText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  actionBtnSecondary: { backgroundColor: colors.ink[800], paddingVertical: spacing[4], borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.ink[700] },
  actionBtnSecondaryText: { color: colors.ash[300], fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  actionBtnDanger: { backgroundColor: colors.wine[900], paddingVertical: spacing[4], borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.wine[700] },
  actionBtnDangerText: { color: colors.wine[300], fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  backBtn: { marginTop: spacing[4], backgroundColor: colors.ink[800], paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderRadius: 12 },
  backBtnText: { color: colors.white, fontWeight: typography.weights.semibold },
  fab: { alignItems: "center", backgroundColor: colors.glaze[500], borderRadius: 28, bottom: spacing[6], height: 56, justifyContent: "center", position: "absolute", right: spacing[5], width: 56 },
  fabText: { color: colors.white, fontSize: typography.sizes["3xl"], fontWeight: typography.weights.bold, lineHeight: typography.lineHeights["3xl"] },
});
