import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FeedHomeScreen } from "../screens/feed/FeedHomeScreen";
import { CreateChallengeScreen } from "../screens/feed/CreateChallengeScreen";
import { ChallengeDetailScreen } from "../screens/feed/ChallengeDetailScreen";
import type { FeedStackParamList } from "./types";

const Stack = createNativeStackNavigator<FeedStackParamList>();

export function FeedStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="FeedHome"
        component={FeedHomeScreen}
        options={{ title: "Feed", headerShown: false }}
      />
      <Stack.Screen
        name="CreateChallenge"
        component={CreateChallengeScreen}
        options={{ title: "New Challenge" }}
      />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{ title: "Challenge" }}
      />
    </Stack.Navigator>
  );
}
