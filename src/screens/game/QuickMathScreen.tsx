import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { Input } from "../../components/primitives/Input";
import { Button } from "../../components/primitives/Button";
import { useGameStore } from "../../stores/useGameStore";
import { calculatePlates } from "../../api/game";
import type { PlayStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { pickRandom, randomInt } from "../../lib/random";

type PlayNav = NativeStackNavigationProp<PlayStackParamList>;

type Problem = {
  a: number;
  b: number;
  op: "+" | "-" | "×";
  answer: number;
};

function generateProblem(): Problem {
  const ops: ("+" | "-" | "×")[] = ["+", "-", "×"];
  const op = pickRandom(ops);
  let a = randomInt(12) + 1;
  let b = randomInt(12) + 1;

  if (op === "-") {
    if (a < b) [a, b] = [b, a];
  }
  if (op === "×") {
    a = randomInt(10) + 1;
    b = randomInt(10) + 1;
  }

  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { a, b, op, answer };
}

export function QuickMathScreen() {
  const { userId: currentUserId } = useCurrentUser();
  const navigation = useNavigation<PlayNav>();
  const { recordGame } = useGameStore();

  const [problem, setProblem] = useState<Problem>(generateProblem());
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);

  const init = useCallback(() => {
    setProblem(generateProblem());
    setInput("");
    setInputError(null);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
  }, []);

  const validateAnswer = (value: string): string | null => {
    if (value.length === 0) return null;
    if (!/^-?\d+$/.test(value)) return "Please enter a whole number.";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "Please enter a valid number.";
    return null;
  };

  useEffect(() => {
    if (timeLeft <= 0 && !gameOver) {
      setGameOver(true);
      const won = score > 0;
      const plates = calculatePlates("quick-math", score, won);
      void recordGame("quick-math", { won, score, platesEarned: plates });
      Alert.alert(
        "Time's Up! ⏰",
        `Score: ${score}\nPlates: ${plates}`,
        [
          { text: "Play Again", onPress: init },
          { text: "Done", onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameOver, score, recordGame, init, navigation]);

  const handleInputChange = (value: string) => {
    setInput(value);
    setInputError(validateAnswer(value));
  };

  const handleSubmit = () => {
    if (gameOver) return;
    if (inputError || !input) return;

    const guess = parseInt(input, 10);
    if (!Number.isFinite(guess)) return;

    if (guess === problem.answer) {
      setScore((s) => s + 1);
    }
    setProblem(generateProblem());
    setInput("");
    setInputError(null);
  };

  const canSubmit = input.length > 0 && !inputError && !gameOver;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Quick Math</Text>
      <Text style={styles.subtitle}>Time: {timeLeft}s | Score: {score}</Text>

      <View style={styles.problemBox}>
        <Text style={styles.problemText}>
          {problem.a} {problem.op} {problem.b} = ?
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Input
          label="Your answer"
          value={input}
          onChangeText={handleInputChange}
          keyboardType="numeric"
          placeholder="0"
          editable={!gameOver}
          error={inputError ?? undefined}
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Math answer input"
        />
        <Button
          title="Submit"
          onPress={handleSubmit}
          disabled={!canSubmit}
          variant="primary"
        />
      </View>

      <View style={styles.controls}>
        <Button title="Reset" onPress={init} variant="secondary" />
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
  problemBox: {
    backgroundColor: colors.linen[50],
    borderRadius: 16,
    padding: spacing[6],
    alignItems: "center",
    marginBottom: spacing[4],
    minWidth: 250,
  },
  problemText: {
    color: colors.ink[900],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
  },
  inputContainer: {
    alignItems: "center",
    marginBottom: spacing[4],
    width: 220,
  },
  controls: {
    gap: spacing[3],
    width: 200,
  },
});
