import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";
import type { ProfileStackParamList } from "../../navigation/types";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const { profile, loading, refreshProfile } = useCurrentUser();
  const navigation = useNavigation<ProfileNav>();

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

  if (!profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No profile found. Please sign in.</Text>
      </View>
    );
  }

  const winRate =
    (profile as any).totalWins && (profile as any).totalLosses
      ? Math.round(((profile as any).totalWins / ((profile as any).totalWins + (profile as any).totalLosses)) * 100)
      : 0;

  const stats = [
    { label: "Plates", value: profile.plates ?? 0 },
    { label: "Won", value: (profile as any).totalWins ?? 0 },
    { label: "Donated", value: profile.totalGiven ?? 0 },
    { label: "Streak", value: (profile as any).currentStreak ?? 0 },
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
});
