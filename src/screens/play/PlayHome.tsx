import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../stores/useGameStore';
import { colors, spacing, typography } from '../../theme';
import { Game } from '../../types/game';

export function PlayHome() {
  const navigation = useNavigation();
  const { games, fetchGames, isLoading, onlineCount } = useGameStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchGames();
    } catch (error) {
      Alert.alert('Error', 'Failed to load games.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchGames]);

  useEffect(() => {
    let mounted = true;
    loadGames();
    return () => { mounted = false; };
  }, [loadGames]);

  const handleGamePress = useCallback((gameId: string) => {
    navigation.navigate('GameScreen' as any, { gameId });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Game }) => (
    <TouchableOpacity
      onPress={() => handleGamePress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}`}
      style={{
        backgroundColor: colors.linen[100],
        borderRadius: 12,
        padding: spacing[3],
        marginVertical: spacing[1],
        marginHorizontal: spacing[2],
      }}
    >
      <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: colors.ink[900] }}>{item.title}</Text>
      <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>{item.description}</Text>
      <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.win, marginTop: spacing[1] }}>
        🏆 Prize: {item.prize} plates
      </Text>
    </TouchableOpacity>
  ), [handleGamePress]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen[50] }}>
      <View style={{ padding: spacing[3], flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900] }}>Play Games</Text>
        <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>👥 {onlineCount} online</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: spacing[5] }} />
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={loadGames}
          contentContainerStyle={{ paddingBottom: spacing[5] }}
        />
      )}
    </View>
  );
}