import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { usePartyStore } from "../../stores/usePartyStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { EmptyState } from "../../components/EmptyState";

export function PartyListScreen() {
  const { userId } = useCurrentUser();
  const { parties, leaveParty } = usePartyStore();

  const myParties = parties.map((p) => p.party);

  if (myParties.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          emoji="🎭"
          title="No Parties Yet"
          message="Join a party with an invite code or create your own."
          actionLabel="Join Party"
          onAction={() => {}}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={myParties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>👥 members</Text>
            <Text style={styles.detail}>🍽️ plates in pool</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.enterBtn}>
                <Text style={styles.enterText}>Enter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={() => {
                  if (userId) leaveParty(item.id, userId, "unknown");
                }}
              >
                <Text style={styles.leaveText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.joinBtn}>
        <Text style={styles.joinBtnText}>+ Join Party</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: "700" },
  detail: { fontSize: 14, color: "#888", marginTop: 2 },
  actions: { flexDirection: "row", marginTop: 12, gap: 12 },
  enterBtn: { backgroundColor: "#34C759", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  enterText: { color: "#FFF", fontWeight: "600" },
  leaveBtn: { backgroundColor: "#F0F0F0", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  leaveText: { color: "#FF3B30", fontWeight: "600" },
  joinBtn: {
    backgroundColor: "#34C759",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  joinBtnText: { color: "#FFF", fontWeight: "700", fontSize: 18 },
});
