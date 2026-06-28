import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ChallengeEntry } from "../../api/challenge";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";

type SubmissionCardProps = {
  entry: ChallengeEntry;
  isResolving?: boolean;
  onPickWinner?: () => void;
};

export function SubmissionCard({ entry, isResolving = false, onPickWinner }: SubmissionCardProps) {
  const submittedAt = entry.proofSubmittedAt
    ? new Date(entry.proofSubmittedAt).toLocaleString()
    : "No proof submitted yet";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Entry {entry.id.slice(0, 8)}</Text>
          <Text style={styles.subtitle}>User {entry.userId.slice(0, 8)}</Text>
        </View>
        <Text style={styles.status}>{entry.status}</Text>
      </View>

      <Text style={styles.meta}>{submittedAt}</Text>
      {entry.proofUrl ? (
        <Pressable accessibilityRole="link" style={styles.proofBox}>
          <Text style={styles.proofText} numberOfLines={2}>{entry.proofUrl}</Text>
        </Pressable>
      ) : null}

      {onPickWinner ? (
        <Button
          title="Pick Winner"
          size="sm"
          loading={isResolving}
          disabled={isResolving || entry.status === "won"}
          onPress={onPickWinner}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5] ?? 2,
  },
  status: {
    color: colors.glaze[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  meta: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
  },
  proofBox: {
    backgroundColor: colors.ash[100],
    borderRadius: 12,
    padding: spacing[3],
  },
  proofText: {
    color: colors.ink[800],
    fontSize: typography.sizes.sm,
  },
});
