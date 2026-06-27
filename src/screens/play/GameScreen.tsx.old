import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../stores/useGameStore';
import { useUserStore } from '../../stores/useUserStore';
import { postLedgerTransaction } from '../../api/ledger';
import { colors, spacing, typography } from '../../theme';
import { Game } from '../../types/game';

export function GameScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { gameId } = route.params as { gameId: string };
  const { games, fetchGameById, playGame } = useGameStore();
  const { user, addPlates } = useUserStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  const loadGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGameById(gameId);
      setGame(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load game.');
    } finally {
      setLoading(false);
    }
  }, [gameId, fetchGameById]);

  useEffect(() => {
    let mounted = true;
    loadGame();
    return () => { mounted = false; };
  }, [loadGame]);

  const handlePlay = useCallback(async () => {
    if (!user) {
      Alert.alert('Login required', 'Please log in to play.');
      return;
    }
    if (!game) return;
    setPlaying(true);
    try {
      // Simulate game play; in real app, you'd have game logic
      const win = Math.random() > 0.5;
      let reward = 0;
      if (win) {
        reward = game.prize;
        // Add plates via ledger
        await postLedgerTransaction({
          userId: user?.id || "anonymous",
          amount: reward,
          type: 'game_win',
          reference: `game_${game.id}`,
          description: `Won ${reward} plates playing ${game.title}`,
        });
        addPlates(reward);
      } else {
        // No reward, but maybe charge a fee? For now just show loss.
      }
      // Record play in store
      await playGame(game.id, user.id, win);
      Alert.alert(win ? '🎉 You won!' : '😞 You lost', win ? `You earned ${reward} plates!` : 'Try again!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to play game.');
    } finally {
      setPlaying(false);
    }
  }, [user, game, playGame, addPlates, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Game not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen[50], padding: spacing[4], alignItems: 'center' }}>
      <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900] }}>{game.title}</Text>
      <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginVertical: spacing[2] }}>
        {game.description}
      </Text>
      <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginBottom: spacing[4] }}>
        Prize: {game.prize} plates
      </Text>
      <TouchableOpacity
        onPress={handlePlay}
        disabled={playing}
        style={{
          backgroundColor: playing ? '#C7C7CC' : colors.gold,
          paddingVertical: spacing[4],
          paddingHorizontal: spacing[5],
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: '#FFFFFF' }}>
          {playing ? 'Playing...' : 'Play Game'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}