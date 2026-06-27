import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { createChallenge } from "../../api/challenge";
import { useNavigation } from "@react-navigation/native";

export function CreateChallengeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stake, setStake] = useState("1");
  const [reward, setReward] = useState("10");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user?.id) { Alert.alert("Error", "Please sign in first."); return; }
    if (!title.trim()) { Alert.alert("Error", "Title is required."); return; }
    setLoading(true);
    try {
      await createChallenge(user.id, title.trim(), description.trim() || null, parseInt(stake) || 1, parseInt(reward) || 10, "public");
      Alert.alert("Success", "Challenge created!");
      navigation.goBack();
    } catch (error: any) { Alert.alert("Error", error.message || "Failed to create challenge."); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Challenge</Text>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What is the challenge?" placeholderTextColor="#666" />
      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} placeholder="Rules, proof requirements, etc." placeholderTextColor="#666" multiline />
      <Text style={styles.label}>Stake (Plates)</Text>
      <TextInput style={styles.input} value={stake} onChangeText={setStake} keyboardType="numeric" placeholderTextColor="#666" />
      <Text style={styles.label}>Reward (Plates)</Text>
      <TextInput style={styles.input} value={reward} onChangeText={setReward} keyboardType="numeric" placeholderTextColor="#666" />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.buttonText}>Create Challenge</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default CreateChallengeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginBottom: 24 },
  label: { fontSize: 14, color: "#888", marginBottom: 8 },
  input: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 12, padding: 16, color: "#fff", fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#0a0a0a", fontSize: 16, fontWeight: "bold" },
});
