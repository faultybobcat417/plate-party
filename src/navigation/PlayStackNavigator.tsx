import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PlayHomeScreen } from "../screens/game/PlayHomeScreen";
import { GameScreen } from "../screens/game/GameScreen";
import { WordGuessScreen } from "../screens/game/WordGuessScreen";
import { RpsScreen } from "../screens/game/RpsScreen";
import { TicTacToeScreen } from "../screens/game/TicTacToeScreen";
import { MemoryScreen } from "../screens/game/MemoryScreen";
import { QuickMathScreen } from "../screens/game/QuickMathScreen";
import { QuestionsScreen } from "../screens/game/QuestionsScreen";
import { GameHistoryScreen } from "../screens/game/GameHistoryScreen";
import type { PlayStackParamList } from "./types";

const Stack = createNativeStackNavigator<PlayStackParamList>();

export function PlayStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="PlayHome" component={PlayHomeScreen} options={{ title: "Play", headerShown: false }} />
      <Stack.Screen name="GameScreen" component={GameScreen} options={{ title: "Game" }} />
      <Stack.Screen name="GameHistory" component={GameHistoryScreen} options={{ title: "Game History" }} />
      <Stack.Screen name="WordGuess" component={WordGuessScreen} options={{ title: "Word Guess" }} />
      <Stack.Screen name="RPS" component={RpsScreen} options={{ title: "Rock Paper Scissors" }} />
      <Stack.Screen name="TicTacToe" component={TicTacToeScreen} options={{ title: "Tic Tac Toe" }} />
      <Stack.Screen name="Memory" component={MemoryScreen} options={{ title: "Memory" }} />
      <Stack.Screen name="QuickMath" component={QuickMathScreen} options={{ title: "Quick Math" }} />
      <Stack.Screen name="Questions" component={QuestionsScreen} options={{ title: "Trivia" }} />
    </Stack.Navigator>
  );
}
