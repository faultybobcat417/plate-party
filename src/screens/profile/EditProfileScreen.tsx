import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUserStore } from "../../stores/useUserStore";
import { useNavigation } from "@react-navigation/native";

export function EditProfileScreen() {
  const { profile, userId } = useCurrentUser();
  const { updateProfile } = useUserStore();
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!userId) { Alert.alert("Error", "You must be signed in to edit your profile."); return; }
    if (!displayName.trim()) { Alert.alert("Error", "Display name is required."); return; }
    setLoading(true);
    try {
      await updateProfile(userId, { displayName: displayName.trim(), username: username.trim() || undefined });
      Alert.alert("Success", "Profile updated successfully.");
      navigation.goBack();
    } catch (error: any) { Alert.alert("Error", error.message || "Failed to update profile."); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.label}>Display Name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Enter display name" placeholderTextColor="#666" maxLength={50} />
      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Enter username" placeholderTextColor="#666" autoCapitalize="none" autoCorrect={false} maxLength={30} />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.buttonText}>Save Changes</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginBottom: 24 },
  label: { fontSize: 14, color: "#888", marginBottom: 8 },
  input: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 12, padding: 16, color: "#fff", fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#0a0a0a", fontSize: 16, fontWeight: "bold" },
});
