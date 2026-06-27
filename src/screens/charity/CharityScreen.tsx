import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { MOCK_CHARITIES, donatePlates } from "../../api/charity";
import { Charity } from "../../api/charity";

export function CharityScreen() {
  const { user } = useAuth();
  const { profile, refreshProfile } = useCurrentUser();
  const [selected, setSelected] = useState<Charity | null>(null);
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!user?.id || !selected) return;
    if (!profile || profile.lifetimePurchasedPlates < amount) {
      Alert.alert("Error", "You can only donate purchased plates. Buy more plates first.");
      return;
    }
    if (profile.plates < amount) {
      Alert.alert("Error", "Insufficient plate balance.");
      return;
    }
    setLoading(true);
    try {
      await donatePlates(user.id, selected, amount);
      Alert.alert("Thank You!", `Your ${amount} plate donation to ${selected.name} is being processed.`);
      refreshProfile();
      setSelected(null);
    } catch (error: any) { Alert.alert("Error", error.message || "Donation failed."); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donate to Charity</Text>
      <Text style={styles.subtitle}>1 Plate = $1 USD. Only purchased plates can be donated.</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available to Donate</Text>
        <Text style={styles.balanceValue}>{profile?.lifetimePurchasedPlates ?? 0} Purchased Plates</Text>
      </View>

      {selected ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Donate to {selected.name}</Text>
          <Text style={styles.confirmDesc}>{selected.description}</Text>
          <View style={styles.amountRow}>
            <TouchableOpacity onPress={() => setAmount(Math.max(1, amount - 1))}><Text style={styles.amountBtn}>-</Text></TouchableOpacity>
            <Text style={styles.amountText}>{amount} Plates</Text>
            <TouchableOpacity onPress={() => setAmount(amount + 1)}><Text style={styles.amountBtn}>+</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.donateButton, loading && styles.disabled]} onPress={handleDonate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.donateButtonText}>Confirm Donation</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={MOCK_CHARITIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.charityCard} onPress={() => setSelected(item)}>
              <Text style={styles.charityName}>{item.name}</Text>
              <Text style={styles.charityDesc}>{item.description}</Text>
              <Text style={styles.charityCategory}>{item.category}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

export default CharityScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 16 },
  balanceCard: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#333", alignItems: "center" },
  balanceLabel: { fontSize: 14, color: "#888" },
  balanceValue: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginTop: 4 },
  charityCard: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#333" },
  charityName: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  charityDesc: { fontSize: 14, color: "#888", marginBottom: 4 },
  charityCategory: { fontSize: 12, color: "#FFD700" },
  confirmCard: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 24, borderWidth: 2, borderColor: "#FFD700" },
  confirmTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  confirmDesc: { fontSize: 14, color: "#888", marginBottom: 16 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24, gap: 24 },
  amountBtn: { fontSize: 24, fontWeight: "bold", color: "#FFD700", padding: 8 },
  amountText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  donateButton: { backgroundColor: "#00aa00", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  donateButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  disabled: { opacity: 0.6 },
  cancelText: { color: "#888", textAlign: "center", marginTop: 16 },
});
