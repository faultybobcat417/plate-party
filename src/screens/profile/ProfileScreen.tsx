import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";
import type { ProfileStackParamList } from "../../navigation/types";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { AuthModal } from "../../components/auth/AuthModal";

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList>;
type ProfileStats = {
  totalWins?: number;
  totalLosses?: number;
  currentStreak?: number;
};

export function ProfileScreen() {
  const { profile, loading, refreshProfile, isAnonymous } = useCurrentUser();
  const navigation = useNavigation<ProfileNav>();
  const [authVisible, setAuthVisible] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile || isAnonymous) {
    return (
      <ErrorBoundary>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <Text style={styles.displayName}>Guest User</Text>
            <Text style={styles.username}>Play for fun. Sign in to save progress.</Text>
          </View>

          <View style={styles.guestPanel}>
            <Text style={styles.guestTitle}>Sign in to save your progress</Text>
            <Text style={styles.guestCopy}>
              Keep your plates, join parties, create challenges, and track your giving history.
            </Text>
            <ButtonLike label="Sign In" onPress={() => setAuthVisible(true)} />
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Settings")}
              style={styles.secondaryAction}
            >
              <Text style={styles.secondaryActionText}>Settings</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </ScrollView>
        <AuthModal
          visible={authVisible}
          reason="Sign in to save your profile, plates, and party memberships."
          onClose={() => setAuthVisible(false)}
          onSignedIn={() => {
            setAuthVisible(false);
            refreshProfile();
          }}
        />
      </ErrorBoundary>
    );
  }

  const profileStats = profile as typeof profile & ProfileStats;
  const winRate =
    profileStats.totalWins && profileStats.totalLosses
      ? Math.round((profileStats.totalWins / (profileStats.totalWins + profileStats.totalLosses)) * 100)
      : 0;

  const stats = [
    { label: "Plates", value: profile.plates ?? 0 },
    { label: "Won", value: profileStats.totalWins ?? 0 },
    { label: "Donated", value: profile.totalGiven ?? 0 },
    { label: "Streak", value: profileStats.currentStreak ?? 0 },
    { label: "Win Rate", value: `${winRate}%` },
  ];

  const menuItems = [
    { label: "Edit Profile", route: "EditProfile" as const },
    { label: "Settings", route: "Settings" as const },
    { label: "Activity History", route: "ActivityHistory" as const },
    { label: "Giver Leaderboard", route: "GiverLeaderboard" as const },
    { label: "Charity Settings", route: "CharitySettings" as const },
    { label: "Buy Plates", route: "PlateStore" as const },
  ];

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(profile.displayName || profile.username || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{profile.displayName || "Plate User"}</Text>
          <Text style={styles.username}>@{profile.username || "user"}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

function ButtonLike({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.primaryAction}>
      <Text style={styles.primaryActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  center: { justifyContent: "center", alignItems: "center" },
  scroll: { paddingBottom: spacing[8] },
  header: { alignItems: "center", padding: spacing[7], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  avatarContainer: { marginBottom: spacing[4] },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.glaze[600] },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.glaze[600], justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 28, fontWeight: typography.weights.bold, color: colors.white },
  displayName: { fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[1] },
  username: { fontSize: typography.sizes.base, color: colors.ash[400] },
  bio: { fontSize: typography.sizes.sm, color: colors.ash[400], textAlign: "center", marginTop: spacing[2], maxWidth: 280 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: spacing[5], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  statBox: { width: "20%", alignItems: "center", paddingVertical: spacing[3] },
  statValue: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.glaze[600] },
  statLabel: { fontSize: typography.sizes.xs, color: colors.ash[400], marginTop: spacing[1] },
  menuSection: { padding: spacing[4] },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  menuText: { fontSize: typography.sizes.base, color: colors.ash[100] },
  chevron: { fontSize: typography.sizes.lg, color: colors.ash[500] },
  loadingText: { color: colors.ash[400], fontSize: typography.sizes.base, textAlign: "center", marginTop: spacing[8] },
  errorText: { color: colors.wine[400], fontSize: typography.sizes.base, textAlign: "center", marginTop: spacing[8] },
  guestPanel: { gap: spacing[4], padding: spacing[5] },
  guestTitle: { color: colors.white, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  guestCopy: { color: colors.ash[400], fontSize: typography.sizes.base, lineHeight: typography.lineHeights.md },
  primaryAction: { alignItems: "center", backgroundColor: colors.glaze[600], borderRadius: 12, paddingVertical: spacing[4] },
  primaryActionText: { color: colors.white, fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
  secondaryAction: { alignItems: "center", borderBottomColor: colors.ink[700], borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing[4] },
  secondaryActionText: { color: colors.ash[100], fontSize: typography.sizes.base },
});
