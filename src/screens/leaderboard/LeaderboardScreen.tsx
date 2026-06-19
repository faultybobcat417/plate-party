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
import { Badge } from "../../components/primitives/Badge";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { PlateChip } from "../../components/composite/PlateChip";
import type { PartyStackParamList } from "../../navigation/types";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "Leaderboard">;

type SortBy = "wins" | "balance";

const rankEmoji = (index: number): string => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}`;
};

export function LeaderboardScreen({ route }: Props) {
  const { partyId } = route.params;
  const members = usePartyStore((state) => state.currentPartyMembers);
  const loadPartyMembers = usePartyStore((state) => state.loadPartyMembers);
  const isLoading = usePartyStore((state) => state.isLoading);

  const [sortBy, setSortBy] = useState<SortBy>("wins");

  useEffect(() => {
    void loadPartyMembers(partyId);
  }, [partyId, loadPartyMembers]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (sortBy === "wins") {
        const winDiff = b.totalWins - a.totalWins;
        if (winDiff !== 0) return winDiff;
        return b.plateBalance - a.plateBalance;
      }
      const balanceDiff = b.plateBalance - a.plateBalance;
      if (balanceDiff !== 0) return balanceDiff;
      return b.totalWins - a.totalWins;
    });
  }, [members, sortBy]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.sortButtons}>
          <Button
            title="Wins"
            size="sm"
            variant={sortBy === "wins" ? "primary" : "secondary"}
            onPress={() => setSortBy("wins")}
          />
          <Button
            title="Balance"
            size="sm"
            variant={sortBy === "balance" ? "primary" : "secondary"}
            onPress={() => setSortBy("balance")}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading && sortedMembers.length === 0 ? (
          <Text style={styles.loadingText}>Loading members...</Text>
        ) : sortedMembers.length === 0 ? (
          <Text style={styles.emptyText}>No members to rank yet.</Text>
        ) : (
          sortedMembers.map((member, index) => (
            <Card key={member.userId} variant="elevated" padding={4} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rank}>{rankEmoji(index)}</Text>
                <Avatar name={member.displayName || "Member"} size="md" />
                <View style={styles.info}>
                  <Text style={styles.name}>{member.displayName || "Anonymous"}</Text>
                  <View style={styles.stats}>
                    <Text style={styles.statText}>{member.totalWins} wins</Text>
                    <Text style={styles.statText}>{member.totalLosses} losses</Text>
                  </View>
                </View>
                <View style={styles.right}>
                  {member.role === "host" ? <Badge label="Host" variant="warning" /> : null}
                  <PlateChip amount={member.plateBalance} />
                </View>
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  sortButtons: {
    flexDirection: "row",
    gap: spacing[2],
  },
  scroll: {
    padding: spacing[4],
  },
  loadingText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
  emptyText: {
    color: colors.ash[500],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
  card: {
    marginBottom: spacing[3],
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
  },
  rank: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    minWidth: 32,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  stats: {
    flexDirection: "row",
    gap: spacing[2],
  },
  statText: {
    color: colors.ash[600],
    fontSize: typography.sizes.xs,
  },
  right: {
    alignItems: "flex-end",
    gap: spacing[1],
  },
});
