import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  SafeAreaView,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { useMarketStore } from "../../stores/useMarketStore";
import { useNavigation } from "@react-navigation/native";
import { MarketCard } from "../../components/market/MarketCard";
import { MarketCategoryPill } from "../../components/market/MarketCategoryPill";

const categories = ["All", "Crypto", "Politics", "Sports", "Science", "Economy", "Entertainment"];

export function MarketHomeScreen() {
  const navigation = useNavigation();
  const { markets, watchlist, loadMarkets, isLoading } = useMarketStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMarkets();
  }, []);

  const filteredMarkets = markets.filter((m) => {
    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredMarket = markets.length > 0 ? markets[0] : null;
  const trendingMarkets = markets.slice(1, 5);
  const watchlistMarkets = markets.filter((m) => watchlist.includes(m.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Markets</Text>
        <Pressable
          onPress={() => (navigation as any).navigate("Watchlist")}
          accessibilityRole="button"
          accessibilityLabel="Go to Watchlist"
        >
          <Text style={styles.watchIcon}>⭐</Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search markets..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityRole="search"
        />
      </View>

      <MarketCategoryPill
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {watchlistMarkets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Watchlist</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={watchlistMarkets}
              renderItem={({ item }) => <MarketCard market={item} compact />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {featuredMarket && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <MarketCard market={featuredMarket} featured />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending</Text>
          {trendingMarkets.map((market) => (
            <MarketCard key={market.id} market={market} compact />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#1A1A1A" },
  watchIcon: { fontSize: 24 },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  searchInput: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#1A1A1A",
  },
  content: { paddingBottom: 80 },
  section: { paddingHorizontal: 16, marginVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  horizontalList: { paddingRight: 16 },
});
