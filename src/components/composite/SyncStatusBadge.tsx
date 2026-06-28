import { StyleSheet, View } from "react-native";

import { Badge } from "../primitives/Badge";
import { spacing } from "../../theme";

export type SyncStatusBadgeProps = {
  pendingCount: number;
  isProcessing: boolean;
  isOnline?: boolean;
  error?: string | null;
};

export function SyncStatusBadge({ pendingCount, isProcessing, isOnline = true, error = null }: SyncStatusBadgeProps) {
  if (!isOnline) {
    return <Badge label={pendingCount > 0 ? `Offline • ${pendingCount} queued` : "Offline"} variant="warning" />;
  }

  if (error) {
    return <Badge label="Sync issue" variant="danger" />;
  }

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
