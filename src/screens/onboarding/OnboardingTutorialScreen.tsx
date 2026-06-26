import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    emoji: '🎯',
    title: 'Set a Goal',
    desc: 'Stake plates on personal challenges. The more you stake, the more you care.',
  },
  {
    emoji: '✅',
    title: 'Check In Daily',
    desc: 'Did you do it today? Tap yes to build your streak. Tap no — your plates still help charity.',
  },
  {
    emoji: '🏆',
    title: 'Win or Give',
    desc: 'Hit your goal? Get plates back + sponsor donates. Miss it? Plates go to your cause. No losers.',
  },
];

export const OnboardingTutorialScreen = () => {
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { addPlates, setStep } = useOnboardingStore();

  const handleScroll = (e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  const handleContinue = () => {
    addPlates(100);
    setStep('firstGoal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
      {index === PAGES.length - 1 && (
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  page: {
    width,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  desc: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 6,
  },
  dotActive: { backgroundColor: '#34C759', width: 24 },
  button: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 18 },
});
