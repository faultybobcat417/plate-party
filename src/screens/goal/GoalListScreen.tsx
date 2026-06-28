import { useCallback } from "react";
import {
  ActivityIndicator,
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

import { EmptyState } from "../../components/composite/EmptyState";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { StreakFlame } from "../../components/streak/StreakFlame";
import type { FeedStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGoalStore } from "../../stores/useGoalStore";
import type { Goal } from "../../db/schema";
import { colors, spacing, typography } from "../../theme";

type GoalNav = NativeStackNavigationProp<FeedStackParamList>;

export function GoalListScreen() {
  const navigation = useNavigation<GoalNav>();
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>GROW</Text>
          <Text style={styles.title}>My Goals</Text>
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
          <GoalListCard
            goal={item}
            onPress={() => navigation.navigate("GoalDetail", { goalId: item.id })}
            onComplete={() => void completeGoal(item.id)}
            onFail={() => void failGoal(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.glaze[500]} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.glaze[500]} />
          ) : (
            <EmptyState
              icon="🌱"
              title="No goals yet"
              message="Create a personal goal, add an optional self-stake, and keep your streak alive."
              actionLabel="Create Goal"
              onAction={() => navigation.navigate("CreateGoal")}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function GoalListCard({
  goal,
  onPress,
  onComplete,
  onFail,
}: {
  goal: Goal;
  onPress: () => void;
  onComplete: () => void;
  onFail: () => void;
}) {
  const progress = getGoalProgress(goal);
  const isActive = goal.status === "active";

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleBlock}>
            <Text style={styles.cardTitle}>{goal.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>{goal.description || "No description"}</Text>
          </View>
          <StreakFlame streak={goal.streakWeeks} />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{goal.status}</Text>
          <Text style={styles.metaText}>{goal.stakeAmount} plates</Text>
          <Text style={styles.metaText}>{goal.deadline ? goal.deadline.toLocaleDateString() : "No deadline"}</Text>
        </View>

        {isActive ? (
          <View style={styles.actions}>
            <Button title="Complete" size="sm" onPress={onComplete} />
            <Button title="Missed" size="sm" variant="secondary" onPress={onFail} />
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

function getGoalProgress(goal: Goal): number {
  if (goal.status === "completed") return 100;
  if (goal.status === "failed") return 20;
  return Math.min(90, 20 + goal.streakWeeks * 12);
}

export default GoalListScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing[4],
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
  errorBanner: {
    alignItems: "center",
    backgroundColor: colors.wine[900],
    borderColor: colors.wine[500],
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    padding: spacing[3],
  },
  errorText: {
    color: colors.white,
    flex: 1,
    fontSize: typography.sizes.sm,
  },
  list: {
    flexGrow: 1,
    paddingBottom: spacing[8],
  },
  card: {
    gap: spacing[3],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
  },
  cardTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  cardDescription: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  metaText: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    textTransform: "capitalize",
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
