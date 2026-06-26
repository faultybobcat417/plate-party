import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useGiverStore } from "../../stores/useGiverStore";
import { OrgWidgetsGrid } from "../../components/profile/OrgWidgetsGrid";

interface GiverEntry {
  userId: string;
  userName: string;
  avatar: string;
  platesGiven: number;
  rank: number;
}

export function GiverLeaderboardScreen() {
  const navigation = useNavigation();
  const { topGivers, loadTopGivers, isLoading } = useGiverStore();

  useEffect(() => {
    loadTopGivers();
  }, []);

  const topThree = topGivers.slice(0, 3);
  const rest = topGivers.slice(3, 10);

  const renderPodium = () => {
    if (topThree.length < 3) return null;
    const [first, second, third] = topThree;

    return (
      <View style={styles.podiumContainer}>
        <View style={[styles.podiumItem, styles.podiumLeft]}>
          <View style={styles.podiumAvatarWrapper}>
            <Image source={{ uri: second.avatar }} style={styles.avatar} />
            <Text style={styles.podiumRank}>🥈</Text>
          </View>
          <Text style={styles.podiumName}>{second.userName}</Text>
          <Text style={styles.plateCount}>{second.platesGiven} plates</Text>
          <View style={[styles.podiumBase, { height: 60 }]} />
        </View>

        <View style={[styles.podiumItem, styles.podiumCenter]}>
          <View style={styles.podiumAvatarWrapper}>
            <Image source={{ uri: first.avatar }} style={[styles.avatar, styles.avatarGold]} />
            <Text style={styles.podiumRank}>👑</Text>
          </View>
          <Text style={[styles.podiumName, { fontWeight: "800" }]}>{first.userName}</Text>
          <Text style={styles.plateCount}>{first.platesGiven} plates</Text>
          <View style={[styles.podiumBase, { height: 80, backgroundColor: "#FFD700" }]} />
        </View>

        <View style={[styles.podiumItem, styles.podiumRight]}>
          <View style={styles.podiumAvatarWrapper}>
            <Image source={{ uri: third.avatar }} style={styles.avatar} />
            <Text style={styles.podiumRank}>🥉</Text>
          </View>
          <Text style={styles.podiumName}>{third.userName}</Text>
          <Text style={styles.plateCount}>{third.platesGiven} plates</Text>
          <View style={[styles.podiumBase, { height: 40 }]} />
        </View>
      </View>
    );
  };

  const renderListItem = ({ item, index }: { item: GiverEntry; index: number }) => {
    const rank = index + 4;
    return (
      <View style={styles.listItem}>
        <Text style={styles.rankNumber}>{rank}</Text>
        <Image source={{ uri: item.avatar }} style={styles.listAvatar} />
        <Text style={styles.listName}>{item.userName}</Text>
        <Text style={styles.listPlates}>{item.platesGiven} plates</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </Pressable>
          <Text style={styles.title}>🏆 Top Givers Today</Text>
        </View>

        {isLoading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : (
          <>
            {renderPodium()}

            <FlatList
              data={rest}
              renderItem={renderListItem}
              keyExtractor={(item) => item.userId}
              scrollEnabled={false}
              contentContainerStyle={styles.list}
            />

            <View style={styles.orgSection}>
              <Text style={styles.orgTitle}>🌍 Support Causes</Text>
              <OrgWidgetsGrid />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scroll: { padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#1A1A1A" },
  loading: { textAlign: "center", color: "#888", marginTop: 40 },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 260,
    marginBottom: 24,
  },
  podiumItem: { alignItems: "center", flex: 1 },
  podiumLeft: { marginRight: 8 },
  podiumCenter: { marginHorizontal: 8 },
  podiumRight: { marginLeft: 8 },
  podiumAvatarWrapper: { position: "relative", marginBottom: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: "#ccc" },
  avatarGold: { borderColor: "#FFD700", borderWidth: 3 },
  podiumRank: { fontSize: 24, position: "absolute", bottom: -8, right: -8 },
  podiumName: { fontSize: 14, fontWeight: "600", marginTop: 4, color: "#1A1A1A" },
  plateCount: { fontSize: 12, color: "#888" },
  podiumBase: { width: 60, backgroundColor: "#E0E0E0", borderRadius: 4, marginTop: 8 },
  list: { paddingBottom: 20 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  rankNumber: { width: 30, fontSize: 14, fontWeight: "700", color: "#888" },
  listAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  listName: { flex: 1, fontSize: 16, color: "#1A1A1A" },
  listPlates: { fontSize: 14, fontWeight: "600", color: "#34C759" },
  orgSection: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderColor: "#E0E0E0" },
  orgTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A", marginBottom: 12 },
});
