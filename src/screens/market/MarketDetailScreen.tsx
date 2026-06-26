import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native";
import { useMarketStore, type MarketDetail } from "../../stores/useMarketStore";
import { PriceBar } from "../../components/market/PriceBar";

type MarketDetailRouteProp = RouteProp<{ MarketDetail: { marketId: string } }, "MarketDetail">;

export function MarketDetailScreen() {
  const route = useRoute<MarketDetailRouteProp>();
  const navigation = useNavigation();
  const { marketId } = route.params;
  const { loadMarketDetails, addToWatchlist, removeFromWatchlist, watchlist } = useMarketStore();
  const [detail, setDetail] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await loadMarketDetails(marketId);
        setDetail(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [marketId]);

  const isWatchlisted = detail ? watchlist.includes(detail.id) : false;

  const toggleWatchlist = () => {
    if (!detail) return;
    if (isWatchlisted) {
      removeFromWatchlist(detail.id);
    } else {
      addToWatchlist(detail.id);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#34C759" />
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "#1A1A1A" }}>Market not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: detail.imageUrl }} style={styles.image} />
        <View style={styles.header}>
          <Text style={styles.title}>{detail.title}</Text>
          <Pressable onPress={toggleWatchlist} accessibilityRole="button">
            <Text style={{ fontSize: 28 }}>{isWatchlisted ? "⭐" : "☆"}</Text>
          </Pressable>
        </View>
        <Text style={styles.description}>{detail.description}</Text>

        <View style={styles.priceSection}>
          <PriceBar yesPrice={detail.yesPrice} noPrice={detail.noPrice} />
          <View style={styles.stats}>
            <Text style={styles.statText}>Volume: ${detail.volume.toLocaleString()}</Text>
            <Text style={styles.statText}>Liquidity: ${detail.liquidity.toLocaleString()}</Text>
            <Text style={styles.statText}>Ends: {detail.endDate ? new Date(detail.endDate).toLocaleDateString() : "No end date"}</Text>
          </View>
        </View>

        <Pressable
          style={styles.tradeButton}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Trade this market"
        >
          <Text style={styles.tradeText}>Trade</Text>
        </Pressable>

        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Markets</Text>
          {detail.relatedMarkets.map((m) => (
            <Pressable
              key={m.id}
              style={styles.relatedItem}
              onPress={() => (navigation.navigate as any)("MarketDetail", { marketId: m.id })}
            >
              <Text style={{ color: "#1A1A1A" }}>{m.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 16, paddingBottom: 40 },
  image: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: "800", color: "#1A1A1A", marginRight: 8 },
  description: { fontSize: 14, color: "#888", marginBottom: 16 },
  priceSection: { marginVertical: 16 },
  stats: { marginTop: 12, gap: 4 },
  statText: { color: "#888", fontSize: 13 },
  tradeButton: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 16,
  },
  tradeText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  relatedSection: { marginTop: 16 },
  relatedTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  relatedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 4,
  },
});
