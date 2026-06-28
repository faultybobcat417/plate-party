import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSyncStore } from "../../stores/useSyncStore";
import { colors, spacing } from "../../theme";
import { SyncStatusBadge } from "./SyncStatusBadge";

export function OfflineSyncIndicator() {
  const insets = useSafeAreaInsets();
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const isOnline = useSyncStore((state) => state.isOnline);
  const isProcessing = useSyncStore((state) => state.isProcessing);
  const syncError = useSyncStore((state) => state.syncError);
  const startSyncMonitor = useSyncStore((state) => state.startSyncMonitor);
  const processOutbox = useSyncStore((state) => state.processOutbox);

  useEffect(() => startSyncMonitor(), [startSyncMonitor]);

  const visible = !isOnline || pendingCount > 0 || isProcessing || Boolean(syncError);
  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + spacing[2] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sync pending offline changes"
        disabled={!isOnline || isProcessing}
        onPress={() => {
          void processOutbox();
        }}
        style={styles.pressable}
      >
        <SyncStatusBadge
          pendingCount={pendingCount}
          isProcessing={isProcessing}
          isOnline={isOnline}
          error={syncError}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 50,
  },
  pressable: {
    backgroundColor: colors.ink[900],
    borderColor: colors.ink[700],
    borderRadius: 999,
    borderWidth: 1,
    padding: spacing[1],
  },
});
