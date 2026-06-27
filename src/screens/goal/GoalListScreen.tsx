import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getUserGoals, getActiveGoals, completeGoal, failGoal } from "../../api/goal";
import { Goal } from "../../db/schema";
import { useNavigation } from "@react-navigation/native";

export function GoalListScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadGoals();
  }, [user?.id]);

  const loadGoals = async () => {
    setLoading(true);
    const data = await getUserGoals(user!.id);
    setGoals(data);
    setLoading(false);
  };

  const handleComplete = async (goalId: string) => {
    await completeGoal(goalId);
    loadGoals();
  };

  const handleFail = async (goalId: string) => {
    await failGoal(goalId);
    loadGoals();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Goals</Text>
      {loading ? <ActivityIndicator color="#FFD700" /> : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, item.status === "completed" && styles.cardCompleted, item.status === "failed" && styles.cardFailed]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description || "No description"}</Text>
              <Text style={styles.cardMeta}>Stake: {item.stakeAmount} Plates | Status: {item.status}</Text>
              {item.status === "active" && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(item.id)}><Text style={styles.completeText}>Complete</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.failBtn} onPress={() => handleFail(item.id)}><Text style={styles.failText}>Fail</Text></TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No goals yet. Create one!</Text>}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateGoal" as never)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default GoalListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFD700", marginBottom: 16 },
  card: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#333" },
  cardCompleted: { borderColor: "#00aa00" },
  cardFailed: { borderColor: "#aa0000" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  cardDesc: { fontSize: 14, color: "#888", marginBottom: 8 },
  cardMeta: { fontSize: 12, color: "#FFD700" },
  actions: { flexDirection: "row", marginTop: 12, gap: 12 },
  completeBtn: { backgroundColor: "#00aa00", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  completeText: { color: "#fff", fontWeight: "bold" },
  failBtn: { backgroundColor: "#aa0000", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  failText: { color: "#fff", fontWeight: "bold" },
  empty: { color: "#666", textAlign: "center", marginTop: 32 },
  fab: { position: "absolute", right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFD700", justifyContent: "center", alignItems: "center" },
  fabText: { fontSize: 24, fontWeight: "bold", color: "#0a0a0a" },
});
