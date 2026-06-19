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

import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { Card } from "../../components/primitives/Card";
import { Badge } from "../../components/primitives/Badge";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import type { PartyStackParamList } from "../../navigation/types";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";
import { getCurrentUserId } from "../../utils/identity";
import type { PaymentProvider } from "../../db/schema";

type Props = NativeStackScreenProps<PartyStackParamList, "RealMoneySettle">;

type LocalIou = {
  id: string;
  fromUserId: string;
  toUserId: string;
  dollarAmountCents: number;
  paymentProvider: PaymentProvider;
  externalPaymentRef: string;
  settled: boolean;
  settledAt: string | null;
  createdAt: string;
};

const providerOptions: Array<{ value: PaymentProvider; label: string }> = [
  { value: "venmo", label: "Venmo" },
  { value: "cash_app", label: "Cash App" },
  { value: "paypal", label: "PayPal" },
  { value: "manual", label: "Manual" },
];

export function RealMoneySettleScreen({ route }: Props) {
  const { partyId, userId: otherUserId } = route.params;
  const members = usePartyStore((state) => state.currentPartyMembers);
  const loadPartyMembers = usePartyStore((state) => state.loadPartyMembers);
  const currentParty = usePartyStore((state) => state.currentParty);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ious, setIous] = useState<LocalIou[]>([]);
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>("manual");
  const [reference, setReference] = useState("");

  useEffect(() => {
    void loadPartyMembers(partyId);
    void (async () => {
      const id = await getCurrentUserId();
      setCurrentUserId(id);
    })();
  }, [partyId, loadPartyMembers]);

  const otherMember = members.find((member) => member.userId === otherUserId);
  const isRealMoneyEnabled = currentParty?.realMoneyEnabled ?? false;

  const handleRecordSettlement = () => {
    if (!currentUserId) {
      Alert.alert("Missing profile", "Please finish onboarding first.");
      return;
    }

    const dollars = parseFloat(amount);
    if (Number.isNaN(dollars) || dollars <= 0) {
      Alert.alert("Invalid amount", "Enter a positive dollar amount.");
      return;
    }

    const newIou: LocalIou = {
      id: `${Date.now()}`,
      fromUserId: currentUserId,
      toUserId: otherUserId,
      dollarAmountCents: Math.round(dollars * 100),
      paymentProvider: provider,
      externalPaymentRef: reference.trim() || "Manual settlement",
      settled: true,
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setIous([newIou, ...ious]);
    setAmount("");
    setReference("");
    setProvider("manual");
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settle Up</Text>
        {otherMember ? (
          <Text style={styles.subtitle}>
            Record a payment to {otherMember.displayName || "this member"}.
          </Text>
        ) : null}

        {!isRealMoneyEnabled ? (
          <Card variant="default" padding={4} style={styles.warningCard}>
            <Text style={styles.warningText}>
              Real-money settling is disabled for this party.
            </Text>
          </Card>
        ) : null}

        <Card variant="elevated" padding={4} style={styles.formCard}>
          <Input
            label="Amount ($)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Payment method</Text>
            <SegmentedControl
              options={providerOptions}
              value={provider}
              onChange={setProvider}
            />
          </View>
          <Input
            label="Reference / Note"
            placeholder="Transaction ID or note"
            value={reference}
            onChangeText={setReference}
          />
          <Button
            title="Record Payment"
            onPress={handleRecordSettlement}
            disabled={!isRealMoneyEnabled || !currentUserId}
          />
        </Card>

        <Text style={styles.sectionTitle}>Settlements</Text>
        {ious.length === 0 ? (
          <Text style={styles.emptyText}>No settlements recorded yet.</Text>
        ) : (
          ious.map((iou) => (
            <Card key={iou.id} variant="default" padding={4} style={styles.iouCard}>
              <View style={styles.iouRow}>
                <View style={styles.iouInfo}>
                  <Text style={styles.iouAmount}>
                    ${(iou.dollarAmountCents / 100).toFixed(2)}
                  </Text>
                  <Text style={styles.iouProvider}>
                    {providerOptions.find((option) => option.value === iou.paymentProvider)?.label}
                  </Text>
                  <Text style={styles.iouRef}>{iou.externalPaymentRef}</Text>
                </View>
                <Badge label="Settled" variant="success" />
              </View>
            </Card>
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
  scroll: {
    padding: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[1],
  },
  subtitle: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginBottom: spacing[4],
  },
  warningCard: {
    backgroundColor: colors.wine[50],
    borderColor: colors.wine[200],
    marginBottom: spacing[4],
  },
  warningText: {
    color: colors.wine[700],
    fontSize: typography.sizes.base,
  },
  formCard: {
    marginBottom: spacing[6],
  },
  field: {
    marginBottom: spacing[4],
  },
  fieldLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1],
  },
  sectionTitle: {
    color: colors.ink[700],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  emptyText: {
    color: colors.ash[500],
    fontSize: typography.sizes.base,
  },
  iouCard: {
    marginBottom: spacing[2],
  },
  iouRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iouInfo: {
    flex: 1,
  },
  iouAmount: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  iouProvider: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
  },
  iouRef: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
