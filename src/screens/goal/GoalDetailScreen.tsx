import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { EmptyState } from "../../components/composite/EmptyState";
import { StreakCalendar } from "../../components/streak/StreakCalendar";
import { StreakFlame } from "../../components/streak/StreakFlame";
import type { FeedStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGoalStore } from "../../stores/useGoalStore";
import type { Goal } from "../../db/schema";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<FeedStackParamList, "GoalDetail">;

export function GoalDetailScreen({ route, navigation }: Props) {
  const { goalId } = route.params;
  const { userId } = useCurrentUser();
  const {
    goals,
    isLoading,
    error,
    fetchGoals,
    completeGoal,
    failGoal,
    clearError,
  } = useGoalStore();

  const goal = useMemo(() => goals.find((item) => item.id === goalId) ?? null, [goals, goalId]);

  useFocusEffect(
    useCallback(() => {
      void fetchGoals(userId ?? undefined);
    }, [fetchGoals, userId]),
  );

  const refresh = useCallback(() => {
    clearError();
    void fetchGoals(userId ?? undefined);
  }, [clearError, fetchGoals, userId]);

  const markComplete = async () => {
    try {
      await completeGoal(goalId);
    } catch (caught) {
      Alert.alert("Could not complete goal", caught instanceof Error ? caught.message : "Please try again.");
    }
  };

  const markMissed = async () => {
    try {
      await failGoal(goalId);
    } catch (caught) {
      Alert.alert("Could not update goal", caught instanceof Error ? caught.message : "Please try again.");
    }
  };

  if (isLoading && !goal) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.glaze[500]} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <EmptyState
          icon="🌱"
          title="Goal not found"
          message={error ?? "This goal may have been deleted."}
          actionLabel="Back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const progress = getGoalProgress(goal);
  const active = goal.status === "active";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.glaze[500]} />}
      >
        <View style={styles.header}>
          <Button title="Back" size="sm" variant="ghost" onPress={() => navigation.goBack()} />
          <StreakFlame streak={goal.streakWeeks} />
        </View>

        <View>
          <Text style={styles.eyebrow}>GROW</Text>
          <Text style={styles.title}>{goal.title}</Text>
          {goal.description ? <Text style={styles.description}>{goal.description}</Text> : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>Progress</Text>
            <Text style={styles.progressNumber}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.metaGrid}>
            <Meta label="Status" value={goal.status} />
            <Meta label="Self-Stake" value={`${goal.stakeAmount} plates`} />
            <Meta label="Deadline" value={goal.deadline ? goal.deadline.toLocaleString() : "None"} />
            <Meta label="Created" value={goal.createdAt.toLocaleDateString()} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>Streak Calendar</Text>
          <StreakCalendar challengeId={goal.id} />
        </Card>

        {active ? (
          <View style={styles.actions}>
            <Button title="Mark Complete" size="lg" onPress={() => void markComplete()} />
            <Button title="Mark Missed" size="lg" variant="secondary" onPress={() => void markMissed()} />
          </View>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.completedText}>
              {goal.status === "completed" ? "Completed" : "Closed"} {goal.completedAt ? goal.completedAt.toLocaleString() : ""}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function getGoalProgress(goal: Goal): number {
  if (goal.status === "completed") return 100;
  if (goal.status === "failed") return 20;
  return Math.min(90, 20 + goal.streakWeeks * 12);
}

export default GoalDetailScreen;

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
  description: {
    color: colors.ash[300],
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginTop: spacing[2],
  },
  errorText: {
    color: colors.wine[300],
    fontSize: typography.sizes.sm,
  },
  card: {
    gap: spacing[3],
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
  },
  progressNumber: {
    color: colors.glaze[700],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  progressTrack: {
    backgroundColor: colors.ash[200],
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.glaze[600],
    height: "100%",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  metaItem: {
    minWidth: "45%",
  },
  metaLabel: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.ink[900],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: spacing[1],
    textTransform: "capitalize",
  },
  actions: {
    gap: spacing[3],
  },
  completedText: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
