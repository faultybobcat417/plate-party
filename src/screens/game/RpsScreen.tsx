import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useGameStore } from "../../stores/useGameStore";
import { calculatePlates } from "../../api/game";
import { useCurrentUser } from "../../hooks/useCurrentUser";

type Move = "rock" | "paper" | "scissors";

const MOVES: { id: Move; emoji: string; label: string }[] = [
  { id: "rock", emoji: "✊", label: "Rock" },
  { id: "paper", emoji: "✋", label: "Paper" },
  { id: "scissors", emoji: "✌️", label: "Scissors" },
];

function getWinner(a: Move, b: Move): "win" | "lose" | "draw" {
  if (a === b) return "draw";
  if (
    (a === "rock" && b === "scissors") ||
    (a === "paper" && b === "rock") ||
    (a === "scissors" && b === "paper")
  ) {
    return "win";
  }
  return "lose";
}

function randomMove(): Move {
  const moves: Move[] = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
}

export function RpsScreen() {
  const { userId: currentUserId } = useCurrentUser();
  const navigation = useNavigation();
  const { recordGame } = useGameStore();

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [round, setRound] = useState(0);
  const [lastResult, setLastResult] = useState<{ player: Move; ai: Move; result: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const maxRounds = 5;

  const handleMove = (move: Move) => {
    if (gameOver) return;

    const ai = randomMove();
    const result = getWinner(move, ai);
    const newRound = round + 1;

    let newPlayerScore = playerScore;
    let newAiScore = aiScore;

    if (result === "win") newPlayerScore++;
    else if (result === "lose") newAiScore++;

    setPlayerScore(newPlayerScore);
    setAiScore(newAiScore);
    setRound(newRound);
    setLastResult({ player: move, ai, result: result === "win" ? "You win!" : result === "lose" ? "AI wins!" : "Draw!" });

    if (newRound >= maxRounds) {
      setGameOver(true);
      const won = newPlayerScore > newAiScore;
      const score = newPlayerScore;
      const plates = calculatePlates("rps", score, won);
      recordGame("rps", { won, score, platesEarned: plates });

      setTimeout(() => {
        Alert.alert(
          won ? "You Won! 🎉" : "You Lost!",
          `Final: ${newPlayerScore}-${newAiScore}\nPlates: ${plates}`,
          [{ text: "Play Again", onPress: reset }, { text: "Done", onPress: () => navigation.goBack() }]
        );
      }, 500);
    }
  };

  const reset = () => {
    setPlayerScore(0);
    setAiScore(0);
    setRound(0);
    setLastResult(null);
    setGameOver(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Rock Paper Scissors</Text>
      <Text style={styles.subtitle}>Round {round}/{maxRounds} — {playerScore} vs {aiScore}</Text>

      {lastResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultEmoji}>
            {MOVES.find((m) => m.id === lastResult.player)?.emoji} vs {MOVES.find((m) => m.id === lastResult.ai)?.emoji}
          </Text>
          <Text style={styles.resultText}>{lastResult.result}</Text>
        </View>
      )}

      <View style={styles.moves}>
        {MOVES.map((move) => (
          <Pressable
            key={move.id}
            onPress={() => handleMove(move.id)}
            disabled={gameOver}
            style={({ pressed }) => [
              styles.moveButton,
              pressed && styles.moveButtonPressed,
              gameOver && styles.moveButtonDisabled,
            ]}
          >
            <Text style={styles.moveEmoji}>{move.emoji}</Text>
            <Text style={styles.moveLabel}>{move.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={reset} style={styles.resetButton}>
        <Text style={styles.resetText}>Reset</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
    alignItems: "center",
    padding: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  subtitle: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[4],
  },
  resultBox: {
    backgroundColor: colors.linen[50],
    borderRadius: 12,
    padding: spacing[4],
    alignItems: "center",
    marginBottom: spacing[4],
    minWidth: 200,
  },
  resultEmoji: {
    fontSize: 40,
    marginBottom: spacing[2],
  },
  resultText: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  moves: {
    flexDirection: "row",
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  moveButton: {
    backgroundColor: colors.glaze[600],
    width: 90,
    height: 90,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ink[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  moveButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  moveButtonDisabled: {
    opacity: 0.5,
  },
  moveEmoji: {
    fontSize: 36,
    marginBottom: spacing[1],
  },
  moveLabel: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  resetButton: {
    backgroundColor: colors.ash[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  resetText: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
  },
});
