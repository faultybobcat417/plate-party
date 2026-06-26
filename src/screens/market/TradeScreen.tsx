import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, typography } from "../../theme";
import { useMarketStore } from "../../stores/useMarketStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getDb } from "../../db/connection";
import { wagers, bets, partyMembers } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { postLedgerTransaction } from "../../api/ledger";
import type { MarketStackParamList } from "../../navigation/types";

type TradeRouteProp = RouteProp<MarketStackParamList, "Trade">;
type TradeNav = NativeStackNavigationProp<MarketStackParamList>;

export default function TradeScreen() {
  const route = useRoute<TradeRouteProp>();
  const navigation = useNavigation<TradeNav>();
  const currentUser = useCurrentUser();

  const markets = useMarketStore((state) => state.markets);
  const market = markets.find((m) => m.id === route.params?.marketId);

  const [selectedOption, setSelectedOption] = useState<"yes" | "no" | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrade = useCallback(async () => {
    if (!currentUser.userId) { Alert.alert("Error", "You must be logged in to trade"); return; }
    if (!market) { Alert.alert("Error", "Market not found"); return; }
    if (!selectedOption) { Alert.alert("Error", "Select Yes or No"); return; }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) { Alert.alert("Error", "Enter a valid amount"); return; }

    setIsSubmitting(true);
    try {
      const db = await getDb();
      const [wager] = await db.select().from(wagers).where(eq(wagers.id, market.id)).limit(1);
      if (!wager) throw new Error("Wager not found");

      const partyId = wager.partyId;
      const userId = currentUser.userId;

      const [member] = await db.select().from(partyMembers).where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId))).limit(1);
      if (!member) throw new Error("You are not a member of this party");
      if (member.plateBalance < numAmount) throw new Error(`Need ${numAmount} plates, have ${member.plateBalance}`);

      const betId = crypto.randomUUID();
      await db.insert(bets).values({ id: betId, wagerId: wager.id, userId, optionId: selectedOption, platesWagered: numAmount, placedAt: new Date().toISOString(), status: "pending" });

      await db.update(partyMembers).set({
        plateBalance: member.plateBalance - numAmount,
        reservedPlateBalance: (member.reservedPlateBalance || 0) + numAmount,
        totalPlatesWagered: (member.totalPlatesWagered || 0) + numAmount,
      }).where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)));

      await postLedgerTransaction({
        userId, amount: numAmount, type: "wager_escrow", description: `Bet placed on ${market.title}`,
        partyId, sourceTable: "bets", sourceId: betId, wagerId: wager.id, betId,
      });

      Alert.alert("Trade Placed!", `Bet ${numAmount} plates on ${selectedOption.toUpperCase()}. New balance: ${member.plateBalance - numAmount}`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Trade Failed", err.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser.userId, market, selectedOption, amount, navigation]);

  if (!market) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.errorText}>Market not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{market.title}</Text>
        <Text style={styles.description}>{market.description || "No description"}</Text>
      </View>

      <View style={styles.options}>
        <Pressable
          onPress={() => setSelectedOption("yes")}
          style={[styles.option, selectedOption === "yes" && styles.optionSelected]}
          accessibilityRole="button" accessibilityLabel="Bet Yes" accessibilityState={{ selected: selectedOption === "yes" }}
        >
          <Text style={styles.optionLabel}>Yes</Text>
          <Text style={styles.optionOdds}>{(market.yesPrice * 100).toFixed(0)}%</Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedOption("no")}
          style={[styles.option, selectedOption === "no" && styles.optionSelected]}
          accessibilityRole="button" accessibilityLabel="Bet No" accessibilityState={{ selected: selectedOption === "no" }}
        >
          <Text style={styles.optionLabel}>No</Text>
          <Text style={styles.optionOdds}>{(market.noPrice * 100).toFixed(0)}%</Text>
        </Pressable>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.label}>Amount (plates)</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={amount} onChangeText={setAmount}
          placeholder="Enter amount" placeholderTextColor={colors.neutral[400]} accessibilityLabel="Bet amount" />
      </View>

      <Pressable onPress={handleTrade} disabled={isSubmitting}
        style={({ pressed }) => [styles.tradeButton, pressed && styles.tradeButtonPressed, isSubmitting && styles.tradeButtonDisabled]}
        accessibilityRole="button" accessibilityLabel="Place trade"
      >
        {isSubmitting ? <ActivityIndicator color={colors.neutral[0]} /> : <Text style={styles.tradeButtonText}>Place Trade</Text>}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50], padding: spacing[4] },
  header: { marginBottom: spacing[4] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.neutral[900], marginBottom: spacing[2] },
  description: { fontSize: typography.sizes.base, color: colors.neutral[500], lineHeight: typography.lineHeights.base },
  options: { flexDirection: "row", gap: spacing[3], marginBottom: spacing[4] },
  option: { flex: 1, padding: spacing[4], borderRadius: 16, backgroundColor: colors.neutral[0], borderWidth: 2, borderColor: colors.neutral[200], alignItems: "center" },
  optionSelected: { borderColor: colors.primary.base, backgroundColor: colors.primary.light },
  optionLabel: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.neutral[900] },
  optionOdds: { fontSize: typography.sizes.base, color: colors.neutral[500], marginTop: spacing[1] },
  amountSection: { marginBottom: spacing[4] },
  label: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.neutral[900], marginBottom: spacing[2] },
  input: { backgroundColor: colors.neutral[0], borderRadius: 12, paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize: typography.sizes.lg, color: colors.neutral[900], borderWidth: 1, borderColor: colors.neutral[200] },
  tradeButton: { backgroundColor: colors.primary.base, padding: spacing[4], borderRadius: 99, alignItems: "center", ...theme.shadows.lg },
  tradeButtonPressed: { opacity: 0.9 },
  tradeButtonDisabled: { opacity: 0.5 },
  tradeButtonText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.neutral[0] },
  errorText: { fontSize: typography.sizes.base, color: colors.neutral[900], textAlign: "center", marginTop: spacing[4] },
});

import { theme } from "../../theme";
