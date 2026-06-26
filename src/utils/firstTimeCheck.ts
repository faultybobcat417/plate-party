import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPLETE_KEY = 'onboarding_complete';
const STEP_KEY = 'onboarding_step';

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(COMPLETE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(COMPLETE_KEY, 'true');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.multiRemove([COMPLETE_KEY, STEP_KEY]);
}
