import { useState, useCallback } from "react";
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
import { Input } from "../../components/primitives/Input";
import { Button } from "../../components/primitives/Button";
import { useGameStore } from "../../stores/useGameStore";
import { calculatePlates } from "../../api/game";
import type { PlayStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";

type PlayNav = NativeStackNavigationProp<PlayStackParamList>;

const WORDS = [
  "PIZZA", "BEACH", "MUSIC", "PARTY", "PLATE", "DANCE", "LAUGH", "SLEEP",
  "WATER", "FIRE", "SPACE", "PLANT", "DREAM", "SMILE", "BREAD", "CLOUD",
  "SHOES", "TIGER", "LEMON", "HAPPY",
];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)] ?? "PARTY";
}

export function WordGuessScreen() {
  const { userId: currentUserId } = useCurrentUser();
  const navigation = useNavigation<PlayNav>();
  const { recordGame } = useGameStore();

  const [word, setWord] = useState(getRandomWord());
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const maxWrong = 6;

  const init = useCallback(() => {
    setWord(getRandomWord());
    setGuessed(new Set());
    setWrong(0);
    setInput("");
    setInputError(null);
    setGameOver(false);
  }, []);

  const validateLetter = (value: string): string | null => {
    if (value.length === 0) return null;
    if (!/^[A-Za-z]$/.test(value)) return "Please enter a letter A–Z.";
    return null;
  };

  const handleGuess = (letter: string) => {
    const upper = letter.toUpperCase();
    if (gameOver || guessed.has(upper)) return;

    const newGuessed = new Set(guessed);
    newGuessed.add(upper);
    setGuessed(newGuessed);
    setInput("");
    setInputError(null);

    if (!word.includes(upper)) {
      const newWrong = wrong + 1;
      setWrong(newWrong);
      if (newWrong >= maxWrong) {
        setGameOver(true);
        void recordGame("word-guess", { won: false, score: 0, platesEarned: 0 });
        Alert.alert(`Game Over! The word was ${word}`, "", [
          { text: "Try Again", onPress: init },
          { text: "Done", onPress: () => navigation.goBack() },
        ]);
      }
    } else if (word.split("").every((c) => newGuessed.has(c))) {
      setGameOver(true);
      const score = Math.max(0, maxWrong - wrong);
      const plates = calculatePlates("word-guess", score, true);
      void recordGame("word-guess", { won: true, score, platesEarned: plates });
      Alert.alert("You Got It! 🎉", `Word: ${word}\nPlates: ${plates}`, [
        { text: "Play Again", onPress: init },
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleInputChange = (value: string) => {
    const lastChar = value.slice(-1);
    setInput(lastChar.toUpperCase());
    setInputError(validateLetter(lastChar));
  };

  const handleInputSubmit = () => {
    if (!input || inputError) return;
    handleGuess(input);
  };

  const displayWord = word
    .split("")
    .map((c) => (guessed.has(c) ? c : "_"))
    .join(" ");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const canSubmit = input.length === 1 && !inputError && !gameOver;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Word Guess</Text>
      <Text style={styles.subtitle}>Wrong guesses: {wrong}/{maxWrong}</Text>

      <Text style={styles.word}>{displayWord}</Text>

      <View style={styles.inputContainer}>
        <Input
          label="Type a letter"
          value={input}
          onChangeText={handleInputChange}
          maxLength={1}
          autoCapitalize="characters"
          placeholder="A"
          keyboardType="default"
          editable={!gameOver}
          error={inputError ?? undefined}
          onSubmitEditing={handleInputSubmit}
          accessibilityLabel="Letter guess input"
        />
        <Button
          title="Guess"
          onPress={handleInputSubmit}
          disabled={!canSubmit}
          variant="primary"
        />
      </View>

      <View style={styles.keyboard}>
        {alphabet.map((letter) => {
          const used = guessed.has(letter);
          const inWord = word.includes(letter);
          return (
            <Pressable
              key={letter}
              accessibilityRole="button"
              accessibilityLabel={`Letter ${letter}${used ? `, ${inWord ? "correct" : "wrong"}` : ""}`}
              accessibilityState={{ disabled: used || gameOver }}
              onPress={() => handleGuess(letter)}
              disabled={used || gameOver}
              style={({ pressed }) => [
                styles.key,
                used && (inWord ? styles.keyCorrect : styles.keyWrong),
                pressed && styles.keyPressed,
              ]}
            >
              <Text style={[styles.keyText, used && styles.keyTextUsed]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.controls}>
        <Button title="New Word" onPress={init} variant="secondary" />
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
  word: {
    color: colors.ink[900],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    letterSpacing: 4,
    marginBottom: spacing[4],
  },
  inputContainer: {
    alignItems: "center",
    marginBottom: spacing[4],
    width: 220,
  },
  keyboard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[2],
    maxWidth: 340,
    marginBottom: spacing[4],
  },
  key: {
    width: 44,
    height: 44,
    backgroundColor: colors.ash[200],
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  keyCorrect: {
    backgroundColor: "#10B981",
  },
  keyWrong: {
    backgroundColor: "#EF4444",
  },
  keyPressed: {
    opacity: 0.75,
  },
  keyText: {
    color: colors.ink[900],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  keyTextUsed: {
    color: colors.linen[100],
  },
  controls: {
    gap: spacing[3],
    width: 200,
  },
});
