import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useCharityStore } from '../../stores/useCharityStore';
import { getCharityById } from '../../api/charity';

export const OnboardingCompleteScreen = () => {
  const { platesEarned, firstGoal, markComplete, selectedCharities } =
    useOnboardingStore();
  const { charities } = useCharityStore();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayPlates = useRef(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: platesEarned,
      duration: 800,
      useNativeDriver: false,
    }).start();
    animatedValue.addListener(({ value }) => {
      displayPlates.current = Math.floor(value);
    });
    return () => animatedValue.removeAllListeners();
  }, []);

  const selectedOrgs = selectedCharities
    .map((id) => getCharityById(id))
    .filter((org): org is NonNullable<typeof org> => org !== undefined);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.bigEmoji}>🎉</Text>
        <Text style={styles.title}>You're In!</Text>

        <View style={styles.counterBox}>
          <Text style={styles.counterLabel}>Starting balance</Text>
          <Animated.Text style={styles.counterValue}>
            🍽️ {displayPlates.current}
          </Animated.Text>
        </View>

        {firstGoal && (
          <View style={styles.goalBox}>
            <Text style={styles.goalTitle}>🎯 {firstGoal.title}</Text>
            <Text style={styles.goalStake}>Stake: {firstGoal.stake} plates</Text>
          </View>
        )}

        <View style={styles.charityRow}>
          {selectedOrgs.map((org) => (
            <View key={org.id} style={styles.charityChip}>
              <Text style={styles.charityEmoji}>{org.emoji}</Text>
              <Text style={styles.charityName}>{org.name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={markComplete}>
          <Text style={styles.buttonText}>Start My Journey</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  bigEmoji: { fontSize: 72 },
  title: { fontSize: 32, fontWeight: '800', marginVertical: 12 },
  counterBox: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  counterLabel: { fontSize: 14, color: '#888' },
  counterValue: { fontSize: 36, fontWeight: '800', color: '#34C759' },
  goalBox: {
    backgroundColor: '#F0FFF0',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginVertical: 8,
  },
  goalTitle: { fontSize: 18, fontWeight: '700' },
  goalStake: { fontSize: 14, color: '#555' },
  charityRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 12, justifyContent: 'center' },
  charityChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
  },
  charityEmoji: { fontSize: 20, marginRight: 6 },
  charityName: { fontSize: 14, fontWeight: '500' },
  button: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 18 },
});
