import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Badge } from "../../components/primitives/Badge";
import { Button } from "../../components/primitives/Button";
import { BetOptionCard } from "../../components/composite/BetOptionCard";
import { CountdownTimer } from "../../components/composite/CountdownTimer";
import { PlateChip } from "../../components/composite/PlateChip";
import type { PartyStackParamList } from "../../navigation/types";
import { resolveWager } from "../../api/wager";
import { usePartyStore } from "../../stores/usePartyStore";
import { useWagerStore } from "../../stores/useWagerStore";
import { useBetStore } from "../../stores/useBetStore";
import { colors, spacing, typography } from "../../theme";
import { getCurrentUserId, getDeviceId } from "../../utils/identity";
import type { Wager } from "../../db/schema";

type Props = NativeStackScreenProps<PartyStackParamList, "WagerDetail">;

const statusVariant = (status: Wager["status"]): Parameters<typeof Badge>[0]["variant"] => {
  switch (status) {
    case "open":
      return "success";
    case "locked":
      return "warning";
    case "resolved":
      return "info";
    case "void":
      return "danger";
    default:
      return "default";
  }
};

export function WagerDetailScreen({ route, navigation }: Props) {
  const { wagerId, partyId } = route.params;
  const wager = useWagerStore((state) => state.currentWager);
  const loadWager = useWagerStore((state) => state.loadWager);
  const isWagerLoading = useWagerStore((state) => state.isLoading);
  const betsForWager = useBetStore((state) => state.betsForWager);
  const loadBetsForWager = useBetStore((state) => state.loadBetsForWager);
  const currentPartyMembers = usePartyStore((state) => state.currentPartyMembers);
  const loadPartyMembers = usePartyStore((state) => state.loadPartyMembers);

  const [userId, setUserId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [resolvingOptionId, setResolvingOptionId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    void loadWager(wagerId);
    void loadBetsForWager(wagerId);
    void loadPartyMembers(partyId!);
    void (async () => {
      const [uid, did] = await Promise.all([getCurrentUserId(), getDeviceId()]);
      setUserId(uid);
      setDeviceId(did);
    })();
  }, [wagerId, partyId, loadWager, loadBetsForWager, loadPartyMembers]);

  const currentMember = currentPartyMembers.find((member) => member.userId === userId);
  const isHost = currentMember?.role === "host";
  const userBet = betsForWager.find((bet) => bet.userId === userId);
  const totalBets = betsForWager.length;

  const handleResolve = async () => {
    if (!wager || !resolvingOptionId || !userId || !deviceId) return;

    setIsResolving(true);
    try {
      await resolveWager({
        wagerId: wager.wager.id,
        winningOptionId: resolvingOptionId,
        resolvedByUserId: userId,
        deviceId,
      });
      await loadWager(wager.wager.id);
      navigation.navigate("Reveal", { wagerId: wager.wager.id, partyId });
    } catch (error) {
      Alert.alert(
        "Failed to resolve wager",
        error instanceof Error ? error.message : "An unexpected error occurred.",
      );
    } finally {
      setIsResolving(false);
    }
  };

  if (isWagerLoading || !wager) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading wager...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { wager: wagerData, options } = wager;
  const winningOption = options.find((option) => option.id === wagerData.winningOptionId);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Badge label={wagerData.status.toUpperCase()} variant={statusVariant(wagerData.status)} />
          <PlateChip amount={wagerData.stakePlates} />
        </View>

        <Text style={styles.question}>{wagerData.question}</Text>

        <View style={styles.meta}>
          <CountdownTimer deadline={wagerData.deadline} />
          <Text style={styles.betCount}>{totalBets} bets placed</Text>
        </View>

        {wagerData.status === "resolved" && winningOption ? (
          <View style={styles.resultBanner}>
            <Text style={styles.resultTitle}>Winner</Text>
            <Text style={styles.resultLabel}>{winningOption.label}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Options</Text>
        {options.map((option) => {
          const betCount = betsForWager.filter((bet) => bet.optionId === option.id).length;
          return (
            <BetOptionCard
              key={option.id}
              option={option}
              selected={userBet?.optionId === option.id}
              disabled={wagerData.status !== "open"}
              betCount={betCount}
              totalBets={totalBets}
              onPress={() => {
                if (wagerData.status === "open" && !userBet) {
                  navigation.navigate("PlaceBet", { wagerId, partyId });
                }
              }}
            />
          );
        })}

        {wagerData.status === "open" && !userBet ? (
          <Button
            title="Place a Bet"
            onPress={() => navigation.navigate("PlaceBet", { wagerId, partyId })}
          />
        ) : null}

        {wagerData.status === "open" && isHost ? (
          <View style={styles.resolveSection}>
            <Text style={styles.sectionTitle}>Resolve Wager</Text>
            {options.map((option) => (
              <BetOptionCard
                key={option.id}
                option={option}
                selected={resolvingOptionId === option.id}
                onPress={() => setResolvingOptionId(option.id)}
              />
            ))}
            <Button
              title="Confirm Resolve"
              onPress={() => void handleResolve()}
              loading={isResolving}
              disabled={!resolvingOptionId}
            />
          </View>
        ) : null}

        {wagerData.status === "resolved" ? (
          <Button
            title="View Reveal"
            variant="secondary"
            onPress={() => navigation.navigate("Reveal", { wagerId, partyId })}
          />
        ) : null}

        <Text style={styles.sectionTitle}>Bets</Text>
        {betsForWager.length === 0 ? (
          <Text style={styles.emptyText}>No bets yet.</Text>
        ) : (
          betsForWager.map((bet) => (
            <View key={bet.id} style={styles.betRow}>
              <Text style={styles.betUser}>{bet.displayName || "Anonymous"}</Text>
              <Text style={styles.betOption}>
                {options.find((option) => option.id === bet.optionId)?.label || "Unknown"}
              </Text>
              <PlateChip amount={bet.platesWagered} />
            </View>
          ))
        )}
      </ScrollView>
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  question: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[3],
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  betCount: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
  },
  resultBanner: {
    backgroundColor: colors.glaze[100],
    borderRadius: 12,
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  resultTitle: {
    color: colors.glaze[800],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[1],
  },
  resultLabel: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    color: colors.ink[700],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
    marginTop: spacing[4],
  },
  resolveSection: {
    marginTop: spacing[4],
  },
  betRow: {
    alignItems: "center",
    backgroundColor: colors.linen[50],
    borderColor: colors.ash[200],
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[2],
    padding: spacing[3],
  },
  betUser: {
    color: colors.ink[900],
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  betOption: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    marginRight: spacing[3],
  },
  emptyText: {
    color: colors.ash[500],
    fontSize: typography.sizes.base,
  },
});
