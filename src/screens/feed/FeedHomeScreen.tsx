import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CommonActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/composite/EmptyState";
import { FeedTopTabs, type FeedTab } from "../../components/composite/FeedTopTabs";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { AuthModal } from "../../components/auth/AuthModal";
import { StreakFlame } from "../../components/streak/StreakFlame";
import { useGoalStore } from "../../stores/useGoalStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";
import { getPublicActiveChallenges, type ActiveChallenge } from "../../api/challenges";
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
  const { userId, isAnonymous } = useCurrentUser();
  const [challenges, setChallenges] = useState<ActiveChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authVisible, setAuthVisible] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);

  const openPartyDiscovery = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "PartyTab",
        params: { screen: "PartyDiscovery" },
      }),
    );
  }, [navigation]);

  const openChallenge = useCallback((challengeId: string) => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "PartyTab",
        params: { screen: "ChallengeDetail", params: { challengeId } },
      }),
    );
  }, [navigation]);

  const loadChallenges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextChallenges = await getPublicActiveChallenges(50);
      setChallenges(nextChallenges);
    } catch (caught) {
      setError(friendlyFeedError(caught));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadChallenges(); }, [loadChallenges]));

  const refresh = useCallback(() => {
    void loadChallenges();
  }, [loadChallenges]);

  const enterChallenge = useCallback((challengeId: string) => {
    if (!userId || isAnonymous) {
      setAuthReason("Sign in to enter challenges and wager plates.");
      setAuthVisible(true);
      return;
    }
    openChallenge(challengeId);
  }, [isAnonymous, openChallenge, userId]);

  return (
    <View style={styles.tab}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>STEAK</Text>
          <Text style={styles.subtitle}>Public challenges with plate rewards.</Text>
        </View>
        <Button title="Create" size="sm" onPress={openPartyDiscovery} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" size="sm" variant="secondary" onPress={refresh} />
        </View>
      ) : null}

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedChallengeCard
            challenge={item}
            onPress={() => openChallenge(item.id)}
            onEnter={() => enterChallenge(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.glaze[600]} />}
        ListFooterComponent={isLoading && challenges.length > 0 ? <ActivityIndicator color={colors.glaze[600]} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🥩"
              title="No open challenges"
              message="Open a party to create a challenge with friends."
              actionLabel="Browse Parties"
              onAction={openPartyDiscovery}
            />
          ) : <ActivityIndicator color={colors.glaze[600]} />
        }
      />

      <AuthModal
        visible={authVisible}
        reason={authReason}
        onClose={() => setAuthVisible(false)}
        onSignedIn={() => setAuthVisible(false)}
      />
    </View>
  );
}

function FeedChallengeCard({
  challenge,
  onPress,
  onEnter,
}: {
  challenge: ActiveChallenge;
  onPress: () => void;
  onEnter: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.feedChallengeCard}>
        <View style={styles.feedChallengeHeader}>
          <View style={styles.feedChallengeTitleBlock}>
            <Text style={styles.feedChallengeTitle} numberOfLines={2}>{challenge.title}</Text>
            <Text style={styles.feedChallengeCreator}>by {challenge.creatorName}</Text>
          </View>
          <Text style={styles.feedChallengeStatus}>{challenge.status}</Text>
        </View>

        {challenge.description ? (
          <Text style={styles.feedChallengeDescription} numberOfLines={2}>{challenge.description}</Text>
        ) : null}

        <View style={styles.feedChallengeStats}>
          <View style={styles.feedStat}>
            <Text style={styles.feedStatLabel}>Stake</Text>
            <Text style={styles.feedStatValue}>{challenge.stakeAmount}</Text>
          </View>
          <View style={styles.feedStat}>
            <Text style={styles.feedStatLabel}>Pot</Text>
            <Text style={styles.feedStatValue}>{challenge.totalPot}</Text>
          </View>
          <View style={styles.feedStat}>
            <Text style={styles.feedStatLabel}>Entries</Text>
            <Text style={styles.feedStatValue}>{challenge.entryCount}</Text>
          </View>
        </View>

        <View style={styles.feedChallengeFooter}>
          <Text style={styles.feedDeadline}>{formatChallengeDeadline(challenge.expiresAt)}</Text>
          <Button title="Enter" size="sm" onPress={onEnter} />
        </View>
      </Card>
    </Pressable>
  );
}

