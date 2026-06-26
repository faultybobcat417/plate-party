import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useUserStore } from '../stores/useUserStore';
import { postLedgerTransaction } from '../api/ledger';
import { colors, spacing, typography } from '../theme';

interface SuggestedGoalCardProps {
  title: string;
  description: string;
  plateReward: number;
  goalType: 'quick' | 'custom';
  onComplete?: () => void;
}

export function SuggestedGoalCard({ title, description, plateReward, goalType, onComplete }: SuggestedGoalCardProps) {
  const { user, addPlates } = useUserStore();

  const handlePress = useCallback(async () => {
    try {
      // Add plates via ledger
      await postLedgerTransaction({
        userId: user?.id || "anonymous",
        amount: plateReward,
        type: 'goal_reward',
        reference: `goal_${goalType}`,
        description: `Reward for completing goal: ${title}`,
      });
      // Update local store
      addPlates(plateReward);
      Alert.alert('🎉', `You earned ${plateReward} plates!`);
      if (onComplete) onComplete();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to claim reward.');
    }
  }, [user, plateReward, goalType, title, addPlates, onComplete]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Complete goal: ${title}`}
      style={{
        backgroundColor: colors.linen[100],
        borderRadius: 12,
        padding: spacing[3],
        marginVertical: spacing[1],
        borderWidth: 1,
        borderColor: colors.ash[200],
      }}
    >
      <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: colors.ink[900] }}>{title}</Text>
      <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginVertical: spacing[1] }}>
        {description}
      </Text>
      <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.win }}>
        +{plateReward} plates
      </Text>
    </TouchableOpacity>
  );
}