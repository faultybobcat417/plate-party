import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import type { CharityOrg } from '../../types/charity';

interface Props {
  charity: CharityOrg;
  plates: number;
}

export const ImpactCard: React.FC<Props> = ({ charity, plates }) => {
  const animated = useRef(new Animated.Value(0)).current;
  const display = useRef(0);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: plates,
      duration: 600,
      useNativeDriver: false,
    }).start();
    animated.addListener(({ value }) => {
      display.current = Math.floor(value);
    });
    return () => animated.removeAllListeners();
  }, []);

  const impact = Math.floor(plates / 10); // example metric

  return (
    <View style={[styles.card, { backgroundColor: '#FFF5E6' }]}>
      <Text style={styles.emoji}>{charity.emoji}</Text>
      <Text style={styles.title}>Impact Achieved!</Text>
      <Animated.Text style={styles.plates}>
        Your {display.current} plates provided {impact} {charity.impactMetric}
      </Animated.Text>
      <Text style={styles.charityName}>{charity.name}</Text>
      <Text style={styles.thanks}>Thank you for giving.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 24, borderRadius: 16, alignItems: 'center' },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '800', marginVertical: 8 },
  plates: { fontSize: 18, fontWeight: '600', color: '#FF6B35' },
  charityName: { fontSize: 16, marginTop: 8, fontWeight: '600' },
  thanks: { fontSize: 14, color: '#888', marginTop: 4 },
});
