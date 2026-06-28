import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { findUserByUsername } from "../../api/user";
import type { GameType } from "../../api/game";
import { OnlineUsersHeader } from "../../components/play/OnlineUsersHeader";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Input } from "../../components/primitives/Input";
import { NumericStepper } from "../../components/primitives/NumericStepper";
import { AuthModal } from "../../components/auth/AuthModal";
import type { PlayStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGameStore } from "../../stores/useGameStore";
import { useOnlineStore } from "../../stores/useOnlineStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PlayStackParamList, "PlayHome">;
type MatchMode = "random" | "invite";

type GameCard = {
  id: GameType;
  title: string;
  description: string;
  rules: string;
  accent: string;
};

const GAMES: GameCard[] = [
  {
    id: "rps",
    title: "Rock Paper Scissors",
    description: "Lock a move before the 30s timer expires.",
    rules: "Best server-resolved move wins the wager.",
    accent: "RPS",
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description: "Standard 3x3 rules with server-ordered turns.",
    rules: "Three in a row wins. Full board is a refund tie.",
    accent: "3x3",
  },
  {
    id: "word-guess",
    title: "Word Guess",
    description: "Five-letter word, six attempts.",
    rules: "Fewest attempts wins. Same result is a tie.",
    accent: "5L",
  },
  {
    id: "quick-math",
    title: "Quick Math",
    description: "Ten arithmetic problems at speed.",
    rules: "Highest score wins; time breaks ties.",
    accent: "10",
  },
  {
    id: "memory",
    title: "Memory",
    description: "Match the board in as few moves as possible.",
    rules: "Fewest moves wins; same moves refunds both players.",
    accent: "MEM",
  },
  {
    id: "questions",
    title: "Questions",
    description: "Five trivia questions, highest score wins.",
    rules: "Score first, time second, then tie refund.",
    accent: "Q5",
  },
];

