import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { INTENTION_OPTIONS, UserIntention } from '../../types/onboarding';

export const OnboardingIntentionScreen = () => {
  const { setIntention, addPlates, setStep } = useOnboardingStore();
  const [selected, setSelected] = useState<UserIntention | null>(null);

  const handleSelect = (id: UserIntention) => {
    setSelected(id);
    setIntention(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    addPlates(100);
    setStep('charities');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Why are you here?</Text>
        <Text style={styles.headerSub}>
          Pick what drives you. We'll personalize your experience.
        </Text>
      </View>

      <FlatList
        data={INTENTION_OPTIONS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => handleSelect(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continue, !selected && styles.disabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  headerSub: { fontSize: 14, color: '#888', marginTop: 4 },
  grid: { paddingHorizontal: 12, paddingBottom: 16 },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  cardSelected: { borderColor: '#34C759', backgroundColor: '#F0FFF0' },
  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#1A1A1A' },
  cardDesc: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4 },
  footer: { paddingHorizontal: 20, paddingBottom: 24 },
  continue: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabled: { backgroundColor: '#ccc' },
  continueText: { color: 'white', fontWeight: '700', fontSize: 18 },
});
