import React, { useCallback, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useUserStore } from '../stores/useUserStore';
import { useTutorialStore } from '../stores/useTutorialStore';
import { postLedgerTransaction } from '../api/ledger';
import { colors, spacing, typography } from '../theme';

export function FreePlateButton() {
  const { user, addPlates } = useUserStore();
  const { pendingSteps, completeStep } = useTutorialStore();
  const [loading, setLoading] = useState(false);

  const handleClaim = useCallback(async () => {
    if (loading) return;
    if (!user) return;
    if (pendingSteps.length === 0) {
      Alert.alert('No free plates available', 'Complete more actions to earn plates!');
      return;
    }

    setLoading(true);
    try {
      const step = pendingSteps[0];
      // Reward plates for completing the step
      const reward = step.reward ?? 10;
      await postLedgerTransaction({
        userId: user?.id || "anonymous",
        amount: reward,
        type: 'tutorial_reward',
        reference: `tutorial_${step.id}`,
        description: `Reward for ${step.label}`,
      });
      addPlates(reward);
      completeStep(step.id);
      Alert.alert('🎉', `You earned ${reward} plates!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to claim reward.');
    } finally {
      setLoading(false);
    }
  }, [user, pendingSteps, addPlates, completeStep, loading]);

  if (!user) return null;

  return (
    <TouchableOpacity
      onPress={handleClaim}
      disabled={loading || pendingSteps.length === 0}
      accessibilityRole="button"
      accessibilityLabel="Claim free plates for tutorial"
      style={{
        backgroundColor: pendingSteps.length > 0 ? colors.mustard[500] : '#C7C7CC',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: spacing[2],
      }}
    >
      {loading ? (
        <ActivityIndicator color={'#FFFFFF'} />
      ) : (
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: '#FFFFFF' }}>
          {pendingSteps.length > 0 ? `Claim Free Plate (${pendingSteps.length} steps)` : 'No Free Plates'}
        </Text>
      )}
    </TouchableOpacity>
  );
}