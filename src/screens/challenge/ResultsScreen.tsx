import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  getChallengeResults,
  resolveByGameScore,
  resolveChallenge,
  type ChallengeEntryWithUser,
  type ChallengeResults,
} from "../../api/challenges";
import { Badge } from "../../components/primitives/Badge";
import { Button } from "../../components/primitives/Button";
import type { PartyStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "ResultsScreen">;

export function ResultsScreen({ navigation, route }: Props) {
  const { challengeId } = route.params;
  const { userId } = useCurrentUser();
  const [results, setResults] = useState<ChallengeResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const next = await getChallengeResults(challengeId);
    setResults(next);
    setSelectedWinnerId((previous) => previous ?? next.entries[0]?.userId ?? null);
  }, [challengeId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load()
      .catch((caught) => {
        if (alive) setError(getMessage(caught, "Failed to load results."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    if (!results || results.challenge.status !== "open" || results.challenge.oracleType !== "game_score" || resolving) {
      return;
    }

    setResolving(true);
    resolveByGameScore(results.challenge.id)
      .then(load)
      .catch((caught) => setError(getMessage(caught, "Automatic resolution failed.")))
      .finally(() => setResolving(false));
  }, [load, resolving, results]);

  const totalPot = results
    ? results.challenge.totalPot || results.entries.reduce((sum, entry) => sum + entry.stakeAmount, 0)
    : 0;
  const charityAmount = results?.challenge.charityAmount || Math.floor(totalPot * 0.1);
  const winnerGets = Math.max(0, totalPot - charityAmount);
  const winnerEntry = useMemo(() => {
    if (!results?.winner) return null;
    return results.entries.find((entry) => entry.userId === results.winner?.id) ?? null;
  }, [results]);

  const confirmManualResolution = useCallback(async () => {
    if (!results || !selectedWinnerId) return;
    setResolving(true);
    try {
      await resolveChallenge(results.challenge.id, selectedWinnerId);
      await load();
    } catch (caught) {
      Alert.alert("Could not resolve challenge", getMessage(caught, "Please try again."));
    } finally {
      setResolving(false);
    }
  }, [load, results, selectedWinnerId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.glaze[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!results) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.center}>
          <Text style={styles.title}>Results</Text>
          <Text style={styles.errorText}>{error ?? "Results are not available."}</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const manualNeedsResolution = results.challenge.status === "open" && results.challenge.oracleType === "manual";
  const autoResolving = results.challenge.status === "open" && results.challenge.oracleType === "game_score";
  const currentUserWon = Boolean(userId && results.winner?.id === userId);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Results</Text>
        <Text style={styles.subtitle}>{results.challenge.title}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {autoResolving ? (
          <View style={styles.panel}>
            <ActivityIndicator color={colors.glaze[500]} />
            <Text style={styles.panelText}>Resolving automatically...</Text>
          </View>
        ) : null}

        {manualNeedsResolution ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Select Winner</Text>
            {results.entries.map((entry) => (
              <WinnerOption
                entry={entry}
                key={entry.id}
                selected={entry.userId === selectedWinnerId}
                onPress={() => setSelectedWinnerId(entry.userId)}
              />
            ))}
            <Button
              title="Confirm Resolution"
              loading={resolving}
              disabled={!selectedWinnerId || resolving}
              onPress={() => void confirmManualResolution()}
            />
          </View>
        ) : null}

        {results.winner ? (
          <View style={styles.winnerCard}>
            <Avatar name={results.winner.displayName} size={72} />
            <Text style={styles.winnerName}>{results.winner.displayName}</Text>
            <Badge label={currentUserWon ? "YOU WON" : "WINNER"} variant="warning" />
            <Text style={styles.winnerPlates}>{winnerGets} plates won</Text>
            {winnerEntry?.gameScore !== null && winnerEntry?.gameScore !== undefined ? (
              <Text style={styles.panelText}>Score {winnerEntry.gameScore}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelText}>Waiting for resolution.</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <ResultStat label="Total Pot" value={`${totalPot}`} tone="gold" />
          <ResultStat label="Charity" value={`${charityAmount}`} tone="danger" />
          <ResultStat label="Winner Gets" value={`${winnerGets}`} tone="success" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {results.entries.map((entry) => (
            <EntryResultRow
              entry={entry}
              key={entry.id}
              winnerUserId={results.winner?.id ?? null}
              winnerGets={winnerGets}
            />
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Charity</Text>
          <Text style={styles.panelText}>
            {charityAmount} plates donated to {results.donations[0]?.charityName ?? "Plate Party Charity Fund"}.
          </Text>
          <Text style={styles.panelText}>Thank you for playing.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Back to Party"
          size="lg"
          onPress={() => {
            if (results.challenge.partyId) {
              navigation.navigate("PartyDetail", { partyId: results.challenge.partyId });
            } else {
              navigation.goBack();
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function WinnerOption({
  entry,
  selected,
  onPress,
}: {
  entry: ChallengeEntryWithUser;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Select ${entry.user.displayName}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.winnerOption, selected ? styles.winnerOptionSelected : null]}
    >
      <Avatar name={entry.user.displayName} />
      <View style={styles.entryCopy}>
        <Text style={styles.entryName}>{entry.user.displayName}</Text>
        <Text style={styles.entryMeta}>{entry.stakeAmount} plates</Text>
      </View>
    </Pressable>
  );
}

function EntryResultRow({
  entry,
  winnerUserId,
  winnerGets,
}: {
  entry: ChallengeEntryWithUser;
  winnerUserId: string | null;
  winnerGets: number;
}) {
  const won = entry.userId === winnerUserId;
  return (
    <View style={styles.entryRow}>
      <Avatar name={entry.user.displayName} />
      <View style={styles.entryCopy}>
        <Text style={styles.entryName}>{entry.user.displayName}</Text>
        <Text style={styles.entryMeta}>
          {entry.stakeAmount} plates staked{entry.gameScore !== null ? ` - score ${entry.gameScore}` : ""}
        </Text>
      </View>
      <View style={styles.entryResult}>
        <Badge label={won ? "WON" : "LOST"} variant={won ? "success" : "danger"} />
        <Text style={[styles.plateChange, won ? styles.winText : styles.lossText]}>
          {won ? `+${winnerGets}` : `-${entry.stakeAmount}`}
        </Text>
      </View>
    </View>
  );
}

function ResultStat({ label, value, tone }: { label: string; value: string; tone: "gold" | "danger" | "success" }) {
  const valueStyle = tone === "gold" ? styles.goldText : tone === "danger" ? styles.dangerText : styles.successText;
  return (
    <View style={styles.resultStat}>
      <Text style={[styles.resultValue, valueStyle]}>{value}</Text>
      <Text style={styles.resultLabel}>{label}</Text>
    </View>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={styles.avatarText}>{name.trim().charAt(0).toUpperCase() || "?"}</Text>
    </View>
  );
}

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default ResultsScreen;

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
  scroll: {
    gap: spacing[4],
    padding: spacing[5],
    paddingBottom: 132,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.base,
  },
  panel: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  panelText: {
    color: colors.ash[300],
    fontSize: typography.sizes.base,
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  winnerCard: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.gold,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[5],
  },
  winnerName: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  winnerPlates: {
    color: colors.gold,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  resultStat: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: spacing[1],
    padding: spacing[3],
  },
  resultValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  resultLabel: {
    color: colors.ash[400],
    fontSize: typography.sizes.xs,
    textAlign: "center",
  },
  goldText: {
    color: colors.gold,
  },
  dangerText: {
    color: colors.wine[400],
  },
  successText: {
    color: colors.win,
  },
  winnerOption: {
    alignItems: "center",
    backgroundColor: colors.ink[900],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[3],
  },
  winnerOptionSelected: {
    borderColor: colors.glaze[500],
  },
  entryRow: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
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
  entryResult: {
    alignItems: "flex-end",
    gap: spacing[1],
  },
  plateChange: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  winText: {
    color: colors.win,
  },
  lossText: {
    color: colors.wine[400],
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.glaze[700],
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  errorText: {
    color: colors.wine[400],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
  footer: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: spacing[5],
    position: "absolute",
    right: 0,
  },
});
