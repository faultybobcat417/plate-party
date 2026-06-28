import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUserStore } from "../../stores/useUserStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { colors, spacing, typography } from "../../theme";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { Button } from "../../components/primitives/Button";

const RESPONSIBLE_GAMING_KEY = "plate-party-responsible-gaming-ack";
const AGE_VERIFIED_KEY = "plate-party-age-verified";
const GDPR_CONSENT_KEY = "plate-party-gdpr-consent";
const SELF_EXCLUSION_KEY = "plate-party-self-exclusion";
const DAILY_LIMIT_KEY = "plate-party-daily-limit";
const WEEKLY_LIMIT_KEY = "plate-party-weekly-limit";

export function SettingsScreen() {
  const { profile, userId } = useCurrentUser();
  const { deleteProfile } = useUserStore();
  const { preferences, updatePreferences } = useNotificationStore();

  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [gdprConsent, setGdprConsent] = useState<boolean | null>(null);
  const [selfExclusion, setSelfExclusion] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<string>("");
  const [weeklyLimit, setWeeklyLimit] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const [haptics, notifications, age, gdpr, exclusion, daily, weekly] = await Promise.all([
        AsyncStorage.getItem("plate-party-settings-haptics-enabled"),
        AsyncStorage.getItem("plate-party-settings-notifications-enabled"),
        AsyncStorage.getItem(AGE_VERIFIED_KEY),
        AsyncStorage.getItem(GDPR_CONSENT_KEY),
        AsyncStorage.getItem(SELF_EXCLUSION_KEY),
        AsyncStorage.getItem(DAILY_LIMIT_KEY),
        AsyncStorage.getItem(WEEKLY_LIMIT_KEY),
      ]);
      setHapticsEnabled(haptics !== "false");
      setNotificationsEnabled(notifications !== "false");
      setAgeVerified(age === "true");
      setGdprConsent(gdpr === "true" ? true : gdpr === "false" ? false : null);
      setSelfExclusion(exclusion === "true");
      setDailyLimit(daily ?? "");
      setWeeklyLimit(weekly ?? "");
    })();
  }, []);

  const toggleHaptics = async (value: boolean) => {
    setHapticsEnabled(value);
    await AsyncStorage.setItem("plate-party-settings-haptics-enabled", String(value));
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem("plate-party-settings-notifications-enabled", String(value));
  };

  const toggleSelfExclusion = async (value: boolean) => {
    setSelfExclusion(value);
    await AsyncStorage.setItem(SELF_EXCLUSION_KEY, String(value));
    if (value) {
      Alert.alert("Self-Exclusion Enabled", "You will not be able to wager until you disable this in Settings.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will soft-delete your account. You can recover it within 30 days by contacting support.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;
            try {
              await deleteProfile(userId);
              Alert.alert("Account Deleted", "Your account has been scheduled for deletion.");
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  const renderToggle = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
    description?: string,
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.ink[700], true: colors.glaze[500] }}
        thumbColor={colors.white}
      />
    </View>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Settings</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            {renderToggle("Haptics", hapticsEnabled, toggleHaptics)}
            {renderToggle("Push Notifications", notificationsEnabled, toggleNotifications)}
            {renderToggle(
              "Challenge Results",
              preferences.challengeResults,
              (v) => updatePreferences({ challengeResults: v }),
            )}
            {renderToggle(
              "Game Invites",
              preferences.gameInvites,
              (v) => updatePreferences({ gameInvites: v }),
            )}
            {renderToggle(
              "Party Invites",
              preferences.partyInvites,
              (v) => updatePreferences({ partyInvites: v }),
            )}
            {renderToggle(
              "Streak Reminders",
              preferences.streakReminders,
              (v) => updatePreferences({ streakReminders: v }),
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Responsible Gaming</Text>
            {renderToggle(
              "Self-Exclusion",
              selfExclusion,
              toggleSelfExclusion,
              "Disables all wagering until turned off.",
            )}
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Daily Plate Limit</Text>
              <Pressable
                onPress={() => {
                  Alert.alert("Daily Limit", "Enter daily plate spending limit:", [
                    { text: "10", onPress: () => setDailyLimit("10") },
                    { text: "50", onPress: () => setDailyLimit("50") },
                    { text: "100", onPress: () => setDailyLimit("100") },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
                style={styles.limitValue}
              >
                <Text style={styles.limitValueText}>{dailyLimit || "None"}</Text>
              </Pressable>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Weekly Plate Limit</Text>
              <Pressable
                onPress={() => {
                  Alert.alert("Weekly Limit", "Enter weekly plate spending limit:", [
                    { text: "100", onPress: () => setWeeklyLimit("100") },
                    { text: "500", onPress: () => setWeeklyLimit("500") },
                    { text: "1000", onPress: () => setWeeklyLimit("1000") },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
                style={styles.limitValue}
              >
                <Text style={styles.limitValueText}>{weeklyLimit || "None"}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compliance</Text>
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>Age Verified</Text>
              <Text style={[styles.complianceValue, ageVerified ? styles.complianceOk : styles.compliancePending]}>
                {ageVerified ? "Yes" : "No"}
              </Text>
            </View>
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>Privacy Consent</Text>
              <Text style={[styles.complianceValue, gdprConsent === true ? styles.complianceOk : styles.compliancePending]}>
                {gdprConsent === true ? "Granted" : gdprConsent === false ? "Declined" : "Pending"}
              </Text>
            </View>
          </View>

          <View style={styles.dangerSection}>
            <Button title="Delete Account" onPress={handleDeleteAccount} variant="danger" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  scroll: { padding: spacing[6], paddingBottom: spacing[10] },
  title: { fontSize: typography.sizes["3xl"], fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[6] },
  section: { marginBottom: spacing[6], backgroundColor: colors.ink[800], borderRadius: 16, padding: spacing[5], borderWidth: 1, borderColor: colors.ink[700] },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[4] },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  toggleText: { flex: 1, paddingRight: spacing[4] },
  toggleLabel: { fontSize: typography.sizes.base, color: colors.ash[200], fontWeight: typography.weights.medium },
  toggleDesc: { fontSize: typography.sizes.xs, color: colors.ash[500], marginTop: spacing[1] },
  limitRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  limitLabel: { fontSize: typography.sizes.base, color: colors.ash[200] },
  limitValue: { backgroundColor: colors.ink[800], paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: 8 },
  limitValueText: { color: colors.glaze[500], fontWeight: typography.weights.semibold },
  complianceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  complianceLabel: { fontSize: typography.sizes.base, color: colors.ash[200] },
  complianceValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  complianceOk: { color: colors.win },
  compliancePending: { color: colors.ash[500] },
  dangerSection: { marginTop: spacing[4] },
});
