import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useChallengeStore } from "../../stores/useChallengeStore";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography } from "../../theme";

export function ChallengeListScreen() {
  const { challenges, loading, fetchOpen } = useChallengeStore();
  const navigation = useNavigation();
  const navigate = navigation.navigate as (screen: string, params?: object) => void;

  useEffect(() => {
    fetchOpen();
  }, [fetchOpen]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Open Challenges</Text>
      {loading ? <ActivityIndicator color={colors.gold} /> : (
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
  container: { flex: 1, backgroundColor: colors.ink[900], padding: spacing[4] },
  title: { fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, color: colors.gold, marginBottom: spacing[4] },
  card: { backgroundColor: colors.ink[800], borderRadius: 8, padding: spacing[4], marginBottom: spacing[3], borderWidth: 1, borderColor: colors.ink[700] },
  cardTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[1] },
  cardDesc: { fontSize: typography.sizes.base, color: colors.ash[400], marginBottom: spacing[2] },
  cardMeta: { fontSize: typography.sizes.sm, color: colors.gold },
  empty: { color: colors.ash[500], textAlign: "center", marginTop: spacing[7] },
  fab: { position: "absolute", right: spacing[6], bottom: spacing[6], width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold, justifyContent: "center", alignItems: "center" },
  fabText: { fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, color: colors.ink[900] },
});
