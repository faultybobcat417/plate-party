import React, { useCallback } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useMarketStore } from '../stores/useMarketStore';
import { colors, spacing, typography } from '../theme';

interface WatchlistToggleProps {
  marketId: string;
  size?: 'small' | 'large';
  accessibilityLabel?: string;
}

export function WatchlistToggle({ marketId, size = 'small', accessibilityLabel }: WatchlistToggleProps) {
  const { watchlist, toggleWatchlist } = useMarketStore();
  const isStarred = watchlist.includes(marketId);

  const handlePress = useCallback(() => {
    toggleWatchlist(marketId);
  }, [marketId, toggleWatchlist]);

  const starSize = size === 'large' ? 28 : 20;
  const starColor = isStarred ? colors.mustard[500] : colors.ink[400];

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isStarred ? 'Remove from watchlist' : 'Add to watchlist')}
      accessibilityState={{ selected: isStarred }}
      style={{ padding: spacing[1] }}
    >
      <Text style={{ fontSize: starSize, color: starColor }}>
        {isStarred ? '★' : '☆'}
      </Text>
    </TouchableOpacity>
  );
}