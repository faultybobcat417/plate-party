import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useUserStore } from '../stores/useUserStore';
import { colors, spacing, typography } from '../theme';

export function GiverLeaderboard() {
  const { topGivers, fetchTopGivers, isLoading } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTopGivers();
    } catch (error) {
      // handled in store
    } finally {
      setRefreshing(false);
    }
  }, [fetchTopGivers]);

  useEffect(() => {
    let mounted = true;
    loadData();
    return () => { mounted = false; };
  }, [loadData]);

  if (isLoading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen[50], padding: spacing[3] }}>
      <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900], marginBottom: spacing[3] }}>Top Givers</Text>
      <FlatList
        data={topGivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.ash[200] }}>
            <Text style={{ width: 30, fontWeight: 'bold', color: colors.ink[400] }}>#{index + 1}</Text>
            <Text style={{ flex: 1, fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[900] }}>{item.name}</Text>
            <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.win }}>{item.totalGiven} plates</Text>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={loadData}
      />
    </View>
  );
}