import { StyleSheet, Text, View } from "react-native";

import { Button } from "../primitives/Button";
import { colors, spacing, typography } from "../../theme";

export type EmptyStateProps = {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = "🍽",
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
  },
  icon: {
    fontSize: typography.sizes["4xl"],
    marginBottom: spacing[4],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
    textAlign: "center",
  },
  message: {
    color: colors.ash[400],
    fontSize: typography.sizes.base,
    marginBottom: spacing[5],
    textAlign: "center",
  },
  action: {
    minWidth: 200,
  },
});
