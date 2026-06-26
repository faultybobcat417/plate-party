import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, typography } from "../../theme";
import { useMarketStore } from "../../stores/useMarketStore";
import { MarketCard } from "../../components/market/MarketCard";
import type { MarketStackParamList } from "../../navigation/types";

type MarketNav = NativeStackNavigationProp<MarketStackParamList>;

const CATEGORIES = ["All", "Technology", "Finance", "Sports", "Climate", "Politics"];

export default function MarketHomeScreen() {
  const navigation = useNavigation<MarketNav>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const markets = useMarketStore((state) => state.markets);
  const isLoading = useMarketStore((state) => state.isLoading);
  const error = useMarketStore((state) => state.error);
  const fetchMarkets = useMarketStore((state) => state.fetchMarkets);

  const filteredMarkets = useMemo(() => {
    let result = markets;
    if (activeCategory !== "All") {
      result = result.filter((m) => m.category?.toLowerCase() === activeCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
    }
    return result;
  }, [markets, activeCategory, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMarkets().finally(() => setRefreshing(false));
  }, [fetchMarkets]);

  const handleMarketPress = useCallback((marketId: string) => { navigation.navigate("MarketDetail", { marketId }); }, [navigation]);
  const handleTradePress = useCallback((marketId: string) => { navigation.navigate("Trade", { marketId }); }, [navigation]);

  if (isLoading && markets.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.primary.base} />
      </SafeAreaView>
    );
  }

  if (error && markets.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchMarkets} style={styles.retryButton} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markets</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search markets..."
          placeholderTextColor={colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search markets"
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setActiveCategory(item)}
            style={[styles.categoryPill, activeCategory === item && styles.categoryPillActive]}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${item}`}
            accessibilityState={{ selected: activeCategory === item }}
          >
            <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>{item}</Text>
          </Pressable>
        )}
      />

      <FlatList
        data={filteredMarkets}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.marketList}
        renderItem={({ item }) => (
          <MarketCard
            market={item}
            onPress={() => handleMarketPress(item.id)}
            onTradePress={() => handleTradePress(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📉</Text>
            <Text style={styles.emptyTitle}>No markets found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? `No results for "${searchQuery}"` : "Check back later for new markets."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  headerTitle: { fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, color: colors.neutral[900] },
  searchContainer: { paddingHorizontal: spacing[4], marginBottom: spacing[2] },
  searchInput: { backgroundColor: colors.neutral[100], borderRadius: 99, paddingHorizontal: spacing[4], paddingVertical: spacing[2], fontSize: typography.sizes.base, color: colors.neutral[900], borderWidth: 1, borderColor: colors.neutral[200] },
  categoryList: { paddingHorizontal: spacing[4], gap: spacing[2] },
  categoryPill: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 99, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] },
  categoryPillActive: { backgroundColor: colors.primary.base, borderColor: colors.primary.base },
  categoryText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.neutral[500] },
  categoryTextActive: { color: colors.neutral[0], fontWeight: typography.weights.bold },
  marketList: { padding: spacing[4] },
  empty: { alignItems: "center", paddingTop: spacing[10] },
  emptyEmoji: { fontSize: 48, marginBottom: spacing[3] },
  emptyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.neutral[900], marginBottom: spacing[2] },
  emptyText: { fontSize: typography.sizes.base, color: colors.neutral[500], textAlign: "center" },
  errorText: { fontSize: typography.sizes.base, color: colors.neutral[900], textAlign: "center", marginTop: spacing[4] },
  retryButton: { backgroundColor: colors.primary.base, paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: 99, alignSelf: "center", marginTop: spacing[4] },
  retryText: { color: colors.neutral[0], fontWeight: typography.weights.bold },
});
