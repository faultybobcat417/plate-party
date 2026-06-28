import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  getChallenge,
  resolveChallenge,
  type ChallengeDetail,
  type ChallengeEntryWithUser,
} from "../../api/challenges";
import { Badge, type BadgeVariant } from "../../components/primitives/Badge";
import { Button } from "../../components/primitives/Button";
import { AuthModal } from "../../components/auth/AuthModal";
import type { PartyStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "ChallengeDetail">;

export function ChallengeDetailScreen({ navigation, route }: Props) {
  const { challengeId } = route.params;
  const { userId, isAnonymous } = useCurrentUser();
  const [detail, setDetail] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [winnerPickerOpen, setWinnerPickerOpen] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [winnerUserId, setWinnerUserId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const next = await getChallenge(challengeId);
    setDetail(next);
  }, [challengeId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load()
      .catch((caught) => {
        if (alive) setError(getMessage(caught, "Failed to load challenge."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (caught) {
      setError(getMessage(caught, "Failed to refresh challenge."));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const optionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of detail?.entries ?? []) {
      if (entry.chosenOption) {
        counts.set(entry.chosenOption, (counts.get(entry.chosenOption) ?? 0) + 1);
      }
    }
    return counts;
  }, [detail?.entries]);

  const userEntry = useMemo(
    () => detail?.entries.find((entry) => entry.userId === userId) ?? null,
    [detail?.entries, userId],
  );

  const isCreator = Boolean(detail && userId && detail.creatorId === userId);
  const hasEntered = Boolean(userEntry);
  const canEnter = Boolean(detail && detail.status === "open" && !hasEntered);
  const canPlay = Boolean(
    detail
      && detail.status === "open"
      && detail.oracleType === "game_score"
      && hasEntered
      && !userEntry?.gameSessionId,
  );
  const canResolve = Boolean(detail && detail.status === "open" && detail.oracleType === "manual" && isCreator);

  const shareChallenge = useCallback(async () => {
    if (!detail) return;
    try {
      await Share.share({
        message: `I'm betting on "${detail.title}" in Plate Party. Join me: plateparty://challenge/${detail.id}`,
      });
    } catch (caught) {
      Alert.alert("Share failed", getMessage(caught, "Could not share this challenge."));
    }
  }, [detail]);

  const enterChallenge = useCallback(() => {
    if (!detail) return;
    if (!userId || isAnonymous) {
      setAuthVisible(true);
      return;
    }
    navigation.navigate("PlaceBet", { challengeId: detail.id });
  }, [detail, isAnonymous, navigation, userId]);

  const openWinnerPicker = useCallback(() => {
    const firstEntry = detail?.entries[0];
    setWinnerUserId(firstEntry?.userId ?? null);
    setWinnerPickerOpen(true);
  }, [detail?.entries]);

  const confirmResolution = useCallback(async () => {
    if (!detail || !winnerUserId) return;
    setResolving(true);
    try {
      await resolveChallenge(detail.id, winnerUserId);
      setWinnerPickerOpen(false);
      await refresh();
      navigation.navigate("ResultsScreen", { challengeId: detail.id });
    } catch (caught) {
      Alert.alert("Could not resolve challenge", getMessage(caught, "Please try again."));
    } finally {
      setResolving(false);
    }
  }, [detail, navigation, refresh, winnerUserId]);

  const renderEntry = useCallback<ListRenderItem<ChallengeEntryWithUser>>(
    ({ item }) => (
      <EntryRow
        entry={item}
        optionLabel={detail?.options.find((option) => option.id === item.chosenOption)?.label ?? "No option"}
      />
    ),
    [detail?.options],
  );

  if (loading && !detail) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.glaze[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Challenge not found</Text>
          <Text style={styles.emptyText}>{error ?? "This challenge may have been removed."}</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const totalPot = detail.totalPot || detail.entries.reduce((sum, entry) => sum + entry.stakeAmount, 0);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={detail.entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No entries yet.</Text>}
        ListHeaderComponent={(
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{detail.title}</Text>
                <View style={styles.creatorRow}>
                  <Avatar name={detail.creator.displayName} />
                  <Text style={styles.creatorText}>
                    {detail.creator.displayName}
                    {detail.creator.username ? ` @${detail.creator.username}` : ""}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Share challenge"
                accessibilityRole="button"
                onPress={() => void shareChallenge()}
                style={styles.iconButton}
              >
                <Text style={styles.iconButtonText}>Share</Text>
              </Pressable>
            </View>

            {detail.description ? <Text style={styles.description}>{detail.description}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.badgeRow}>
              <Badge label={detail.status.toUpperCase()} variant={statusVariant(detail.status)} />
              <Badge label={(detail.category ?? "trivia").toUpperCase()} variant="info" />
              <Badge label={detail.oracleType.replace("_", " ").toUpperCase()} variant="default" />
            </View>

            <View style={styles.statsGrid}>
              <Stat label="Stake" value={`${detail.stakeAmount}`} tone="gold" />
              <Stat label="Total Pot" value={`${totalPot}`} tone="gold" />
              <Stat label="Entries" value={`${detail.entries.length}`} />
              <Stat label="Remaining" value={formatRemaining(detail.expiresAt)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Options</Text>
              {detail.options.length === 0 ? (
                <Text style={styles.emptyText}>No options are available.</Text>
              ) : (
                <View style={styles.optionsList}>
                  {detail.options.map((option) => {
                    const selected = selectedOptionId === option.id || userEntry?.chosenOption === option.id;
                    const shouldRevealCounts = hasEntered || detail.status === "completed";
                    return (
                      <Pressable
                        accessibilityLabel={`Option ${option.label}`}
                        accessibilityRole="button"
                        disabled={hasEntered || detail.status !== "open"}
                        key={option.id}
                        onPress={() => setSelectedOptionId(option.id)}
                        style={[styles.optionCard, selected ? styles.optionCardSelected : null]}
                      >
                        <View style={[styles.radio, selected ? styles.radioSelected : null]}>
                          {selected ? <View style={styles.radioDot} /> : null}
                        </View>
                        <View style={styles.optionCopy}>
                          <Text style={styles.optionLabel}>{option.label}</Text>
                          {shouldRevealCounts ? (
                            <Text style={styles.optionMeta}>{optionCounts.get(option.id) ?? 0} votes</Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.actions}>
              {canEnter ? (
                <Button
                  title="Enter Challenge"
                  size="lg"
                  onPress={enterChallenge}
                />
              ) : null}
              {canPlay ? (
                <Button
                  title="Play Game"
                  size="lg"
                  onPress={() => navigation.navigate("GameScreen", { challengeId: detail.id })}
                />
              ) : null}
              {canResolve ? (
                <Button
                  title="Resolve Challenge"
                  variant="secondary"
                  size="lg"
                  disabled={detail.entries.length === 0}
                  onPress={openWinnerPicker}
                />
              ) : null}
              {detail.status === "completed" ? (
                <Button
                  title="View Results"
                  size="lg"
                  onPress={() => navigation.navigate("ResultsScreen", { challengeId: detail.id })}
                />
              ) : null}
              <Button title="Share" variant="ghost" onPress={() => void shareChallenge()} />
            </View>

            <Text style={styles.sectionTitle}>Entries</Text>
          </View>
        )}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.glaze[500]}
          />
        )}
        renderItem={renderEntry}
      />

      <WinnerPickerModal
        entries={detail.entries}
        selectedUserId={winnerUserId}
        visible={winnerPickerOpen}
        resolving={resolving}
        onCancel={() => setWinnerPickerOpen(false)}
        onConfirm={() => void confirmResolution()}
        onSelect={setWinnerUserId}
      />
      <AuthModal
        visible={authVisible}
        reason="Sign in to enter challenges and wager real plates."
        onClose={() => setAuthVisible(false)}
        onSignedIn={() => setAuthVisible(false)}
      />
    </SafeAreaView>
  );
}

function EntryRow({ entry, optionLabel }: { entry: ChallengeEntryWithUser; optionLabel: string }) {
  return (
    <View style={styles.entryRow}>
      <Avatar name={entry.user.displayName} />
      <View style={styles.entryCopy}>
        <Text style={styles.entryName}>{entry.user.displayName}</Text>
        <Text style={styles.entryMeta}>{optionLabel} - {entry.stakeAmount} plates</Text>
        {entry.gameScore !== null ? <Text style={styles.entryMeta}>Score {entry.gameScore}</Text> : null}
      </View>
      <Badge label={entry.status.toUpperCase()} variant={entryStatusVariant(entry.status)} />
    </View>
  );
}

function WinnerPickerModal({
  entries,
  selectedUserId,
  visible,
  resolving,
  onCancel,
  onConfirm,
  onSelect,
}: {
  entries: ChallengeEntryWithUser[];
  selectedUserId: string | null;
  visible: boolean;
  resolving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onSelect: (userId: string) => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <Text style={styles.modalTitle}>Select Winner</Text>
          {entries.map((entry) => {
            const selected = entry.userId === selectedUserId;
            return (
              <Pressable
                accessibilityLabel={`Select ${entry.user.displayName}`}
                accessibilityRole="button"
                key={entry.id}
                onPress={() => onSelect(entry.userId)}
                style={[styles.winnerRow, selected ? styles.winnerRowSelected : null]}
              >
                <Avatar name={entry.user.displayName} />
                <View style={styles.entryCopy}>
                  <Text style={styles.entryName}>{entry.user.displayName}</Text>
                  <Text style={styles.entryMeta}>{entry.stakeAmount} plates</Text>
                </View>
              </Pressable>
            );
          })}
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onCancel} />
            <Button
              title="Confirm Resolution"
              loading={resolving}
              disabled={!selectedUserId || resolving}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gold" }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === "gold" ? styles.goldText : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{name.trim().charAt(0).toUpperCase() || "?"}</Text>
    </View>
  );
}

function statusVariant(status: string): BadgeVariant {
  if (status === "completed") return "success";
  if (status === "locked") return "warning";
  if (status === "void" || status === "expired") return "danger";
  return "info";
}

function entryStatusVariant(status: string): BadgeVariant {
  if (status === "won") return "success";
  if (status === "lost") return "danger";
  return "default";
}

function formatRemaining(value: Date | null): string {
  if (!value) return "Open";
  const diffMs = value.getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  if (hours >= 1) return `${hours}h`;
  return `${Math.max(1, Math.floor(diffMs / (60 * 1000)))}m`;
}

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default ChallengeDetailScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink[900],
    flex: 1,
  },
  center: {
    alignItems: "center",
    flex: 1,
    gap: spacing[3],
    justifyContent: "center",
    padding: spacing[5],
  },
  list: {
    padding: spacing[5],
    paddingBottom: spacing[10],
  },
  headerContent: {
    gap: spacing[4],
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    gap: spacing[3],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
  },
  creatorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  creatorText: {
    color: colors.ash[400],
    flex: 1,
    fontSize: typography.sizes.sm,
  },
  iconButton: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  iconButtonText: {
    color: colors.glaze[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  description: {
    color: colors.ash[300],
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  statCard: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing[1],
    padding: spacing[4],
  },
  statLabel: {
    color: colors.ash[400],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  goldText: {
    color: colors.gold,
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  optionsList: {
    gap: spacing[3],
  },
  optionCard: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[4],
  },
  optionCardSelected: {
    borderColor: colors.glaze[500],
  },
  radio: {
    alignItems: "center",
    borderColor: colors.ash[500],
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  radioSelected: {
    borderColor: colors.glaze[500],
  },
  radioDot: {
    backgroundColor: colors.glaze[500],
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  optionCopy: {
    flex: 1,
    gap: spacing[1],
  },
  optionLabel: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  optionMeta: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
  actions: {
    gap: spacing[3],
  },
  entryRow: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  entryCopy: {
    flex: 1,
    gap: spacing[1],
  },
  entryName: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  entryMeta: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.glaze[700],
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  emptyText: {
    color: colors.ash[400],
    fontSize: typography.sizes.base,
    marginTop: spacing[3],
    textAlign: "center",
  },
  errorText: {
    color: colors.wine[400],
    fontSize: typography.sizes.sm,
  },
  modalBackdrop: {
    backgroundColor: colors.ink[950],
    flex: 1,
    justifyContent: "flex-end",
  },
  modalPanel: {
    backgroundColor: colors.ink[900],
    borderColor: colors.ink[700],
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[5],
  },
  modalTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  winnerRow: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[3],
  },
  winnerRowSelected: {
    borderColor: colors.glaze[500],
  },
  modalActions: {
    gap: spacing[2],
  },
});
