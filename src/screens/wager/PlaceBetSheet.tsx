import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMarketStore } from '../../stores/useMarketStore';
import { useUserStore } from '../../stores/useUserStore';
import { postLedgerTransaction } from '../../api/ledger';
import { colors, spacing, typography } from '../../theme';
import { Market } from '../../types/market';

export function PlaceBetSheet() {
  const route = useRoute();
  const navigation = useNavigation();
  const { marketId } = route.params as { marketId: string };
  const { markets, fetchMarketById } = useMarketStore();
  const { user, deductPlates, addPlates } = useUserStore();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(50);
  const [position, setPosition] = useState<'yes' | 'no'>('yes');
  const [submitting, setSubmitting] = useState(false);
  const [returnAmount, setReturnAmount] = useState(0);

  const loadMarket = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketById(marketId);
      setMarket(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load market data.');
    } finally {
      setLoading(false);
    }
  }, [marketId, fetchMarketById]);

  useEffect(() => {
    let mounted = true;
    loadMarket();
    return () => { mounted = false; };
  }, [loadMarket]);

  useEffect(() => {
    if (market) {
      const price = position === 'yes' ? market.yesPrice : market.noPrice;
      if (price > 0) {
        setReturnAmount(amount / price);
      } else {
        setReturnAmount(0);
      }
    }
  }, [amount, position, market]);

  const incrementAmount = useCallback(() => {
    setAmount(prev => Math.min(prev + 10, 1000));
  }, []);

  const decrementAmount = useCallback(() => {
    setAmount(prev => Math.max(prev - 10, 10));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in.');
      return;
    }
    if (!market) return;
    if (amount < 10 || amount > 1000) {
      Alert.alert('Invalid amount', 'Bet amount must be between 10 and 1000 plates.');
      return;
    }
    if (amount > user.plates) {
      Alert.alert('Insufficient balance', `You have ${user.plates} plates.`);
      return;
    }

    setSubmitting(true);
    try {
      // Deduct plates via ledger
      await postLedgerTransaction({
        userId: user?.id || "anonymous",
        amount: -amount,
        type: 'bet_placed',
        reference: `bet_${market.id}`,
        description: `Bet ${amount} plates on ${market.title} (${position})`,
      });
      deductPlates(amount);
      // In a real app, you'd also record the bet position in DB
      Alert.alert('Success', `You placed a ${position} bet for ${amount} plates.`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place bet.');
    } finally {
      setSubmitting(false);
    }
  }, [user, market, amount, position, deductPlates, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!market) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Market not found</Text>
      </View>
    );
  }

  const yesPrice = market.yesPrice ?? 0;
  const noPrice = market.noPrice ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen[50], padding: spacing[4] }}>
      <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900] }}>Place Bet</Text>
      <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginBottom: spacing[3] }}>
        {market.title}
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: spacing[3] }}>
        <TouchableOpacity
          onPress={() => setPosition('yes')}
          style={{
            flex: 1,
            padding: spacing[3],
            backgroundColor: position === 'yes' ? colors.gold : colors.linen[100],
            borderRadius: 8,
            marginRight: spacing[1],
            alignItems: 'center',
          }}
        >
          <Text style={{ color: position === 'yes' ? '#FFFFFF' : colors.ink[900] }}>
            Yes ({(yesPrice * 100).toFixed(1)}%)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPosition('no')}
          style={{
            flex: 1,
            padding: spacing[3],
            backgroundColor: position === 'no' ? colors.gold : colors.linen[100],
            borderRadius: 8,
            marginLeft: spacing[1],
            alignItems: 'center',
          }}
        >
          <Text style={{ color: position === 'no' ? '#FFFFFF' : colors.ink[900] }}>
            No ({(noPrice * 100).toFixed(1)}%)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing[3] }}>
        <TouchableOpacity onPress={decrementAmount} accessibilityRole="button" style={{ padding: spacing[3] }}>
          <Text style={{ fontSize: 24 }}>−</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900] }}>{amount}</Text>
        <TouchableOpacity onPress={incrementAmount} accessibilityRole="button" style={{ padding: spacing[3] }}>
          <Text style={{ fontSize: 24 }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: colors.linen[100], padding: spacing[3], borderRadius: 8 }}>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>Potential Return:</Text>
        <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.win }}>
          {returnAmount.toFixed(2)} plates
        </Text>
        <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>
          ({position === 'yes' ? 'Yes' : 'No'} price: {(position === 'yes' ? yesPrice : noPrice) * 100}%)
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleConfirm}
        disabled={submitting}
        style={{
          backgroundColor: submitting ? '#C7C7CC' : colors.gold,
          paddingVertical: spacing[3],
          borderRadius: 8,
          alignItems: 'center',
          marginTop: spacing[4],
        }}
      >
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: '#FFFFFF' }}>
          {submitting ? 'Processing...' : `Confirm Bet (${amount} plates)`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}