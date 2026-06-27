import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export function SettingsScreen() {
  const { signOut, user } = useAuth();
  const navigation = useNavigation();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); } },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate("EditProfile" as never)}>
        <Text style={styles.itemText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate("PlateStore" as never)}>
        <Text style={styles.itemText}>Buy Plates</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL("https://plateparty.app/privacy")}>
        <Text style={styles.itemText}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL("https://plateparty.app/terms")}>
        <Text style={styles.itemText}>Terms of Service</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL("https://plateparty.app/support")}>
        <Text style={styles.itemText}>Support</Text>
      </TouchableOpacity>
      <View style={styles.spacer} />
      {user && (
        <TouchableOpacity style={[styles.item, styles.danger]} onPress={handleSignOut}>
          <Text style={styles.dangerText}>Sign Out</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.version}>Plate Party v1.0.0</Text>
    </ScrollView>
  );
}

export default SettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", padding: 24, paddingBottom: 16 },
  item: { padding: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#222" },
  itemText: { fontSize: 16, color: "#fff" },
  spacer: { height: 32 },
  danger: { backgroundColor: "#1a0505" },
  dangerText: { fontSize: 16, color: "#ff4444" },
  version: { textAlign: "center", color: "#666", fontSize: 12, marginVertical: 24 },
});
