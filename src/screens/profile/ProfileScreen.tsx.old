import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUserStore } from "../../stores/useUserStore";
import { useNavigation } from "@react-navigation/native";

export function ProfileScreen() {
  const { profile, loading, refreshProfile } = useCurrentUser();
  const navigation = useNavigation();

  useEffect(() => {
    refreshProfile();
  }, []);

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

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.plates}</Text>
          <Text style={styles.statLabel}>Plates</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.lifetimePurchasedPlates}</Text>
          <Text style={styles.statLabel}>Purchased</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("EditProfile" as never)}
        >
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Settings" as never)}
        >
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Ledger" as never)}
        >
          <Text style={styles.menuText}>Transaction History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    alignItems: "center",
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0a0a0a",
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: "#888",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  menuText: {
    fontSize: 16,
    color: "#fff",
  },
  loadingText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
});
