import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useChallengeStore } from "../../stores/useChallengeStore";
import { useNavigation } from "@react-navigation/native";

export function ChallengeListScreen() {
  const { challenges, loading, fetchOpen } = useChallengeStore();
  const navigation = useNavigation();
  const navigate = navigation.navigate as (screen: string, params?: object) => void;

  useEffect(() => { fetchOpen(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Open Challenges</Text>
      {loading ? <ActivityIndicator color="#FFD700" /> : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigate("ChallengeDetail", { challengeId: item.id })}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description || "No description"}</Text>
              <Text style={styles.cardMeta}>Stake: {item.stakeAmount} Plates | Reward: {item.rewardAmount} Plates</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No open challenges right now.</Text>}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigate("CreateChallenge")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default ChallengeListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginBottom: 16 },
  card: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#333" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  cardDesc: { fontSize: 14, color: "#888", marginBottom: 8 },
  cardMeta: { fontSize: 12, color: "#FFD700" },
  empty: { color: "#666", textAlign: "center", marginTop: 32 },
  fab: { position: "absolute", right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFD700", justifyContent: "center", alignItems: "center" },
  fabText: { fontSize: 24, fontWeight: "bold", color: "#0a0a0a" },
});
