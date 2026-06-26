import { useRoute, type RouteProp, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";

import { TicTacToeScreen } from "./TicTacToeScreen";
import { MemoryScreen } from "./MemoryScreen";
import { WordGuessScreen } from "./WordGuessScreen";
import { QuestionsScreen } from "./QuestionsScreen";
import { RpsScreen } from "./RpsScreen";
import { QuickMathScreen } from "./QuickMathScreen";
import { isGameType } from "../../api/game";
import { Button } from "../../components/primitives/Button";
import { colors, spacing, typography } from "../../theme";
import type { PlayStackParamList } from "../../navigation/types";

type GameRouteProp = RouteProp<PlayStackParamList, "GameScreen">;

export function GameScreen() {
  const route = useRoute<GameRouteProp>();
  const navigation = useNavigation();
  const { gameId } = route.params;

  if (!isGameType(gameId)) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>🎮</Text>
          <Text style={styles.errorTitle}>Unknown game</Text>
          <Text style={styles.errorMessage}>
            We couldn’t find “{gameId}”. It may have been removed or the link is invalid.
          </Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  switch (gameId) {
    case "tic-tac-toe":
      return <TicTacToeScreen />;
    case "memory":
      return <MemoryScreen />;
    case "word-guess":
      return <WordGuessScreen />;
    case "questions":
      return <QuestionsScreen />;
    case "rps":
      return <RpsScreen />;
    case "quick-math":
      return <QuickMathScreen />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  errorBox: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
  },
  errorIcon: {
    fontSize: typography.sizes["4xl"],
    marginBottom: spacing[4],
  },
  errorTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  errorMessage: {
    color: colors.ash[500],
    fontSize: typography.sizes.base,
    marginBottom: spacing[5],
    textAlign: "center",
  },
});
