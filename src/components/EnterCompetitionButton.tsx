import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface EnterCompetitionButtonProps {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  fee: number;
}

export function EnterCompetitionButton({ onPress, loading, disabled, fee }: EnterCompetitionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Enter competition for ${fee} plates`}
      disabled={disabled || loading}
      style={{
        backgroundColor: disabled ? '#C7C7CC' : colors.gold,
        paddingVertical: spacing[3],
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: spacing[2],
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={'#FFFFFF'} />
      ) : (
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: '#FFFFFF' }}>
          Enter Competition ({fee} plates)
        </Text>
      )}
    </TouchableOpacity>
  );
}