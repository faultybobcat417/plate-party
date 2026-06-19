import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { BottomSheet } from "../../components/primitives/BottomSheet";
import { Button } from "../../components/primitives/Button";
import { PlateChip } from "../../components/composite/PlateChip";
import type { PartyStackParamList } from "../../navigation/types";
import { useWagerStore } from "../../stores/useWagerStore";
import { useBetStore } from "../../stores/useBetStore";
import { colors, spacing, typography } from "../../theme";
import { getCurrentUserId } from "../../utils/identity";

type Props = NativeStackScreenProps<PartyStackParamList, "BetConfirmed">;

export function BetConfirmedSheet({ route, navigation }: Props) {
  const { wagerId, partyId } = route.params;
  const wager = useWagerStore((state) => state.currentWager);
  const loadWager = useWagerStore((state) => state.loadWager);
  const betsForWager = useBetStore((state) => state.betsForWager);
  const loadBetsForWager = useBetStore((state) => state.loadBetsForWager);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadWager(wagerId);
    void loadBetsForWager(wagerId);
    void (async () => {
      const id = await getCurrentUserId();
      setUserId(id);
    })();
  }, [wagerId, loadWager, loadBetsForWager]);

  const userBet = useMemo(() => {
    return betsForWager.find((bet) => bet.userId === userId);
  }, [betsForWager, userId]);

  const chosenOption = useMemo(() => {
    if (!wager || !userBet) return null;
    return wager.options.find((option) => option.id === userBet.optionId);
  }, [wager, userBet]);

  return (
    <BottomSheet visible onClose={() => navigation.navigate("WagerDetail", { wagerId, partyId })}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🎉</Text>
      </View>
      <Text style={styles.title}>Bet Confirmed</Text>

      {wager ? (
        <Text style={styles.question}>{wager.wager.question}</Text>
      ) : null}

      {chosenOption ? (
        <View style={styles.choiceCard}>
          <Text style={styles.choiceLabel}>{chosenOption.label}</Text>
          <PlateChip amount={userBet?.platesWagered ?? wager?.wager.stakePlates ?? 0} />
        </View>
      ) : (
        <Text style={styles.infoText}>Your bet has been placed.</Text>
      )}

      <View style={styles.actions}>
        <Button
          title="Back to Wager"
          onPress={() => navigation.navigate("WagerDetail", { wagerId, partyId })}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.glaze[100],
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    marginBottom: spacing[4],
    width: 64,
  },
  icon: {
    fontSize: typography.sizes["3xl"],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
    textAlign: "center",
  },
  question: {
    color: colors.ink[800],
    fontSize: typography.sizes.base,
    marginBottom: spacing[4],
    textAlign: "center",
  },
  choiceCard: {
    alignItems: "center",
    backgroundColor: colors.linen[50],
    borderColor: colors.glaze[300],
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  choiceLabel: {
    color: colors.ink[900],
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  infoText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginBottom: spacing[4],
    textAlign: "center",
  },
  actions: {
    marginTop: spacing[2],
  },
});
