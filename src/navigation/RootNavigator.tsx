import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { CreateProfileScreen } from "../screens/onboarding/CreateProfileScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}
