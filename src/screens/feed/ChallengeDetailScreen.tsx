import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Badge } from "../../components/primitives/Badge";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { EmptyState } from "../../components/composite/EmptyState";
import type { FeedStackParamList } from "../../navigation/types";
import { useChallengeStore } from "../../stores/useChallengeStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<FeedStackParamList, "ChallengeDetail">;

const typeLabel = (type: string): string => {
  switch (type) {
    case "self":
      return "Self Challenge";
    case "bounty":
      return "Bounty";
    case "group":
      return "Group Challenge";
    default:
      return "Challenge";
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case "open":
      return "Open";
    case "claimed":
      return "Claimed";
    case "completed":
      return "Completed";
    case "expired":
      return "Expired";
    default:
      return status;
  }
};

export function ChallengeDetailScreen({ route, navigation }: Props) {
  const { challengeId } = route.params;
  const challenges = useChallengeStore((state) => state.challenges);
  const [challenge, setChallenge] = useState<(typeof challenges)[0] | null>(null);

  useEffect(() => {
    const found = challenges.find((c) => c.id === challengeId);
    if (found) {
      setChallenge(found);
    }
  }, [challenges, challengeId]);

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <EmptyState
          icon="🔍"
          title="Challenge not found"
          message="This challenge may have been deleted."
        />
      </SafeAreaView>
    );
  }

  const isOpen = challenge.status === "open";
  const isClaimed = challenge.status === "claimed";
  const isCompleted = challenge.status === "completed";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Badge label={typeLabel(challenge.type)} variant="info" />
          <Badge label={statusLabel(challenge.status)} variant={isCompleted ? "success" : isClaimed ? "warning" : "default"} />
        </View>

        <Text style={styles.title}>{challenge.title}</Text>
        
        {challenge.description ? (
          <Text style={styles.description}>{challenge.description}</Text>
        ) : null}

        <Card variant="elevated" padding={5} style={styles.rewardCard}>
          <Text style={styles.rewardLabel}>Reward</Text>
          <Text style={styles.rewardAmount}>🍽 {challenge.rewardPlates} plates</Text>
        </Card>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Deadline: {new Date(challenge.deadline).toLocaleDateString()}
          </Text>
          <Text style={styles.metaText}>
            Created: {new Date(challenge.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {isCompleted && challenge.proofNote ? (
          <Card variant="default" padding={4} style={styles.proofCard}>
            <Text style={styles.proofLabel}>Proof</Text>
            <Text style={styles.proofText}>{challenge.proofNote}</Text>
          </Card>
        ) : null}

        {isOpen ? (
          <View style={styles.actions}>
            <Button
              title="Claim Challenge"
              onPress={() => {
                // TODO: implement claim
                navigation.goBack();
              }}
            />
          </View>
        ) : null}

        {isClaimed ? (
          <View style={styles.actions}>
            <Button
              title="Complete & Submit Proof"
              onPress={() => {
                // TODO: implement complete
                navigation.goBack();
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  scroll: {
    padding: spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[3],
  },
  description: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginBottom: spacing[4],
  },
  rewardCard: {
    alignItems: "center",
    marginBottom: spacing[6],
    backgroundColor: colors.glaze[50],
  },
  rewardLabel: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[2],
  },
  rewardAmount: {
    color: colors.glaze[700],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  meta: {
    marginBottom: spacing[6],
  },
  metaText: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
  },
  proofCard: {
    marginBottom: spacing[6],
    backgroundColor: colors.glaze[50],
  },
  proofLabel: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  proofText: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
  },
  actions: {
    marginTop: spacing[2],
  },
});
