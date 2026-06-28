import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getChallenge, placeBet, type ChallengeDetail } from "../../api/challenges";
import { Button } from "../../components/primitives/Button";
import { AuthModal } from "../../components/auth/AuthModal";
import type { PartyStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "PlaceBet">;

export function PlaceBetScreen({ navigation, route }: Props) {
  const { challengeId } = route.params;
  const { profile, refreshProfile, isAnonymous } = useCurrentUser();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authVisible, setAuthVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getChallenge(challengeId)
      .then((detail) => {
        if (!alive) return;
        setChallenge(detail);
        setStakeAmount(Math.max(1, detail.stakeAmount));
        setSelectedOptionId(detail.options[0]?.id ?? null);
      })
      .catch((caught) => {
        if (alive) setError(getMessage(caught, "Failed to load challenge."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [challengeId]);

  const balance = profile?.plates ?? 0;
  const selectedOption = useMemo(
    () => challenge?.options.find((option) => option.id === selectedOptionId) ?? null,
    [challenge?.options, selectedOptionId],
  );
  const minStake = challenge?.stakeAmount ?? 1;
  const canSubmit = Boolean(
    challenge
      && selectedOptionId
      && challenge.status === "open"
      && stakeAmount >= minStake
      && (isAnonymous || stakeAmount <= balance)
      && !submitting
      && !success,
  );

  const adjustStake = useCallback((delta: number) => {
    setStakeAmount((previous) => Math.max(minStake, Math.min(balance || minStake, previous + delta)));
  }, [balance, minStake]);

  const setMaxStake = useCallback(() => {
    setStakeAmount(Math.max(minStake, balance));
  }, [balance, minStake]);

  const setStakeFromText = useCallback((value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ""));
    setStakeAmount(Number.isFinite(parsed) ? parsed : minStake);
  }, [minStake]);

  const confirm = useCallback(async () => {
    if (!challenge || !selectedOptionId) return;
    if (isAnonymous) {
      setAuthVisible(true);
      return;
    }
    if (challenge.status !== "open") {
      setError("Challenge closed");
      return;
    }
    if (stakeAmount > balance) {
      setError("Insufficient plates");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await placeBet({
        challengeId: challenge.id,
        chosenOptionId: selectedOptionId,
        stakeAmount,
      });
      setSuccess(true);
      refreshProfile();
      setTimeout(() => {
        navigation.replace("ChallengeDetail", { challengeId: challenge.id });
      }, 2000);
    } catch (caught) {
      const message = friendlyBetError(getMessage(caught, "Failed to place bet."));
      setError(message);
      Alert.alert("Could not place bet", message);
    } finally {
      setSubmitting(false);
    }
  }, [balance, challenge, isAnonymous, navigation, refreshProfile, selectedOptionId, stakeAmount]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.glaze[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.center}>
          <Text style={styles.title}>Place Your Bet</Text>
          <Text style={styles.errorText}>{error ?? "Challenge not found."}</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Place Your Bet</Text>
            <Text style={styles.subtitle}>{challenge.title}</Text>
          </View>
          <View style={styles.balancePill}>
            <Text style={styles.balanceLabel}>You have</Text>
            <Text style={styles.balanceValue}>{balance} plates</Text>
          </View>
        </View>

        <View style={styles.optionsGrid}>
          {challenge.options.map((option) => {
            const selected = option.id === selectedOptionId;
            return (
              <Pressable
                accessibilityLabel={`Bet on ${option.label}`}
                accessibilityRole="button"
                key={option.id}
                onPress={() => setSelectedOptionId(option.id)}
                style={[styles.optionCard, selected ? styles.optionCardSelected : null]}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                {selected ? <Text style={styles.checkMark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stakePanel}>
          <Text style={styles.sectionTitle}>Stake Amount</Text>
          <View style={styles.stakeControls}>
            <Pressable
              accessibilityLabel="Decrease stake"
              accessibilityRole="button"
              onPress={() => adjustStake(-1)}
              style={styles.stepperButton}
            >
              <Text style={styles.stepperText}>-</Text>
            </Pressable>
            <TextInput
              accessibilityLabel="Stake amount"
              keyboardType="number-pad"
              onChangeText={setStakeFromText}
              style={styles.stakeInput}
              value={`${stakeAmount}`}
            />
            <Pressable
              accessibilityLabel="Increase stake"
              accessibilityRole="button"
              onPress={() => adjustStake(1)}
              style={styles.stepperButton}
            >
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.stakeMetaRow}>
            <Text style={styles.helper}>Minimum {minStake} plates</Text>
            <Pressable accessibilityRole="button" onPress={setMaxStake}>
              <Text style={styles.maxText}>Max</Text>
            </Pressable>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>Bet placed. Returning to challenge...</Text> : null}
      </ScrollView>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Wagering <Text style={styles.goldText}>{stakeAmount} plates</Text>
          {selectedOption ? ` on ${selectedOption.label}` : ""}
        </Text>
        <Button
          title="Confirm Bet"
          size="lg"
          loading={submitting}
          disabled={!canSubmit}
          onPress={() => void confirm()}
        />
      </View>
      <AuthModal
        visible={authVisible}
        reason="Sign in to place bets with real plates."
        onClose={() => setAuthVisible(false)}
        onSignedIn={() => setAuthVisible(false)}
      />
    </SafeAreaView>
  );
}

function friendlyBetError(message: string): string {
  const lower = message.toLocaleLowerCase();
  if (lower.includes("insufficient")) return "Insufficient plates";
  if (lower.includes("closed") || lower.includes("status")) return "Challenge closed";
  if (lower.includes("duplicate") || lower.includes("already")) return "Already entered";
  return message;
}

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default PlaceBetScreen;

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
    gap: spacing[5],
    padding: spacing[5],
    paddingBottom: 160,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
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
  balancePill: {
    alignItems: "flex-end",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  balanceLabel: {
    color: colors.ash[400],
    fontSize: typography.sizes.xs,
  },
  balanceValue: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  optionCard: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 104,
    justifyContent: "center",
    padding: spacing[4],
  },
  optionCardSelected: {
    borderColor: colors.glaze[500],
    borderWidth: 2,
  },
  optionLabel: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: "center",
  },
  checkMark: {
    color: colors.glaze[400],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing[2],
  },
  stakePanel: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  stakeControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
  },
  stepperButton: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.ink[700],
    borderRadius: 8,
    justifyContent: "center",
    width: 48,
  },
  stepperText: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  stakeInput: {
    backgroundColor: colors.ink[900],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    color: colors.gold,
    flex: 1,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    padding: spacing[3],
    textAlign: "center",
  },
  stakeMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  helper: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
  maxText: {
    color: colors.glaze[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  errorText: {
    color: colors.wine[400],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
  successText: {
    color: colors.win,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: "center",
  },
  summary: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderTopWidth: 1,
    bottom: 0,
    gap: spacing[3],
    left: 0,
    padding: spacing[5],
    position: "absolute",
    right: 0,
  },
  summaryText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
  goldText: {
    color: colors.gold,
    fontWeight: typography.weights.bold,
  },
});
