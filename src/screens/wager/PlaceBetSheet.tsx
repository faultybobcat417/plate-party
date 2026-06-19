import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { BottomSheet } from "../../components/primitives/BottomSheet";
import { Button } from "../../components/primitives/Button";
import { BetOptionCard } from "../../components/composite/BetOptionCard";
import { PlateChip } from "../../components/composite/PlateChip";
import type { PartyStackParamList } from "../../navigation/types";
import { useWagerStore } from "../../stores/useWagerStore";
import { useBetStore } from "../../stores/useBetStore";
import { colors, spacing, typography } from "../../theme";
import { getCurrentUserId, getDeviceId } from "../../utils/identity";

type Props = NativeStackScreenProps<PartyStackParamList, "PlaceBet">;

export function PlaceBetSheet({ route, navigation }: Props) {
  const { wagerId, partyId } = route.params;
  const wager = useWagerStore((state) => state.currentWager);
  const loadWager = useWagerStore((state) => state.loadWager);
  const placeBet = useBetStore((state) => state.placeBet);
  const isLoading = useBetStore((state) => state.isLoading);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    void loadWager(wagerId);
    void (async () => {
      const [uid, did] = await Promise.all([getCurrentUserId(), getDeviceId()]);
      setUserId(uid);
      setDeviceId(did);
    })();
  }, [wagerId, loadWager]);

  const handleConfirm = async () => {
    if (!wager || !selectedOptionId || !userId || !deviceId) return;

    try {
      await placeBet({
        wagerId,
        userId,
        optionId: selectedOptionId,
        deviceId,
      });
      navigation.replace("BetConfirmed", { wagerId, partyId });
    } catch (error) {
      Alert.alert(
        "Failed to place bet",
        error instanceof Error ? error.message : "An unexpected error occurred.",
      );
    }
  };

  return (
    <BottomSheet visible onClose={() => navigation.goBack()}>
      <Text style={styles.title}>Place Your Bet</Text>
      {wager ? (
        <>
          <Text style={styles.question}>{wager.wager.question}</Text>
          <View style={styles.stakeRow}>
            <Text style={styles.stakeLabel}>Stake</Text>
            <PlateChip amount={wager.wager.stakePlates} />
          </View>

          <Text style={styles.sectionLabel}>Pick an option</Text>
          {wager.options.map((option) => (
            <BetOptionCard
              key={option.id}
              option={option}
              selected={selectedOptionId === option.id}
              onPress={() => setSelectedOptionId(option.id)}
            />
          ))}

          <View style={styles.actions}>
            <Button
              title="Confirm Bet"
              onPress={() => void handleConfirm()}
              loading={isLoading}
              disabled={!selectedOptionId}
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => navigation.goBack()}
            />
          </View>
        </>
      ) : (
        <Text style={styles.loadingText}>Loading wager...</Text>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  question: {
    color: colors.ink[800],
    fontSize: typography.sizes.base,
    marginBottom: spacing[3],
  },
  stakeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  stakeLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sectionLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[2],
  },
  actions: {
    gap: spacing[2],
    marginTop: spacing[4],
  },
  loadingText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
});
