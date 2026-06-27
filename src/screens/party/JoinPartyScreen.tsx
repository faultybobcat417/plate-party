import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getPartyByInviteCode, joinParty } from "../../api/party";
import { useNavigation, useRoute } from "@react-navigation/native";

export function JoinPartyScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const navigate = navigation.navigate as (screen: string, params?: object) => void;
  const route = useRoute();
  const [code, setCode] = useState((route.params as any)?.inviteCode || "");
  const [loading, setLoading] = useState(false);
  const [party, setParty] = useState<any>(null);

  useEffect(() => {
    if (code) lookupParty();
  }, []);

  const lookupParty = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const found = await getPartyByInviteCode(code.trim().toUpperCase());
    setParty(found);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user?.id) { Alert.alert("Error", "Please sign in first."); return; }
    if (!party) return;
    setLoading(true);
    try {
      await joinParty(party.id, user.id);
      Alert.alert("Success", `You joined ${party.name}!`);
      navigate("PartyDetail", { partyId: party.id });
    } catch (error: any) { Alert.alert("Error", error.message || "Failed to join party."); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Party</Text>
      <Text style={styles.subtitle}>Enter an invite code or use a deep link</Text>
      <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="ABC123" placeholderTextColor="#666" autoCapitalize="characters" maxLength={6} />
      <TouchableOpacity style={styles.button} onPress={lookupParty} disabled={loading || !code.trim()}>
        <Text style={styles.buttonText}>Look Up Party</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color="#FFD700" style={{ marginTop: 16 }} />}

      {party && (
        <View style={styles.partyCard}>
          <Text style={styles.partyName}>{party.name}</Text>
          <Text style={styles.partyDesc}>{party.description || "No description"}</Text>
          <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={handleJoin} disabled={loading}>
            <Text style={styles.buttonText}>Join Party</Text>
          </TouchableOpacity>
        </View>
      )}

      {!party && !loading && code.length === 6 && (
        <Text style={styles.notFound}>Party not found. Check the code and try again.</Text>
      )}
    </View>
  );
}

export default JoinPartyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 24 },
  input: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 12, padding: 16, color: "#fff", fontSize: 18, marginBottom: 16, textAlign: "center", letterSpacing: 4 },
  button: { backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#0a0a0a", fontSize: 16, fontWeight: "bold" },
  partyCard: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: "#333" },
  partyName: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  partyDesc: { fontSize: 14, color: "#888" },
  notFound: { color: "#ff4444", textAlign: "center", marginTop: 16 },
});
