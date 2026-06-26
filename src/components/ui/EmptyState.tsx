import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = "📭", title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji} accessibilityLabel={title}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
    backgroundColor: colors.neutral[50],
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
    textAlign: "center",
  },
  message: {
    fontSize: typography.sizes.base,
    color: colors.neutral[500],
    textAlign: "center",
    lineHeight: typography.lineHeights.base,
  },
  action: {
    marginTop: spacing[4],
  },
});
