import { StyleSheet, Text, View } from "react-native";

import { Badge } from "../primitives/Badge";
import { spacing } from "../../theme";

export type SyncStatusBadgeProps = {
  pendingCount: number;
  isProcessing: boolean;
};

export function SyncStatusBadge({ pendingCount, isProcessing }: SyncStatusBadgeProps) {
  if (isProcessing) {
    return <Badge label="Syncing..." variant="info" />;
  }

  if (pendingCount > 0) {
    return (
      <View style={styles.container}>
        <Badge label={`${pendingCount} pending`} variant="warning" />
      </View>
    );
  }

  return <Badge label="Synced" variant="success" />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
