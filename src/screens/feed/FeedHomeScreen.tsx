import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengeCard } from "../../components/composite/ChallengeCard";
import { EmptyState } from "../../components/composite/EmptyState";
import { FeedTopTabs, type FeedTab } from "../../components/composite/FeedTopTabs";
import { ProofSubmissionSheet } from "../../components/composite/ProofSubmissionSheet";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { StreakFlame } from "../../components/streak/StreakFlame";
import { useChallengeStore } from "../../stores/useChallengeStore";
import { useGoalStore } from "../../stores/useGoalStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";
import type { Challenge } from "../../api/challenge";
import type { FeedStackParamList } from "../../navigation/types";
import type { Goal } from "../../db/schema";

type FeedNav = NativeStackNavigationProp<FeedStackParamList>;

export function FeedHomeScreen() {
  const [activeTab, setActiveTab] = useState<FeedTab>("stake");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FeedTopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "stake" ? <SteakTab /> : <GrowTab />}
    </SafeAreaView>
  );
}

function SteakTab() {
  const navigation = useNavigation<FeedNav>();
  const {
    sortedChallenges,
    pendingProofs,
    isLoading,
    error,
    hasMore,
    loadChallenges,
    loadMoreChallenges,
    submitProof,
    clearError,
  } = useChallengeStore();
  const { userId } = useCurrentUser();
  const [proofSheetOpen, setProofSheetOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useFocusEffect(useCallback(() => { void loadChallenges(); }, [loadChallenges]));

  const refresh = useCallback(() => {
    clearError();
    void loadChallenges();
  }, [clearError, loadChallenges]);

  const openProofSheet = (challenge: Challenge) => {
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in before submitting proof.");
      return;
    }
    setSelectedChallenge(challenge);
    setProofSheetOpen(true);
  };

  const submitSelectedProof = async (proofType: "camera" | "photo" | "file" | "text", proofData: string) => {
    if (!selectedChallenge) return;
    await submitProof({
      challengeId: selectedChallenge.id,
      submitterId: userId ?? "",
      proofType,
      proofData,
    });
  };

  return (
    <View style={styles.tab}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>STEAK</Text>
          <Text style={styles.subtitle}>Public challenges with plate rewards.</Text>
        </View>
        <Button title="Create" size="sm" onPress={() => navigation.navigate("CreateChallenge")} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" size="sm" variant="secondary" onPress={refresh} />
        </View>
      ) : null}

      <FlatList
        data={sortedChallenges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChallengeCard
            challenge={item}
            pendingProofs={pendingProofs.get(item.id)}
            onPress={() => navigation.navigate("ChallengeDetail", { challengeId: item.id })}
            onSubmitProof={() => openProofSheet(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.glaze[600]} />}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (hasMore) void loadMoreChallenges();
        }}
        ListFooterComponent={isLoading && sortedChallenges.length > 0 ? <ActivityIndicator color={colors.glaze[600]} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🥩"
              title="No open challenges"
              message="Create a plate-backed challenge and let friends prove they can finish it."
              actionLabel="Create Challenge"
              onAction={() => navigation.navigate("CreateChallenge")}
            />
          ) : <ActivityIndicator color={colors.glaze[600]} />
        }
      />

      <ProofSubmissionSheet
        visible={proofSheetOpen}
        onClose={() => setProofSheetOpen(false)}
        onSubmit={submitSelectedProof}
        challengeTitle={selectedChallenge?.title ?? ""}
      />
    </View>
  );
}

function GrowTab() {
  const navigation = useNavigation<FeedNav>();
  const { userId } = useCurrentUser();
  const { goals, isLoading, error, fetchGoals, completeGoal, failGoal, clearError } = useGoalStore();

  useFocusEffect(
    useCallback(() => {
      void fetchGoals(userId ?? undefined);
    }, [fetchGoals, userId]),
  );

  const refresh = useCallback(() => {
    clearError();
    void fetchGoals(userId ?? undefined);
  }, [clearError, fetchGoals, userId]);

  return (
    <View style={styles.tab}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>GROW</Text>
          <Text style={styles.subtitle}>Private goals, streaks, and self-stakes.</Text>
        </View>
        <Button title="New Goal" size="sm" onPress={() => navigation.navigate("CreateGoal")} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" size="sm" variant="secondary" onPress={refresh} />
        </View>
      ) : null}

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onPress={() => navigation.navigate("GoalDetail", { goalId: item.id })}
            onComplete={() => void completeGoal(item.id)}
            onFail={() => void failGoal(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.glaze[600]} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🌱"
              title="No goals yet"
              message="Create a personal goal, add an optional self-stake, and keep your streak alive."
              actionLabel="Create Goal"
              onAction={() => navigation.navigate("CreateGoal")}
            />
          ) : <ActivityIndicator color={colors.glaze[600]} />
        }
      />
    </View>
  );
}

function GoalCard({ goal, onPress, onComplete, onFail }: {
  goal: Goal;
  onPress: () => void;
  onComplete: () => void;
  onFail: () => void;
}) {
  const deadlineLabel = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline";
  const isActive = goal.status === "active";
  const progress = goal.status === "completed" ? 100 : goal.status === "failed" ? 25 : Math.min(85, goal.streakWeeks * 12 + 20);

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleBlock}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription} numberOfLines={2}>{goal.description || "No description"}</Text>
          </View>
          <StreakFlame streak={goal.streakWeeks} />
          <Text style={styles.goalStatus}>{goal.status}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.goalMeta}>
          <Text style={styles.goalMetaText}>🍽 {goal.stakeAmount} self-staked</Text>
          <Text style={styles.goalMetaText}>🔥 {goal.streakWeeks} weeks</Text>
          <Text style={styles.goalMetaText}>{deadlineLabel}</Text>
        </View>

        {isActive ? (
          <View style={styles.goalActions}>
            <Button title="Complete" size="sm" onPress={onComplete} />
            <Button title="Missed" size="sm" variant="secondary" onPress={onFail} />
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  tab: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  list: {
    flexGrow: 1,
    paddingBottom: spacing[8],
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: colors.wine[900],
    borderColor: colors.wine[500],
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing[3],
    margin: spacing[4],
    padding: spacing[3],
  },
  errorText: {
    color: colors.white,
    flex: 1,
    fontSize: typography.sizes.sm,
  },
  goalCard: {
    gap: spacing[3],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  goalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalTitleBlock: {
    flex: 1,
    paddingRight: spacing[3],
  },
  goalTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  goalDescription: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  goalStatus: {
    color: colors.glaze[700],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  progressTrack: {
    backgroundColor: colors.ash[200],
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.glaze[600],
    height: "100%",
  },
  goalMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  goalMetaText: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
  },
  goalActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
