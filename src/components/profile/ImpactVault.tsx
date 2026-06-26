import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  totalPlates: number;
}

export const ImpactVault: React.FC<Props> = ({ totalPlates }) => {
  const meals = Math.floor(totalPlates / 10);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🌍 Your Impact</Text>
      <Text style={styles.big}>{meals} school meals</Text>
      <Text style={styles.sub}>from {totalPlates} plates contributed</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${Math.min(meals / 20 * 100, 100)}%` }]} />
      </View>
      <Text style={styles.rank}>Top 15% of contributors</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  big: { fontSize: 32, fontWeight: '800', color: '#FF6B35' },
  sub: { fontSize: 14, color: '#888' },
  bar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginVertical: 12 },
  fill: { height: 8, backgroundColor: '#34C759', borderRadius: 4 },
  rank: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
});
