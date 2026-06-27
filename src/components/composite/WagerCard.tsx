import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "../primitives/Badge";
import { Card } from "../primitives/Card";
import { PlateChip } from "./PlateChip";
import { CountdownTimer } from "./CountdownTimer";
import { AvatarStack } from "../primitives/AvatarStack";
import { colors, spacing, typography } from "../../theme";
import type { Wager } from "../../db/schema";

export type WagerCardProps = {
  wager: Wager;
  participantNames?: string[];
  onPress?: () => void;
};

const statusVariant = (status: Wager["status"]): "default" | "success" | "warning" | "danger" | "info" => {
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

export function WagerCard({ wager, participantNames = [], onPress }: WagerCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" padding={4} style={styles.card}>
        <View style={styles.header}>
          <Badge label={wager.status.toUpperCase()} variant={statusVariant(wager.status)} />
          <PlateChip amount={wager.stakePlates} />
        </View>
        <Text style={styles.question} numberOfLines={2}>
          {wager.question}
        </Text>
        <View style={styles.footer}>
          <CountdownTimer deadline={wager.deadline ? new Date(wager.deadline).toISOString() : new Date().toISOString()} />
          <AvatarStack names={participantNames} max={3} size="sm" />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  question: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[3],
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
