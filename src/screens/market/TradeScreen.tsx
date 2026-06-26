import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MarketStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type TradeRouteProp = RouteProp<MarketStackParamList, 'Trade'>;

export function TradeScreen() {
  const route = useRoute<TradeRouteProp>();
  const { marketId, defaultOutcome } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trade</Text>
      <Text style={styles.subtitle}>Market: {marketId}</Text>
      <Text style={styles.subtitle}>Outcome: {defaultOutcome}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.linen[50],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.ink[900],
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.normal,
    color: colors.ink[400],
    marginTop: spacing[2],
  },
});
