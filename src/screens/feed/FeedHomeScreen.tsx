import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

import { FeedTopTabs, type FeedTab } from "../../components/composite/FeedTopTabs";
import { MeatCard } from "../../components/composite/MeatCard";
import { StakeCard } from "../../components/composite/StakeCard";
import { CreateMeatPostSheet } from "../../components/composite/CreateMeatPostSheet";
import { CreateStakePostSheet } from "../../components/composite/CreateStakePostSheet";

import { CreateChallengeButton } from "../../components/composite/CreateChallengeButton";
import { ChallengeCard } from "../../components/composite/ChallengeCard";
import { SortDropdown } from "../../components/composite/SortDropdown";
import { ProofSubmissionSheet } from "../../components/composite/ProofSubmissionSheet";

import { SteakFeedList } from "../../components/feed/SteakFeedList";

import { useChallengeStore } from "../../stores/useChallengeStore";
import { useMeatStore } from "../../stores/useMeatStore";
import { useStakeStore } from "../../stores/useStakeStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useTutorialCheck } from "../../hooks/useTutorialCheck";
import { FreePlateButton } from "../../components/tutorial/FreePlateButton";
import { TutorialSheet } from "../../components/tutorial/TutorialSheet";

import type { FeedStackParamList } from "../../navigation/types";
import type { Challenge } from "../../api/challenge";
import type { MeatPost } from "../../api/meat";
import type { StakePost } from "../../api/stake";

type FeedNav = NativeStackNavigationProp<FeedStackParamList>;

type EmptyProps = {
  emoji: string;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
};