function formatChallengeDeadline(value: ActiveChallenge["expiresAt"]): string {
  if (!value) return "No deadline";
  const date = value instanceof Date ? value : new Date(value);
  const diff = date.getTime() - Date.now();
  if (Number.isNaN(date.getTime())) return "No deadline";
  if (diff <= 0) return "Closing soon";
  const hours = Math.ceil(diff / 3600000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.ceil(hours / 24)}d left`;
}

function friendlyFeedError(error: unknown): string {
  if (!(error instanceof Error)) return "No connection. Check your internet.";
  const message = error.message.toLocaleLowerCase();
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("invalid api key")) {
    return "No connection. Check your internet.";
  }
  return error.message;
}

function GrowTab() {
  const navigation = useNavigation<FeedNav>();
  const { userId, isAnonymous } = useCurrentUser();
  const { goals, isLoading, error, fetchGoals, completeGoal, failGoal, clearError } = useGoalStore();
  const [authVisible, setAuthVisible] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);
  const visibleGoals = isAnonymous ? [] : goals;

  useFocusEffect(
    useCallback(() => {
      if (!userId || isAnonymous) {
        clearError();
        return;
      }
      void fetchGoals(userId ?? undefined);
    }, [clearError, fetchGoals, isAnonymous, userId]),
  );

  const refresh = useCallback(() => {
    if (!userId || isAnonymous) return;
    clearError();
    void fetchGoals(userId ?? undefined);
  }, [clearError, fetchGoals, isAnonymous, userId]);

  const requireRealAccount = useCallback((reason: string, action: () => void) => {
    if (!userId || isAnonymous) {
      setAuthReason(reason);
      setAuthVisible(true);
      return;
    }
    action();
  }, [isAnonymous, userId]);

  const createGoal = useCallback(() => {
    requireRealAccount("Sign in to create goals and save streak progress.", () => navigation.navigate("CreateGoal"));
  }, [navigation, requireRealAccount]);

  return (
    <View style={styles.tab}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>GROW</Text>
          <Text style={styles.subtitle}>Private goals, streaks, and self-stakes.</Text>
        </View>
        <Button title="New Goal" size="sm" onPress={createGoal} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" size="sm" variant="secondary" onPress={refresh} />
        </View>
      ) : null}

      <FlatList
        data={visibleGoals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onPress={() => navigation.navigate("GoalDetail", { goalId: item.id })}
            onComplete={() => requireRealAccount("Sign in to complete goals and save streak progress.", () => { void completeGoal(item.id); })}
            onFail={() => requireRealAccount("Sign in to update goals and save streak progress.", () => { void failGoal(item.id); })}
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
              onAction={createGoal}
            />
          ) : <ActivityIndicator color={colors.glaze[600]} />
        }
      />
      <AuthModal
        visible={authVisible}
        reason={authReason}
        onClose={() => setAuthVisible(false)}
        onSignedIn={() => setAuthVisible(false)}
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
  feedChallengeCard: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderWidth: 1,
    gap: spacing[4],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  feedChallengeHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  feedChallengeTitleBlock: {
    flex: 1,
  },
  feedChallengeTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  feedChallengeCreator: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  feedChallengeStatus: {
    color: colors.glaze[400],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  feedChallengeDescription: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  feedChallengeStats: {
    flexDirection: "row",
    gap: spacing[2],
  },
  feedStat: {
    backgroundColor: colors.ink[900],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: spacing[3],
  },
  feedStatLabel: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
  },
  feedStatValue: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing[1],
  },
  feedChallengeFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feedDeadline: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
  goalCard: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderWidth: 1,
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
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  goalDescription: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  goalStatus: {
    color: colors.glaze[400],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  progressTrack: {
    backgroundColor: colors.ink[700],
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
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
  goalActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
