import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { CreateChallengeButton } from "../../components/composite/CreateChallengeButton";
import { ChallengeCard } from "../../components/composite/ChallengeCard";
import { SortDropdown } from "../../components/composite/SortDropdown";
import { ProofSubmissionSheet } from "../../components/composite/ProofSubmissionSheet";
import { useChallengeStore } from "../../stores/useChallengeStore";
import type { FeedStackParamList } from "../../navigation/types";
import type { Challenge } from "../../api/challenge";

type FeedNav = NativeStackNavigationProp<FeedStackParamList>;

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "mock-1",
    title: "Gym 5 times this week",
    description: "Post a gym selfie each day. 5 days, 5 posts.",
    type: "self",
    rewardPlates: 50,
    deadline: "2026-06-26T23:59:59Z",
    status: "open",
    creatorId: "user-1",
    completerId: null,
    proofImageUrl: null,
    proofNote: null,
    claimedAt: null,
    completedAt: null,
    createdAt: "2026-06-19T10:00:00Z",
    updatedAt: "2026-06-19T10:00:00Z",
    deletedAt: null,
    hlc: "mock-hlc-1",
    lastModifiedByDeviceId: null,
  },
  {
    id: "mock-2",
    title: "First to run a 5K",
    description: "Screenshot your running app. First valid entry wins!",
    type: "bounty",
    rewardPlates: 100,
    deadline: "2026-06-22T23:59:59Z",
    status: "claimed",
    creatorId: "user-2",
    completerId: "user-3",
    proofImageUrl: null,
    proofNote: "Nike Run Club — 5.2km in 28:45",
    claimedAt: "2026-06-19T08:00:00Z",
    completedAt: null,
    createdAt: "2026-06-18T10:00:00Z",
    updatedAt: "2026-06-19T08:00:00Z",
    deletedAt: null,
    hlc: "mock-hlc-2",
    lastModifiedByDeviceId: null,
  },
  {
    id: "mock-3",
    title: "No soda for 7 days",
    description: "Everyone who completes this gets 25 plates. Hydrate!",
    type: "group",
    rewardPlates: 25,
    deadline: "2026-06-25T23:59:59Z",
    status: "open",
    creatorId: "user-1",
    completerId: null,
    proofImageUrl: null,
    proofNote: null,
    claimedAt: null,
    completedAt: null,
    createdAt: "2026-06-19T09:00:00Z",
    updatedAt: "2026-06-19T09:00:00Z",
    deletedAt: null,
    hlc: "mock-hlc-3",
    lastModifiedByDeviceId: null,
  },
  {
    id: "mock-4",
    title: "Read 100 pages in a day",
    description: "Post a photo of your book + page count",
    type: "self",
    rewardPlates: 30,
    deadline: "2026-06-20T23:59:59Z",
    status: "open",
    creatorId: "user-4",
    completerId: null,
    proofImageUrl: null,
    proofNote: null,
    claimedAt: null,
    completedAt: null,
    createdAt: "2026-06-19T11:00:00Z",
    updatedAt: "2026-06-19T11:00:00Z",
    deletedAt: null,
    hlc: "mock-hlc-4",
    lastModifiedByDeviceId: null,
  },
];

export function FeedHomeScreen() {
  const navigation = useNavigation<FeedNav>();
  const {
    sortedChallenges,
    isLoading,
    sortBy,
    pendingProofs,
    loadChallenges,
    setSort,
    submitProof,
  } = useChallengeStore();

  const [proofSheetOpen, setProofSheetOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    // Load mock data on mount
    if (sortedChallenges.length === 0) {
      loadChallenges();
    }
  }, []);

  const handleRefresh = useCallback(() => {
    loadChallenges();
  }, [loadChallenges]);

  const handleSubmitProof = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setProofSheetOpen(true);
  };

  const handleProofSubmit = (type: "camera" | "photo" | "file" | "text", data: string) => {
    if (!selectedChallenge) return;
    submitProof({
      challengeId: selectedChallenge.id,
      submitterId: "user-1", // TODO: real user
      proofType: type,
      proofData: data,
    });
  };

  const displayChallenges = sortedChallenges.length > 0 ? sortedChallenges : MOCK_CHALLENGES;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feed</Text>
          <Text style={styles.subtitle}>Challenges, bounties, proof.</Text>
        </View>
        <SortDropdown selected={sortBy} onSelect={setSort} />
      </View>

      <CreateChallengeButton onPress={() => navigation.navigate("CreateChallenge")} />

      <FlatList
        data={displayChallenges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChallengeCard
            challenge={item}
            pendingProofs={pendingProofs.get(item.id)}
            onPress={() => navigation.navigate("ChallengeDetail", { challengeId: item.id })}
            onSubmitProof={() => handleSubmitProof(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.glaze[600]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No challenges yet</Text>
              <Pressable onPress={() => navigation.navigate("CreateChallenge")} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Create First Challenge</Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      <ProofSubmissionSheet
        visible={proofSheetOpen}
        onClose={() => setProofSheetOpen(false)}
        onSubmit={handleProofSubmit}
        challengeTitle={selectedChallenge?.title ?? ""}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  list: {
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  empty: {
    alignItems: "center",
    paddingTop: spacing[10],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyText: {
    color: colors.ash[500],
    fontSize: typography.sizes.base,
    marginBottom: spacing[4],
  },
  emptyButton: {
    backgroundColor: colors.glaze[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 10,
  },
  emptyButtonText: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
});
