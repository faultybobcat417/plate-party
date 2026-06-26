import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  variant?: 'list' | 'card' | 'button';
}

export const LoadingState: React.FC<Props> = ({ variant = 'list' }) => {
  if (variant === 'card') {
    return (
      <View style={styles.card}>
        <View style={styles.skeleton} />
        <View style={[styles.skeleton, { width: '60%' }]} />
      </View>
    );
  }
  if (variant === 'button') {
    return <ActivityIndicator size="small" color="#34C759" />;
  }
  // list
  return (
    <View style={styles.list}>
      <View style={styles.skeleton} />
      <View style={styles.skeleton} />
      <View style={[styles.skeleton, { width: '70%' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, margin: 8 },
  skeleton: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginVertical: 6,
    width: '100%',
  },
});
