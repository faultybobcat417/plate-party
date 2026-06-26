import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PlayHomeScreen } from "../screens/game/PlayHomeScreen";
import { GameScreen } from "../screens/game/GameScreen";
import type { PlayStackParamList } from "./types";

const Stack = createNativeStackNavigator<PlayStackParamList>();

export function PlayStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="PlayHome"
        component={PlayHomeScreen}
        options={{ title: "Play", headerShown: false }}
      />
      <Stack.Screen
        name="GameScreen"
        component={GameScreen}
        options={{ title: "Game" }}
      />
    </Stack.Navigator>
  );
}
