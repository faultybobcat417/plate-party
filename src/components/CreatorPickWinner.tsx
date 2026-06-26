import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { StakeEntry } from '../types/stake';

interface CreatorPickWinnerProps {
  entries: StakeEntry[];
  onPickWinner: (entryId: string) => Promise<void>;
}

export function CreatorPickWinner({ entries, onPickWinner }: CreatorPickWinnerProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const handleSelect = useCallback((entryId: string) => {
    setSelectedEntryId(entryId);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedEntryId) {
      Alert.alert('Select an entry', 'Please select a winner.');
      return;
    }
    setPicking(true);
    try {
      await onPickWinner(selectedEntryId);
      setSelectedEntryId(null);
    } catch (error) {
      // error handled upstream
    } finally {
      setPicking(false);
    }
  }, [selectedEntryId, onPickWinner]);

  if (entries.length === 0) {
    return (
      <View style={{ marginVertical: spacing[2] }}>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>No entries yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ marginVertical: spacing[3] }}>
      <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.snug, color: colors.ink[900] }}>Pick Winner</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item.id)}
            style={{
              padding: spacing[2],
              borderWidth: 1,
              borderColor: selectedEntryId === item.id ? colors.gold : colors.ash[200],
              borderRadius: 6,
              marginVertical: spacing[1],
            }}
          >
            <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[900] }}>{item.userName}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={false}
      />
      <TouchableOpacity
        onPress={handleConfirm}
        disabled={picking || !selectedEntryId}
        style={{
          backgroundColor: picking ? '#C7C7CC' : colors.win,
          paddingVertical: spacing[3],
          borderRadius: 8,
          alignItems: 'center',
          marginTop: spacing[2],
        }}
      >
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', lineHeight: typography.lineHeights.normal, color: '#FFFFFF' }}>
          {picking ? 'Picking...' : 'Confirm Winner'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}