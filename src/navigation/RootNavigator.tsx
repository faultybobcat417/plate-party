import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { OnboardingFlowScreen } from "../screens/onboarding/OnboardingFlowScreen";
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
      <Stack.Screen name="Onboarding" component={OnboardingFlowScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}
