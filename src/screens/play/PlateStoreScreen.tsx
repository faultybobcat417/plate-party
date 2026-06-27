import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useIAP } from "../../hooks/useIAP";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export function PlateStoreScreen() {
  const { package: pkg, loading, purchasing, error, buyPlates, restore } = useIAP();
  const { profile, refreshProfile } = useCurrentUser();

  const handleBuy = async () => {
    const success = await buyPlates();
    if (success) { Alert.alert("Success", "10 Plates added to your account!"); refreshProfile(); }
  };

  const handleRestore = async () => {
    const restored = await restore();
    Alert.alert(restored ? "Restored" : "Nothing to Restore", restored ? "Your purchases have been restored." : "No previous purchases found.");
    if (restored) refreshProfile();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plate Store</Text>
      <Text style={styles.subtitle}>1 Plate = $1 USD</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>{profile?.plates ?? 0} Plates</Text>
      </View>
      <View style={styles.productCard}>
        <Text style={styles.productName}>10 Plates Pack</Text>
        <Text style={styles.productPrice}>$10.00</Text>
        <Text style={styles.productDesc}>Best value for getting started</Text>
        {loading ? <ActivityIndicator color="#FFD700" style={styles.loader} /> : (
          <TouchableOpacity style={[styles.buyButton, purchasing && styles.buyButtonDisabled]} onPress={handleBuy} disabled={purchasing || !pkg}>
            <Text style={styles.buyButtonText}>{purchasing ? "Processing..." : "Buy 10 Plates"}</Text>
          </TouchableOpacity>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      <TouchableOpacity style={styles.restoreLink} onPress={handleRestore}><Text style={styles.restoreText}>Restore Purchases</Text></TouchableOpacity>
      <Text style={styles.legalText}>Plates are virtual currency for entertainment purposes only.{"\n"}They cannot be exchanged for real money or transferred outside the app.</Text>
    </View>
  );
}

export default PlateStoreScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFD700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 24 },
  balanceCard: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: "#333" },
  balanceLabel: { fontSize: 14, color: "#888", marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: "bold", color: "#FFD700" },
  productCard: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 24, borderWidth: 2, borderColor: "#FFD700", marginBottom: 16 },
  productName: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  productPrice: { fontSize: 28, fontWeight: "bold", color: "#FFD700", marginBottom: 8 },
  productDesc: { fontSize: 14, color: "#888", marginBottom: 16 },
  buyButton: { backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buyButtonDisabled: { opacity: 0.6 },
  buyButtonText: { color: "#0a0a0a", fontSize: 16, fontWeight: "bold" },
  loader: { marginVertical: 16 },
  errorText: { color: "#ff4444", fontSize: 14, marginTop: 12, textAlign: "center" },
  restoreLink: { alignItems: "center", marginBottom: 24 },
  restoreText: { color: "#FFD700", fontSize: 14 },
  legalText: { fontSize: 12, color: "#666", textAlign: "center", lineHeight: 18 },
});
