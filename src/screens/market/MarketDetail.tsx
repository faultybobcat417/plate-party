import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WatchlistToggle } from '../../components/WatchlistToggle';
import { useMarketStore } from '../../stores/useMarketStore';
import { colors, spacing, typography } from '../../theme';
import { Market } from '../../types/market';

export function MarketDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { marketId } = route.params as { marketId: string };
  const { markets, fetchMarketById } = useMarketStore();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMarket = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketById(marketId);
      setMarket(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load market details.');
    } finally {
      setLoading(false);
    }
  }, [marketId, fetchMarketById]);

  useEffect(() => {
    let mounted = true;
    loadMarket();
    return () => { mounted = false; };
  }, [loadMarket]);

  const handleTrade = useCallback(() => {
    navigation.navigate('PlaceBetSheet' as any, { marketId });
  }, [navigation, marketId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!market) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>Market not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen[50], padding: spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
        <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900], flex: 1 }}>{market.title}</Text>
        <WatchlistToggle marketId={market.id} size="large" />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: spacing[3] }}>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginRight: spacing[3] }}>
          Yes: {(market.yesPrice * 100).toFixed(1)}%
        </Text>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>
          No: {(market.noPrice * 100).toFixed(1)}%
        </Text>
      </View>
      <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[900], marginBottom: spacing[3] }}>
        {market.description}
      </Text>
      <TouchableOpacity
        onPress={handleTrade}
        accessibilityRole="button"
        accessibilityLabel="Place a bet"
        style={{
          backgroundColor: colors.gold,
          paddingVertical: spacing[3],
          borderRadius: 8,
          alignItems: 'center',
          marginVertical: spacing[3],
        }}
      >
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: '#FFFFFF' }}>Trade Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}