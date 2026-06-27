import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getUserProfile } from "../../utils/profileStorage";
import { colors, typography, spacing } from "../../theme";
import type { ProfileStackParamList } from "../../navigation/types";

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const { profile: authProfile, refreshProfile } = useCurrentUser();
  const [localProfile, setLocalProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<ProfileNav>();

  useEffect(() => {
    async function load() {
      setLoading(true);
      refreshProfile();
      const local = await getUserProfile();
      setLocalProfile(local);
      setLoading(false);
    }
    load();
  }, []);

  const profile = authProfile || localProfile;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No profile found. Please sign in.</Text>
      </View>
    );
  }

  const menuItems = [
    { label: "Edit Profile", route: "EditProfile" as const },
    { label: "Settings", route: "Settings" as const },
    { label: "Transaction History", route: "ActivityHistory" as const },
    { label: "Giver Leaderboard", route: "GiverLeaderboard" as const },
    { label: "Charity Settings", route: "CharitySettings" as const },
    { label: "Buy Plates", route: "PlateStore" as const },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: profile.avatarColor || colors.glaze[500] }]}>
              <Text style={styles.avatarText}>
                {(profile.displayName || profile.username || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.displayName}>{profile.displayName || "Plate User"}</Text>
        <Text style={styles.username}>@{profile.username || "user"}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.plates || 0}</Text>
          <Text style={styles.statLabel}>Plates</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.lifetimePurchasedPlates || 0}</Text>
          <Text style={styles.statLabel}>Purchased</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.platesDonated || 0}</Text>
          <Text style={styles.statLabel}>Donated</Text>
        </View>
      </View>

      <View style={styles.section}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={styles.menuText}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  header: { alignItems: "center", padding: spacing[7], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  avatarContainer: { marginBottom: spacing[4] },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 36, fontWeight: typography.weights.bold, color: colors.ink[900] },
  displayName: { fontSize: 24, fontWeight: typography.weights.bold, color: colors.ash[100], marginBottom: 4 },
  username: { fontSize: 16, color: colors.ash[400] },
  statsContainer: { flexDirection: "row", justifyContent: "space-around", padding: spacing[6], borderBottomWidth: 1, borderBottomColor: colors.ink[700] },
  statBox: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 28, fontWeight: typography.weights.bold, color: colors.glaze[500] },
  statLabel: { fontSize: 14, color: colors.ash[400], marginTop: 4 },
  section: { padding: spacing[4] },
  menuItem: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    padding: spacing[4], 
    borderBottomWidth: 1, 
    borderBottomColor: colors.ink[700] 
  },
  menuText: { fontSize: 16, color: colors.ash[100] },
  chevron: { fontSize: 18, color: colors.ash[400] },
  loadingText: { color: colors.ash[400], fontSize: 16, textAlign: "center", marginTop: 32 },
  errorText: { color: colors.glaze[500], fontSize: 16, textAlign: "center", marginTop: 32 },
});
