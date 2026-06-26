import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, SectionList, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MarketCard } from '../../components/MarketCard';
import { WatchlistToggle } from '../../components/WatchlistToggle';
import { useMarketStore } from '../../stores/useMarketStore';
import { useUserStore } from '../../stores/useUserStore';
import { colors, spacing, typography } from '../../theme';
import { Market } from '../../types/market';

type Section = {
  title: string;
  data: Market[];
};

export function MarketHome() {
  const navigation = useNavigation();
  const { markets, watchlist, fetchMarkets, isLoading } = useMarketStore();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMarkets();
    } catch (error) {
      // error handled in store
    } finally {
      setRefreshing(false);
    }
  }, [fetchMarkets]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await fetchMarkets();
      } catch (error) {
        // store handles
      }
    })();
    return () => { mounted = false; };
  }, [fetchMarkets]);

  const watchlistMarkets = markets.filter(m => watchlist.includes(m.id));
  const otherMarkets = markets.filter(m => !watchlist.includes(m.id));

  const sections: Section[] = [];
  if (watchlistMarkets.length > 0) {
    sections.push({ title: '⭐ Watchlist', data: watchlistMarkets });
  }
  if (otherMarkets.length > 0) {
    sections.push({ title: '📈 All Markets', data: otherMarkets });
  }

  const handleMarketPress = useCallback((marketId: string) => {
    navigation.navigate('MarketDetail' as any, { marketId });
  }, [navigation]);

  const handleTradePress = useCallback((marketId: string) => {
    navigation.navigate('PlaceBetSheet' as any, { marketId });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Market }) => (
    <MarketCard market={item} onPress={handleMarketPress} onTradePress={handleTradePress} />
  ), [handleMarketPress, handleTradePress]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => (
    <View style={{ paddingHorizontal: spacing[3], paddingVertical: spacing[2], backgroundColor: colors.linen[50] }}>
      <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900] }}>{section.title}</Text>
    </View>
  ), []);

  if (isLoading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen[50] }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
        ListEmptyComponent={
          <View style={{ padding: spacing[4], alignItems: 'center' }}>
            <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>No markets available</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing[5] }}
      />
    </View>
  );
}