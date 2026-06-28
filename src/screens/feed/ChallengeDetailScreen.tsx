import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getChallengeById,
  getChallengeEntries,
  resolveChallenge,
  type Challenge,
  type ChallengeEntry,
} from "../../api/challenge";
import { Badge } from "../../components/primitives/Badge";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { EmptyState } from "../../components/composite/EmptyState";
import { ProofSubmissionSheet } from "../../components/composite/ProofSubmissionSheet";
import { SubmissionCard } from "../../components/composite/SubmissionCard";
import type { FeedStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useChallengeStore } from "../../stores/useChallengeStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<FeedStackParamList, "ChallengeDetail">;

export function ChallengeDetailScreen({ route, navigation }: Props) {
  const { challengeId } = route.params;
  const cachedChallenge = useChallengeStore((state) =>
    state.challenges.find((challenge) => challenge.id === challengeId),
  );
  const submitProof = useChallengeStore((state) => state.submitProof);
  const { userId, isAuthenticated } = useCurrentUser();

  const [challenge, setChallenge] = useState<Challenge | null>(cachedChallenge ?? null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(!cachedChallenge);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofSheetOpen, setProofSheetOpen] = useState(false);
  const [resolvingEntryId, setResolvingEntryId] = useState<string | null>(null);

  const isCreator = Boolean(userId && challenge?.creatorId === userId);
  const submittedEntries = useMemo(
    () => entries.filter((entry) => Boolean(entry.proofUrl || entry.proofSubmittedAt)),
    [entries],
  );

  const loadDetail = useCallback(async () => {
    setError(null);
    const [freshChallenge, freshEntries] = await Promise.all([
      getChallengeById(challengeId),
      getChallengeEntries(challengeId),
    ]);
    setChallenge(freshChallenge);
    setEntries(freshEntries);
  }, [challengeId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadDetail()
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught.message : "Failed to load challenge.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [loadDetail]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadDetail();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to refresh challenge.");
    } finally {
      setRefreshing(false);
    }
  };

  const openProofSheet = () => {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in before submitting proof.");
      return;
    }
    setProofSheetOpen(true);
  };

  const submitSelectedProof = async (proofType: "camera" | "photo" | "file" | "text", proofData: string) => {
    if (!challenge || !userId) return;
    await submitProof({
      challengeId: challenge.id,
      submitterId: userId,
      proofType,
      proofData,
    });
    await refresh();
  };

  const pickWinner = async (entry: ChallengeEntry) => {
    setResolvingEntryId(entry.id);
    try {
      await resolveChallenge({ challengeId, winnerEntryId: entry.id });
      Alert.alert("Winner picked", "The plate reward has been resolved.");
      await refresh();
    } catch (caught) {
      Alert.alert("Could not pick winner", caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setResolvingEntryId(null);
    }
  };

  if (loading && !challenge) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.glaze[500]} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <EmptyState
          icon="🔍"
          title="Challenge not found"
          message={error ?? "This challenge may have been deleted."}
          actionLabel="Back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.glaze[500]} />}
      >
        <View style={styles.header}>
          <Button title="Back" size="sm" variant="ghost" onPress={() => navigation.goBack()} />
          <View style={styles.badges}>
            <Badge label={challenge.type} variant="info" />
            <Badge label={challenge.status} variant={challenge.status === "completed" ? "success" : "warning"} />
          </View>
        </View>

        <Text style={styles.title}>{challenge.title}</Text>
        {challenge.description ? <Text style={styles.description}>{challenge.description}</Text> : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Card style={styles.rewardCard}>
          <View>
            <Text style={styles.cardLabel}>Reward</Text>
            <Text style={styles.rewardText}>{challenge.rewardPlates ?? challenge.rewardAmount ?? 0} plates</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>Deadline {formatDate(challenge.deadline)}</Text>
            <Text style={styles.metaText}>Created {formatDate(challenge.createdAt)}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>Proof Requirements</Text>
          <View style={styles.requirements}>
            {(challenge.proofRequirements?.length ? challenge.proofRequirements : ["Any clear proof"]).map((requirement) => (
              <View key={requirement} style={styles.requirement}>
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
          </View>
        </Card>

        {!isCreator && challenge.status === "open" ? (
          <Button title="Submit Proof" size="lg" onPress={openProofSheet} />
        ) : null}

        {isCreator ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submissions</Text>
            {submittedEntries.length > 0 ? (
              submittedEntries.map((entry) => (
                <SubmissionCard
                  key={entry.id}
                  entry={entry}
                  isResolving={resolvingEntryId === entry.id}
                  onPickWinner={challenge.status === "open" ? () => void pickWinner(entry) : undefined}
                />
              ))
            ) : (
              <Card style={styles.card}>
                <Text style={styles.emptyText}>No proof has been submitted yet.</Text>
              </Card>
            )}
          </View>
        ) : null}
      </ScrollView>

      <ProofSubmissionSheet
        visible={proofSheetOpen}
        onClose={() => setProofSheetOpen(false)}
        onSubmit={submitSelectedProof}
        challengeTitle={challenge.title}
      />
    </SafeAreaView>
  );
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "not set";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "not set" : date.toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  loader: {
    marginTop: spacing[10],
  },
  scroll: {
    gap: spacing[4],
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badges: {
    flexDirection: "row",
    gap: spacing[2],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  description: {
    color: colors.ash[300],
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  errorText: {
    color: colors.wine[300],
    fontSize: typography.sizes.sm,
  },
  card: {
    gap: spacing[3],
  },
  rewardCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[4],
    justifyContent: "space-between",
  },
  cardLabel: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
  },
  rewardText: {
    color: colors.glaze[700],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginTop: spacing[1],
  },
  metaBlock: {
    alignItems: "flex-end",
    gap: spacing[1],
  },
  metaText: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
  },
  requirements: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  requirement: {
    backgroundColor: colors.glaze[100],
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  requirementText: {
    color: colors.glaze[800],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: "capitalize",
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  emptyText: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
  },
});