function ListEmpty({ emoji, title, message, ctaLabel, onCta }: EmptyProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {ctaLabel && onCta ? (
        <Pressable onPress={onCta} style={styles.emptyButton} accessibilityRole="button">
          <Text style={styles.emptyButtonText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>⚠️</Text>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptyText}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.emptyButton} accessibilityRole="button" accessibilityLabel="Retry">
        <Text style={styles.emptyButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

// ─── My Feed Tab Content ───────────────────────────────────────────────
function MyFeedTabContent({
  navigation,
}: {
  navigation: FeedNav;
}) {
  const {
    sortedChallenges,
    isLoading,
    error,
    sortBy,
    pendingProofs,
    loadChallenges,
    setSort,
    submitProof,
    clearError,
  } = useChallengeStore();

  const [proofSheetOpen, setProofSheetOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    if (sortedChallenges.length === 0) {
      loadChallenges();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  const handleRefresh = useCallback(() => {
    clearError();
    loadChallenges();
  }, [loadChallenges, clearError]);

  const handleSubmitProof = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setProofSheetOpen(true);
  };

  const handleProofSubmit = (type: "camera" | "photo" | "file" | "text", data: string) => {
    if (!selectedChallenge) return;
    void submitProof({
      challengeId: selectedChallenge.id,
      submitterId: "user-1",
      proofType: type,
    });
  };

  return (
    <View style={styles.tabContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feed</Text>
          <Text style={styles.subtitle}>Challenges, bounties, proof.</Text>
        </View>
        <SortDropdown selected={sortBy} onSelect={setSort} />
      </View>

      <CreateChallengeButton onPress={() => navigation.navigate("CreateChallenge")} />

      {error && !isLoading ? (
        <ErrorRetry message={error} onRetry={handleRefresh} />
      ) : null}

      <FlatList
        data={sortedChallenges}
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
          !isLoading && !error ? (
            <ListEmpty
              emoji="📭"
              title="No challenges yet"
              message="Start a challenge and get the party moving."
              ctaLabel="Create First Challenge"
              onCta={() => navigation.navigate("CreateChallenge")}
            />
          ) : null
        }
      />

      <ProofSubmissionSheet
        visible={proofSheetOpen}
        onClose={() => setProofSheetOpen(false)}
        onSubmit={handleProofSubmit}
        challengeTitle={selectedChallenge?.title ?? ""}
      />
    </View>
  );
}

// ─── Meat Tab Content ──────────────────────────────────────────────────
function MeatTabContent() {
  const { posts, isLoading, error, loadPosts, interact, clearError } = useMeatStore();
  const [createVisible, setCreateVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useCurrentUser();

  const onRefresh = useCallback(() => {
    clearError();
    loadPosts();
  }, [loadPosts, clearError]);

  useEffect(() => {
    if (posts.length === 0) {
      loadPosts();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handlePayToInteract = async (post: MeatPost, type: "like" | "comment" | "dm") => {
    const plates = type === "like" ? 1 : type === "comment" ? 5 : post.plateCost;
    try {
      await interact({
        postId: post.id,
        userId: (currentUser.userId ?? ""),
        interactionType: type,
        platesPaid: plates,
      });
    } catch {
      // Error is already in store; list shows retry if needed.
    }
  };

  const handleCreate = async (input: {
    caption: string;
    bioSnippet: string;
    plateCost: number;
  }) => {
    setSubmitting(true);
    try {
      await useMeatStore.getState().addPost({
        creatorId: (currentUser.userId ?? ""),
        creatorName: (currentUser.userId?.slice(0, 8) || "You"),
        creatorAvatar: undefined,
        ...input,
      });
      setCreateVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.tabContainer}>
      {error && !isLoading ? (
        <ErrorRetry message={error} onRetry={onRefresh} />
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.glaze[600]} />
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <ListEmpty
              emoji="🥩"
              title="No meat posts yet"
              message="Be the first to drop a post."
              ctaLabel="Post Something"
              onCta={() => setCreateVisible(true)}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <MeatCard
            post={item}
            onPayToInteract={(type) => void handlePayToInteract(item, type)}
          />
        )}
        contentContainerStyle={styles.list}
      />
      <Pressable
        style={styles.fab}
        onPress={() => setCreateVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Create meat post"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <CreateMeatPostSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
        isLoading={submitting}
      />
    </View>
  );
}

// ─── Stake Tab Content ─────────────────────────────────────────────────
function StakeTabContent() {
  const { posts, isLoading, error, loadPosts, stake, clearError } = useStakeStore();
  const [createVisible, setCreateVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useCurrentUser();

  const onRefresh = useCallback(() => {
    clearError();
    loadPosts();
  }, [loadPosts, clearError]);

  useEffect(() => {
    if (posts.length === 0) {
      loadPosts();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleStake = async (post: StakePost, optionIndex: number) => {
    try {
      await stake({
        postId: post.id,
        userId: (currentUser.userId ?? ""),
        optionIndex,
        platesStaked: 10,
      });
    } catch {
      // Error surfaced via store error state.
    }
  };

  const handleCreate = async (input: {
    content: string;
    targetPlates: number;
    deadline: string;
    options: { label: string; staked: number }[];
  }) => {
    setSubmitting(true);
    try {
      await useStakeStore.getState().addPost({
        creatorId: (currentUser.userId ?? ""),
        creatorName: (currentUser.userId?.slice(0, 8) || "You"),
        creatorAvatar: undefined,
        ...input,
      });
      setCreateVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Show demo feed when no real posts exist
  const showDemoFeed = !isLoading && !error && posts.length === 0;

  return (
    <View style={styles.tabContainer}>
      {error && !isLoading ? (
        <ErrorRetry message={error} onRetry={onRefresh} />
      ) : null}

      {showDemoFeed ? (
        <SteakFeedList />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.glaze[600]} />
          }
          ListEmptyComponent={
            !isLoading && !error ? (
              <ListEmpty
                emoji="🥩"
                title="No stakes on the table"
                message="Start a stake and let people vote with plates."
                ctaLabel="Start a Stake"
                onCta={() => setCreateVisible(true)}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <StakeCard
              post={item}
              onStake={(index) => void handleStake(item, index)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => setCreateVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Create stake"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <CreateStakePostSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
        isLoading={submitting}
      />
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────
export function FeedHomeScreen() {
  const [activeTab, setActiveTab] = useState<FeedTab>("stake");
  const navigation = useNavigation<FeedNav>();
  const [sheetVisible, setSheetVisible] = useState(false);
  const { hasAnyPending } = useTutorialCheck("feed");

  const renderTabContent = () => {
    switch (activeTab) {
      case "stake":
        return <StakeTabContent />;
      case "myFeed":
        return <MyFeedTabContent navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FeedTopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}

      <FreePlateButton
        tab="feed"
        onPress={() => setSheetVisible(true)}
      />

      <TutorialSheet
        visible={sheetVisible}
        tab="feed"
        onClose={() => setSheetVisible(false)}
        onNavigate={(stepId) => {
          if (stepId === "feed_create_stake") {
            // Already on feed, the FAB handles stake creation
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.linen[100],
  },
  tabContainer: {
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
    paddingHorizontal: spacing[6],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
    textAlign: "center",
  },
  emptyText: {
    color: colors.ash[500],
    fontSize: typography.sizes.base,
    marginBottom: spacing[4],
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: colors.glaze[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  emptyButtonText: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  fab: {
    position: "absolute",
    right: spacing[4],
    bottom: spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glaze[600],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.ink[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: colors.linen[50],
    fontWeight: typography.weights.bold,
  },
});
