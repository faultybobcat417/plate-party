import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMarketStore, type Market } from "../../stores/useMarketStore";
import { PriceBar } from "./PriceBar";

interface MarketCardProps {
  market: Market;
  featured?: boolean;
  compact?: boolean;
}

export function MarketCard({ market, featured = false, compact = false }: MarketCardProps) {
  const navigation = useNavigation();

  const handlePress = () => {
    (navigation.navigate as any)("MarketDetail", { marketId: market.id });
  };

  if (compact) {
    return (
      <Pressable
        style={[styles.compactContainer, { width: 280 }]}
        onPress={handlePress}
      >
        <Image source={{ uri: market.imageUrl }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>{market.title}</Text>
          <PriceBar yesPrice={market.yesPrice} noPrice={market.noPrice} small />
          <Text style={styles.compactVol}>Vol: ${market.volume.toLocaleString()}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.container, { padding: featured ? 16 : 12 }]}
      onPress={handlePress}
    >
      <Image
        source={{ uri: market.imageUrl }}
        style={[styles.image, featured && styles.featuredImage]}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{market.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{market.category}</Text>
          <Text style={styles.metaText}>Ends {market.endDate ? new Date(market.endDate).toLocaleDateString() : "No end date"}</Text>
        </View>
        <PriceBar yesPrice={market.yesPrice} noPrice={market.noPrice} />
        <View style={styles.stats}>
          <Text style={styles.statText}>Vol: ${market.volume.toLocaleString()}</Text>
          <Text style={styles.statText}>Liq: ${(market as any).liquidity?.toLocaleString() ?? "0"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: 120 },
  featuredImage: { height: 180 },
  content: { padding: 12 },
  title: { fontSize: 16, fontWeight: "600", color: "#1A1A1A", marginBottom: 4 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  metaText: { color: "#888", fontSize: 12 },
  stats: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  statText: { color: "#888", fontSize: 12 },
  compactContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 8,
    padding: 10,
    alignItems: "center",
    marginRight: 12,
  },
  compactImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  compactContent: { flex: 1 },
  compactTitle: { fontSize: 14, fontWeight: "500", color: "#1A1A1A", marginBottom: 2 },
  compactVol: { color: "#888", fontSize: 11, marginTop: 2 },
});
