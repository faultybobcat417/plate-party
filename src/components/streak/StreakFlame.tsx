import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface Props {
  streak: number;
  frozen?: boolean;
}

export const StreakFlame: React.FC<Props> = ({ streak, frozen }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 2 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 2 }),
    ]).start();
  }, [streak]);

  const color = frozen ? '#4A90D9' : streak >= 50 ? '#FFD700' : '#FF6B35';

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Text style={[styles.emoji, { color }]}>🔥</Text>
      <Text style={[styles.count, { color }]}>{streak}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 24 },
  count: { fontSize: 20, fontWeight: '800', marginLeft: 4 },
});
