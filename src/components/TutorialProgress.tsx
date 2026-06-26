import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useTutorialStore } from '../stores/useTutorialStore';
import { colors, spacing, typography } from '../theme';

export function TutorialProgress() {
  const { steps, completedSteps } = useTutorialStore();
  const total = steps.length;
  const completed = completedSteps.length;
  const progress = total > 0 ? completed / total : 0;

  return (
    <View style={{ padding: spacing[3], backgroundColor: colors.linen[100], borderRadius: 12, marginVertical: spacing[2] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[900] }}>Tutorial Progress</Text>
        <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>{completed}/{total}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.ash[200], borderRadius: 3, marginVertical: spacing[1] }}>
        <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: colors.gold, borderRadius: 3 }} />
      </View>
      <FlatList
        data={steps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const done = completedSteps.includes(item.id);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[1] }}>
              <Text style={{ marginRight: spacing[2] }}>{done ? '✅' : '⬜'}</Text>
              <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: done ? colors.ink[400] : colors.ink[900] }}>
                {item.label} {done ? '' : `(${item.reward ?? 0} plates)`}
              </Text>
            </View>
          );
        }}
        scrollEnabled={false}
      />
    </View>
  );
}