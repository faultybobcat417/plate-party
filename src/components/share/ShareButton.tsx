import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onPress: () => void;
  variant: 'goal' | 'bet' | 'impact';
  label?: string;
}

export const ShareButton: React.FC<Props> = ({ onPress, variant, label }) => {
  const emoji = variant === 'goal' ? '🎯' : variant === 'bet' ? '⚡' : '🌍';
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{emoji} {label || 'Share'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { backgroundColor: '#F0F0F0', padding: 12, borderRadius: 24, alignSelf: 'flex-start' },
  label: { fontWeight: '600' },
});
