import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

export const OnboardingWelcomeScreen = () => {
  const { addPlates, setStep } = useOnboardingStore();

  const handleGetStarted = () => {
    addPlates(100);
    setStep('intention');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🥩</Text>
        <Text style={styles.title}>PLATE PARTY</Text>
        <Text style={styles.tagline}>Every goal you hit helps the world.</Text>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  tagline: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
  },
  button: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  link: { marginTop: 16 },
  linkText: { color: '#34C759', fontSize: 16, fontWeight: '600' },
});
