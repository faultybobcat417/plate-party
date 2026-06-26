import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CharityOrg } from '../../types/charity';

interface Props {
  platesReturned: number;
  charity: CharityOrg;
  matchAmount: number;
}

export const ImpactCelebration: React.FC<Props> = ({
  platesReturned,
  charity,
  matchAmount,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.big}>🎉 Double Win!</Text>
      <View style={styles.row}>
        <Text style={styles.label}>You keep</Text>
        <Text style={styles.value}>🍽️ {platesReturned} plates</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Sponsor donated</Text>
        <Text style={styles.value}>💵 ${matchAmount} to {charity.name}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#F0FFF0', padding: 24, borderRadius: 16 },
  big: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 16, color: '#555' },
  value: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
});
