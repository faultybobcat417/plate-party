import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function MarketHome() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Markets Removed</Text>
      <Text style={styles.subtitle}>Prediction markets have been removed from Plate Party.{"
"}Focus on Challenges, Games, and Parties instead.</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Play" as never)}><Text style={styles.buttonText}>Go to Play</Text></TouchableOpacity>
    </View>
  );
}

export default MarketHome;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginBottom: 12 },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 32, lineHeight: 20 },
  button: { backgroundColor: "#FFD700", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  buttonText: { color: "#0a0a0a", fontSize: 16, fontWeight: "bold" },
});