export function PlayHomeScreen({ navigation }: Props) {
  const { userId, isAnonymous } = useCurrentUser();
  const { sessions, isLoading, error, createSession, fetchSessions, clearError } = useGameStore();
  const { getRandomOpponent, onlineCount, status } = useOnlineStore();

  const [selectedGame, setSelectedGame] = useState<GameCard | null>(null);
  const [matchMode, setMatchMode] = useState<MatchMode>("random");
  const [username, setUsername] = useState("");
  const [wagerAmount, setWagerAmount] = useState(5);
  const [confirmed, setConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);

  useEffect(() => {
    if (!userId || isAnonymous) {
      clearError();
      return;
    }
    void fetchSessions(userId ?? undefined);
  }, [clearError, fetchSessions, isAnonymous, userId]);

  const completedSessions = useMemo(
    () => isAnonymous ? [] : sessions.filter((session) => session.status === "completed" || Boolean(session.completedAt)),
    [isAnonymous, sessions],
  );

  const refresh = useCallback(() => {
    clearError();
    if (!userId || isAnonymous) return;
    void fetchSessions(userId ?? undefined);
  }, [clearError, fetchSessions, isAnonymous, userId]);

  const closeSheet = () => {
    setSelectedGame(null);
    setUsername("");
    setConfirmed(false);
    setMatchMode("random");
  };

  const startGame = async () => {
    if (!selectedGame) return;
    if (!userId || isAnonymous) {
      setAuthVisible(true);
      return;
    }
    if (!confirmed) {
      Alert.alert("Confirm stake", "Confirm the equal plate stake before starting.");
      return;
    }

    setStarting(true);
    try {
      const opponentId = await resolveOpponentId(matchMode, username, userId, getRandomOpponent);
      const session = await createSession({
        opponentId,
        gameType: selectedGame.id,
        wagerAmount,
      });
      closeSheet();
      navigation.navigate("GameScreen", { gameId: selectedGame.id, sessionId: session.id });
    } catch (caught) {
      Alert.alert("Could not start game", caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const playForFun = () => {
    if (!selectedGame) return;
    const gameId = selectedGame.id;
    closeSheet();
    navigation.navigate("GameScreen", { gameId });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PLAY</Text>
          <Text style={styles.title}>Games for Plates</Text>
          <Text style={styles.subtitle}>Choose a game, confirm the wager, and let the server settle it.</Text>
        </View>
        <OnlineUsersHeader />
      </View>

      {error && !isAnonymous ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" size="sm" variant="secondary" onPress={refresh} />
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{onlineCount}</Text>
          <Text style={styles.statLabel}>{status === "online" ? "Online" : "Presence"}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{completedSessions.length}</Text>
          <Text style={styles.statLabel}>Games logged</Text>
        </Card>
        <Button title="History" size="sm" variant="secondary" onPress={() => navigation.navigate("GameHistory")} />
      </View>

      <FlatList
        data={GAMES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gameRow}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.glaze[600]} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play ${item.title}`}
            onPress={() => setSelectedGame(item)}
            style={({ pressed }) => [styles.gameCard, pressed && styles.gameCardPressed]}
          >
            <Text style={styles.gameAccent}>{item.accent}</Text>
            <Text style={styles.gameTitle}>{item.title}</Text>
            <Text style={styles.gameDescription}>{item.description}</Text>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Play Now</Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={isLoading ? <ActivityIndicator color={colors.glaze[600]} /> : null}
      />

      <Modal visible={Boolean(selectedGame)} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{selectedGame?.title}</Text>
            <Text style={styles.sheetSubtitle}>{selectedGame?.rules}</Text>

            <View style={styles.modeRow}>
              <ModeButton label="Random" selected={matchMode === "random"} onPress={() => setMatchMode("random")} />
              <ModeButton label="Invite" selected={matchMode === "invite"} onPress={() => setMatchMode("invite")} />
            </View>

            {matchMode === "invite" ? (
              <Input
                label="Friend username"
                placeholder="platefriend"
                value={username}
                autoCapitalize="none"
                onChangeText={setUsername}
              />
            ) : (
              <Text style={styles.helper}>Random matchmaking uses currently online players from Realtime presence.</Text>
            )}

            <View style={styles.stakeRow}>
              <View style={styles.stakeCopy}>
                <Text style={styles.label}>Equal Plate Stake</Text>
                <Text style={styles.helper}>Both players wager the same amount. The Edge Function escrows plates before play.</Text>
              </View>
              <NumericStepper value={wagerAmount} onChange={setWagerAmount} min={1} max={1000} step={1} />
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmed }}
              onPress={() => setConfirmed((value) => !value)}
              style={[styles.confirmBox, confirmed && styles.confirmBoxSelected]}
            >
              <Text style={[styles.confirmText, confirmed && styles.confirmTextSelected]}>
                I confirm a {wagerAmount}-plate stake for both players.
              </Text>
            </Pressable>

            <View style={styles.sheetActions}>
              <Button title="Start Match" loading={starting} onPress={() => void startGame()} />
              <Button title="Play for Fun" variant="secondary" onPress={playForFun} />
              <Button title="Cancel" variant="ghost" onPress={closeSheet} />
            </View>
          </View>
        </View>
      </Modal>
      <AuthModal
        visible={authVisible}
        reason="Sign in to wager plates. You can still play for fun as a guest."
        onClose={() => setAuthVisible(false)}
        onSignedIn={() => setAuthVisible(false)}
      />
    </SafeAreaView>
  );
}

function ModeButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeButton, selected && styles.modeButtonSelected]}>
      <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{label}</Text>
    </Pressable>
  );
}

async function resolveOpponentId(
  mode: MatchMode,
  username: string,
  currentUserId: string,
  getRandomOpponent: (currentUserId?: string | null) => { userId: string } | null,
): Promise<string> {
  if (mode === "random") {
    const opponent = getRandomOpponent(currentUserId);
    if (!opponent) throw new Error("No online opponent is available. Invite a friend by username instead.");
    return opponent.userId;
  }

  const trimmedUsername = username.trim();
  if (!trimmedUsername) throw new Error("Enter a friend username.");
  const opponent = await findUserByUsername(trimmedUsername);
  if (!opponent) throw new Error("No user found with that username.");
  if (opponent.id === currentUserId) throw new Error("Choose someone other than yourself.");
  return opponent.id;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  header: {
    padding: spacing[4],
    gap: spacing[3],
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
  subtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
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
  statsRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  statCard: {
    flex: 1,
    gap: spacing[1],
  },
  statValue: {
    color: colors.glaze[700],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.ash[600],
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  gameRow: {
    gap: spacing[3],
  },
  gameCard: {
    backgroundColor: colors.neutral[950],
    borderColor: colors.neutral[800],
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: spacing[2],
    marginBottom: spacing[3],
    minHeight: 184,
    padding: spacing[4],
  },
  gameCardPressed: {
    opacity: 0.82,
  },
  gameAccent: {
    color: colors.glaze[500],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  gameTitle: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    lineHeight: 22,
  },
  gameDescription: {
    color: colors.ash[400],
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: colors.glaze[600],
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  ctaText: {
    color: colors.black,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  overlay: {
    backgroundColor: colors.ink[950],
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.neutral[950],
    borderColor: colors.neutral[800],
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    gap: spacing[4],
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  sheetTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  sheetSubtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
  modeRow: {
    backgroundColor: colors.neutral[900],
    borderRadius: 12,
    flexDirection: "row",
    padding: 2,
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    paddingVertical: spacing[2],
  },
  modeButtonSelected: {
    backgroundColor: colors.glaze[600],
  },
  modeText: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  modeTextSelected: {
    color: colors.black,
  },
  helper: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  stakeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  stakeCopy: {
    flex: 1,
  },
  label: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  confirmBox: {
    borderColor: colors.neutral[700],
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing[3],
  },
  confirmBoxSelected: {
    backgroundColor: colors.glaze[100],
    borderColor: colors.glaze[600],
  },
  confirmText: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  confirmTextSelected: {
    color: colors.glaze[900],
  },
  sheetActions: {
    gap: spacing[2],
  },
});
