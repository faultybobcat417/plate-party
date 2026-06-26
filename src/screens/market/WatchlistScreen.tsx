import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Alert,
} from "react-native";
import { useMarketStore } from "../../stores/useMarketStore";
import { MarketCard } from "../../components/market/MarketCard";

export function WatchlistScreen() {
  const { markets, watchlist, removeFromWatchlist } = useMarketStore();
  const watchlistMarkets = markets.filter((m) => watchlist.includes(m.id));

  const handleLongPress = (marketId: string) => {
    Alert.alert(
      "Remove from Watchlist",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeFromWatchlist(marketId) },
      ]
    );
  };

  const renderItem = ({ item }: { item: typeof markets[0] }) => (
    <Pressable
      onLongPress={() => handleLongPress(item.id)}
      delayLongPress={500}
    >
      <MarketCard market={item} compact />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⭐ Watchlist</Text>
      {watchlistMarkets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No markets saved yet.</Text>
          <Text style={styles.emptySub}>Long-press any market to add it here.</Text>
        </View>
      ) : (
        <FlatList
          data={watchlistMarkets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#1A1A1A", marginBottom: 16 },
  list: { paddingBottom: 80 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#888" },
  emptySub: { fontSize: 13, color: "#bbb", marginTop: 4 },
});
