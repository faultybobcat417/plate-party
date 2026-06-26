import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface StakePost {
  id: string;
  userId: string;
  userName: string;
  title: string;
  stake: number;
  entries: number;
  totalPlates: number;
  createdAt: string;
  expiresAt: string;
}

export function SteakFeedList() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<StakePost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    const demoPosts: StakePost[] = [
      { id: "1", userId: "u1", userName: "Alex", title: "Run 5K this week", stake: 50, entries: 3, totalPlates: 150, createdAt: "2026-06-24", expiresAt: "2026-07-01" },
      { id: "2", userId: "u2", userName: "Sam", title: "Read 1 book this month", stake: 100, entries: 1, totalPlates: 100, createdAt: "2026-06-23", expiresAt: "2026-07-23" },
      { id: "3", userId: "u3", userName: "Jordan", title: "No soda for 7 days", stake: 25, entries: 5, totalPlates: 125, createdAt: "2026-06-22", expiresAt: "2026-06-29" },
      { id: "4", userId: "u4", userName: "Casey", title: "Meditate 10 min daily", stake: 75, entries: 2, totalPlates: 150, createdAt: "2026-06-21", expiresAt: "2026-06-28" },
      { id: "5", userId: "u5", userName: "Taylor", title: "Gym 3x this week", stake: 60, entries: 4, totalPlates: 240, createdAt: "2026-06-20", expiresAt: "2026-06-27" },
    ];
    setPosts(demoPosts);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleAttempt = (item: StakePost) => {
    (navigation as any).navigate("EnterStake", {
      stakeId: item.id,
      title: item.title,
      creator: item.userName,
    });
  };

  const renderItem = ({ item }: { item: StakePost }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.avatar}>👤</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.time}>{item.createdAt}</Text>
        </View>
        <View style={styles.stakeBadge}>
          <Text style={styles.stakeText}>🍽️ {item.stake}</Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.footer}>
        <Text style={styles.entries}>{item.entries} entries</Text>
        <Text style={styles.total}>{item.totalPlates} plates total</Text>
        <Pressable
          style={styles.joinBtn}
          onPress={() => handleAttempt(item)}
          accessibilityRole="button"
          accessibilityLabel={`Attempt stake ${item.title}`}
        >
          <Text style={styles.attemptText}>Attempt</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🥩</Text>
          <Text style={styles.emptyTitle}>No stakes yet</Text>
          <Text style={styles.emptySub}>Be the first to create a stake!</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: { fontSize: 32, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  time: { fontSize: 12, color: "#888", marginTop: 2 },
  stakeBadge: {
    backgroundColor: "#F0FFF0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stakeText: { fontSize: 14, fontWeight: "700", color: "#34C759" },
  title: { fontSize: 18, fontWeight: "600", color: "#1A1A1A", marginBottom: 12 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entries: { fontSize: 13, color: "#888" },
  total: { fontSize: 13, color: "#888" },
  joinBtn: {
    backgroundColor: "#34C759",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attemptText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  emptySub: { fontSize: 14, color: "#888", marginTop: 4 },
});
