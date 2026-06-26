import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { Button } from "../../components/primitives/Button";
import { useGameStore } from "../../stores/useGameStore";
import { calculatePlates } from "../../api/game";
import type { PlayStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";

type PlayNav = NativeStackNavigationProp<PlayStackParamList>;

type Cell = "X" | "O" | null;

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function TicTacToeScreen() {
  const { userId: currentUserId } = useCurrentUser();
  const navigation = useNavigation<PlayNav>();
  const { recordGame } = useGameStore();

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const checkWinner = useCallback((cells: Cell[]): Cell => {
    for (const [a, b, c] of WIN_LINES) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a];
      }
    }
    return null;
  }, []);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setXTurn(true);
    setGameOver(false);
  };

  const handlePress = (index: number) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = xTurn ? "X" : "O";
    setBoard(newBoard);
    setXTurn(!xTurn);

    const w = checkWinner(newBoard);
    if (w) {
      setGameOver(true);
      const plates = calculatePlates("tic-tac-toe", 1, true);
      void recordGame("tic-tac-toe", { won: true, score: 1, platesEarned: plates });
      Alert.alert(
        `${w} Wins! 🎉`,
        `You earned ${plates} plates!`,
        [
          { text: "Play Again", onPress: reset },
          { text: "Done", onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    if (newBoard.every((c) => c !== null)) {
      setGameOver(true);
      void recordGame("tic-tac-toe", { won: false, score: 0, platesEarned: 0 });
      Alert.alert("Draw!", "No winner this time.", [
        { text: "Play Again", onPress: reset },
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tic-Tac-Toe</Text>
        <Text style={styles.subtitle}>Take turns on one device. X goes first.</Text>
      </View>

      <View style={styles.board}>
        {board.map((cell, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Cell ${i + 1}, ${cell ?? "empty"}`}
            accessibilityState={{ disabled: cell !== null || gameOver }}
            disabled={cell !== null || gameOver}
            onPress={() => handlePress(i)}
            style={({ pressed }) => [
              styles.cell,
              (i % 3 !== 2) && styles.cellRight,
              (i < 6) && styles.cellBottom,
              pressed && styles.cellPressed,
            ]}
          >
            <Text style={[styles.cellText, cell === "X" ? styles.xText : styles.oText]}>
              {cell}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.controls}>
        <Button title="Reset Game" onPress={reset} variant="secondary" />
        <Button title="Back" onPress={() => navigation.goBack()} variant="ghost" />
      </View>
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
  header: {
    alignItems: "center",
    marginBottom: spacing[6],
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
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 300,
    height: 300,
  },
  cell: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  cellPressed: {
    opacity: 0.75,
  },
  cellRight: {
    borderRightWidth: 2,
    borderRightColor: colors.ash[300],
  },
  cellBottom: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ash[300],
  },
  cellText: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
  },
  xText: {
    color: "#3B82F6",
  },
  oText: {
    color: "#EF4444",
  },
  controls: {
    marginTop: spacing[6],
    gap: spacing[3],
    width: 200,
  },
});
