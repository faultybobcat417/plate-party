import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { SyncStatusBadge } from "../../components/composite/SyncStatusBadge";
import type { PartyStackParamList } from "../../navigation/types";
import { useSyncStore } from "../../stores/useSyncStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "Settings">;

const HAPTICS_ENABLED_KEY = "plate-party-settings-haptics-enabled";
const NOTIFICATIONS_ENABLED_KEY = "plate-party-settings-notifications-enabled";

export function SettingsScreen({ navigation: _navigation }: Props) {
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const isProcessing = useSyncStore((state) => state.isProcessing);
  const loadPendingCount = useSyncStore((state) => state.loadPendingCount);
  const loadOutboxStats = useSyncStore((state) => state.loadOutboxStats);
  const processOutbox = useSyncStore((state) => state.processOutbox);

  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    void loadPendingCount();
    void loadOutboxStats();
    void (async () => {
      const [haptics, notifications] = await Promise.all([
        AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
      ]);
      setHapticsEnabled(haptics !== "false");
      setNotificationsEnabled(notifications !== "false");
    })();
  }, [loadPendingCount, loadOutboxStats]);

  const toggleHaptics = async (value: boolean) => {
    setHapticsEnabled(value);
    await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, String(value));
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(value));
  };

  const handleManualSync = async () => {
    try {
      await processOutbox([]);
      Alert.alert("Sync complete", "Outbox processed.");
    } catch (error) {
      Alert.alert(
        "Sync failed",
        error instanceof Error ? error.message : "An unexpected error occurred.",
      );
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Photo picker coming soon!", [
      { text: "OK", style: "default" },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmitPlates = () => {
    Alert.alert("Submit Plates", "How many plates to donate?", [
      { text: "10", onPress: () => Alert.alert("Thanks!", "10 plates donated!") },
      { text: "50", onPress: () => Alert.alert("Thanks!", "50 plates donated!") },
      { text: "100", onPress: () => Alert.alert("Thanks!", "100 plates donated!") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderToggle = (label: string, value: boolean, onChange: (value: boolean) => void) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.ash[300], true: colors.glaze[400] }}
        thumbColor={value ? colors.glaze[600] : colors.ash[100]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Photo */}
        <Card variant="elevated" padding={4} style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <Image
              source={{ uri: avatarUri || "https://picsum.photos/seed/avatar/100/100" }}
              style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.ash[200] }}
            />
            <TouchableOpacity
              onPress={handleChangePhoto}
              style={{ marginTop: 8, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: colors.glaze[100], borderRadius: 8 }}
            >
              <Text style={{ color: colors.glaze[700], fontWeight: "600" }}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Preferences */}
        <Card variant="elevated" padding={4} style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderToggle("Haptics", hapticsEnabled, toggleHaptics)}
          {renderToggle("Notifications", notificationsEnabled, toggleNotifications)}
        </Card>

        {/* Sync */}
        <Card variant="elevated" padding={4} style={styles.card}>
          <Text style={styles.sectionTitle}>Sync</Text>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Status</Text>
            <SyncStatusBadge pendingCount={pendingCount} isProcessing={isProcessing} />
          </View>
          <Button
            title="Sync Now"
            onPress={() => void handleManualSync()}
            loading={isProcessing}
          />
        </Card>

        {/* Submit Plates */}
        <Card variant="elevated" padding={4} style={styles.card}>
          <Text style={styles.sectionTitle}>Donate Plates</Text>
          <TouchableOpacity
            onPress={handleSubmitPlates}
            style={{ backgroundColor: colors.gold, padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>🍽️ Submit Plates</Text>
          </TouchableOpacity>
        </Card>
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
    marginBottom: spacing[4],
  },
  card: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    color: colors.ink[700],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[3],
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  toggleLabel: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
  },
  syncRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  syncLabel: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
  },
});
