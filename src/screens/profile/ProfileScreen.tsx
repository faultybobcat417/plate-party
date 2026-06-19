import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Avatar } from "../../components/primitives/Avatar";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { PlateChip } from "../../components/composite/PlateChip";
import type { PartyStackParamList } from "../../navigation/types";
import { usePartyStore } from "../../stores/usePartyStore";
import { useBetStore } from "../../stores/useBetStore";
import { colors, spacing, typography } from "../../theme";
import { getCurrentUserId } from "../../utils/identity";

type Props = NativeStackScreenProps<PartyStackParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const currentPartyMembers = usePartyStore((state) => state.currentPartyMembers);
  const userBets = useBetStore((state) => state.userBets);
  const loadUserBets = useBetStore((state) => state.loadUserBets);

  useEffect(() => {
    void (async () => {
      const id = await getCurrentUserId();
      setUserId(id);
      if (id) {
        void loadUserBets(id);
      }
    })();
  }, [loadUserBets]);

  const currentMembership = useMemo(() => {
    return currentPartyMembers.find((member) => member.userId === userId);
  }, [currentPartyMembers, userId]);

  const stats = useMemo(() => {
    const totalWagers = userBets.length;
    const totalWon = userBets.filter((bet) => bet.status === "won").length;
    const totalLost = userBets.filter((bet) => bet.status === "lost").length;
    const totalPlatesWagered = userBets.reduce((sum, bet) => sum + bet.platesWagered, 0);
    return {
      totalWagers,
      totalWon,
      totalLost,
      totalPlatesWagered,
      balance: currentMembership?.plateBalance ?? 0,
    };
  }, [userBets, currentMembership]);

  const displayName = currentMembership?.displayName || "Your Profile";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <Avatar name={displayName} size="xl" />
          <Text style={styles.name}>{displayName}</Text>
          {currentMembership ? (
            <Text style={styles.role}>{currentMembership.role.toUpperCase()}</Text>
          ) : null}
        </View>

        <Card variant="elevated" padding={5} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <PlateChip amount={stats.balance} />
        </Card>

        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <Card variant="default" padding={4} style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWagers}</Text>
            <Text style={styles.statLabel}>Bets Placed</Text>
          </Card>
          <Card variant="default" padding={4} style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWon}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </Card>
          <Card variant="default" padding={4} style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalLost}</Text>
            <Text style={styles.statLabel}>Losses</Text>
          </Card>
          <Card variant="default" padding={4} style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalPlatesWagered}</Text>
            <Text style={styles.statLabel}>Plates Wagered</Text>
          </Card>
        </View>

        <View style={styles.actions}>
          <Button
            title="Settings"
            variant="secondary"
            onPress={() => navigation.navigate("Settings")}
          />
        </View>
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
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  name: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginTop: spacing[3],
  },
  role: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginTop: spacing[1],
  },
  balanceCard: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  balanceLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  sectionTitle: {
    color: colors.ink[700],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
  },
  statValue: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[1],
  },
  statLabel: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
  },
  actions: {
    marginTop: spacing[2],
  },
});
