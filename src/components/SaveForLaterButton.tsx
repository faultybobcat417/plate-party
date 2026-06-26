import React, { useCallback } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useStakeStore } from '../stores/useStakeStore';
import { colors, spacing, typography } from '../theme';

interface SaveForLaterButtonProps {
  competitionId: string;
}

export function SaveForLaterButton({ competitionId }: SaveForLaterButtonProps) {
  const { savedCompetitions, toggleSaveCompetition } = useStakeStore();
  const isSaved = savedCompetitions.includes(competitionId);

  const handlePress = useCallback(() => {
    toggleSaveCompetition(competitionId);
  }, [competitionId, toggleSaveCompetition]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? 'Unsave competition' : 'Save competition for later'}
      style={{ padding: spacing[2] }}
    >
      <Text style={{ fontSize: 24, color: isSaved ? colors.mustard[500] : colors.ink[400] }}>
        {isSaved ? '🔖' : '📑'}
      </Text>
    </TouchableOpacity>
  );
}