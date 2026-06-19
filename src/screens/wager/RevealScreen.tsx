import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { Badge } from "../../components/primitives/Badge";
import { RevealOverlay } from "../../components/composite/RevealOverlay";
import { PlateChip } from "../../components/composite/PlateChip";
import type { PartyStackParamList } from "../../navigation/types";
import { useWagerStore } from "../../stores/useWagerStore";
import { useBetStore } from "../../stores/useBetStore";
import { colors, spacing, typography } from "../../theme";
import { getCurrentUserId } from "../../utils/identity";

type Props = NativeStackScreenProps<PartyStackParamList, "Reveal">;

export function RevealScreen({ route, navigation }: Props) {
  const { wagerId, partyId } = route.params;
  const wager = useWagerStore((state) => state.currentWager);
  const loadWager = useWagerStore((state) => state.loadWager);
  const betsForWager = useBetStore((state) => state.betsForWager);
  const loadBetsForWager = useBetStore((state) => state.loadBetsForWager);

  const [userId, setUserId] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    void loadWager(wagerId);
    void loadBetsForWager(wagerId);
    void (async () => {
      const id = await getCurrentUserId();
      setUserId(id);
    })();
  }, [wagerId, loadWager, loadBetsForWager]);

  useEffect(() => {
    if (wager?.wager.status === "resolved") {
      const timer = setTimeout(() => setOverlayVisible(true), 400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [wager]);

  const userBet = useMemo(() => {
    return betsForWager.find((bet) => bet.userId === userId);
  }, [betsForWager, userId]);

  const winningOption = useMemo(() => {
    if (!wager) return null;
    return wager.options.find((option) => option.id === wager.wager.winningOptionId);
  }, [wager]);

  const won = useMemo(() => {
    if (!userBet || !winningOption) return false;
    return userBet.optionId === winningOption.id;
  }, [userBet, winningOption]);

  const amount = userBet?.platesWagered ?? wager?.wager.stakePlates ?? 0;

  if (!wager) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading result...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { wager: wagerData, options } = wager;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>The Reveal</Text>

        <View style={styles.card}>
          <Text style={styles.question}>{wagerData.question}</Text>
          <View style={styles.row}>
            <Badge label={wagerData.status.toUpperCase()} variant="info" />
            <PlateChip amount={wagerData.stakePlates} />
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Winning Option</Text>
          {winningOption ? (
            <Text style={styles.winnerLabel}>{winningOption.label}</Text>
          ) : (
            <Text style={styles.noResult}>No winner selected.</Text>
          )}
        </View>

        {userBet ? (
          <View style={[styles.userResultCard, won && styles.userResultCardWon]}>
            <Text style={styles.resultTitle}>Your Bet</Text>
            <Text style={styles.userOption}>
              {options.find((option) => option.id === userBet.optionId)?.label || "Unknown"}
            </Text>
            <Text style={styles.plateChange}>
              {won ? `+${amount}` : `-${amount}`} 🍽
            </Text>
            <Text style={styles.statusText}>{won ? "You won!" : "Better luck next time."}</Text>
          </View>
        ) : (
          <View style={styles.userResultCard}>
            <Text style={styles.noResult}>You did not place a bet on this wager.</Text>
          </View>
        )}

        <Button
          title="Back to Wager"
          variant="secondary"
          onPress={() => navigation.navigate("WagerDetail", { wagerId, partyId })}
        />
      </ScrollView>

      <RevealOverlay
        visible={overlayVisible}
        won={won}
        amount={amount}
        onClose={() => setOverlayVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
  },
  scroll: {
    padding: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[4],
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.linen[50],
    borderColor: colors.ash[200],
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  question: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[3],
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resultCard: {
    backgroundColor: colors.glaze[100],
    borderRadius: 16,
    marginBottom: spacing[4],
    padding: spacing[6],
  },
  resultTitle: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[1],
  },
  winnerLabel: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  noResult: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
  },
  userResultCard: {
    backgroundColor: colors.linen[50],
    borderColor: colors.ash[200],
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing[4],
    padding: spacing[6],
  },
  userResultCardWon: {
    borderColor: colors.glaze[400],
  },
  userOption: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  plateChange: {
    color: colors.glaze[700],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[1],
  },
  statusText: {
    color: colors.ink[700],
    fontSize: typography.sizes.base,
  },
});
