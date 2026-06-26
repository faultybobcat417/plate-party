import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { WatchlistToggle } from './WatchlistToggle';
import { colors, spacing, typography } from '../theme';
import { Market } from '../types/market';

interface MarketCardProps {
  market: Market;
  onPress: (marketId: string) => void;
  onTradePress?: (marketId: string) => void;
}

export function MarketCard({ market, onPress, onTradePress }: MarketCardProps) {
  const handlePress = useCallback(() => {
    onPress(market.id);
  }, [market.id, onPress]);

  const handleTrade = useCallback(() => {
    if (onTradePress) {
      onTradePress(market.id);
    }
  }, [market.id, onTradePress]);

  const yesPrice = market.yesPrice ?? 0;
  const noPrice = market.noPrice ?? 0;
  const volume = market.volume ?? 0;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Market: ${market.title}`}
      style={({ pressed }) => ({
        backgroundColor: colors.linen[100],
        borderRadius: 12,
        padding: spacing[3],
        marginVertical: spacing[1],
        marginHorizontal: spacing[2],
        opacity: pressed ? 0.8 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      })}
    >
      <View style={{ flex: 1, marginRight: spacing[2] }}>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: '600', lineHeight: typography.lineHeights.normal, color: colors.ink[900] }} numberOfLines={2}>
          {market.title}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: spacing[1] }}>
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginRight: spacing[3] }}>
            Yes: {(yesPrice * 100).toFixed(1)}%
          </Text>
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginRight: spacing[3] }}>
            No: {(noPrice * 100).toFixed(1)}%
          </Text>
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>
            Vol: {volume.toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <WatchlistToggle marketId={market.id} size="small" />
        {onTradePress && (
          <TouchableOpacity
            onPress={handleTrade}
            accessibilityRole="button"
            accessibilityLabel={`Trade on ${market.title}`}
            style={{
              backgroundColor: colors.gold,
              paddingVertical: spacing[1],
              paddingHorizontal: spacing[2],
              borderRadius: 6,
              marginLeft: spacing[1],
            }}
          >
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: '#FFFFFF' }}>Trade</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}