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
import { pickRandom } from "../../lib/random";

const ITEMS = [
  { name: "Pizza", clues: ["Italian", "Cheesy", "Round", "Slice it", "Pepperoni"] },
  { name: "Elephant", clues: ["Big ears", "Trunk", "Gray", "Savanna", "Tusks"] },
  { name: "Guitar", clues: ["Strings", "Music", "Strum", "Wood", "Six"] },
  { name: "Ocean", clues: ["Blue", "Waves", "Salt", "Deep", "Fish"] },
  { name: "Airplane", clues: ["Fly", "Wings", "Sky", "Pilot", "Jet"] },
  { name: "Snowman", clues: ["Cold", "Carrot", "White", "Melt", "Frosty"] },
  { name: "Rainbow", clues: ["Colors", "Sky", "Arc", "After rain", "Seven"] },
  { name: "Castle", clues: ["King", "Towers", "Moat", "Medieval", "Stone"] },
  { name: "Robot", clues: ["Metal", "Beep", "AI", "Machine", "Future"] },
  { name: "Dragon", clues: ["Fire", "Scales", "Wings", "Myth", "Treasure"] },
];

function getRandomItem() {
  return pickRandom(ITEMS);
}

export function QuestionsScreen() {
  const { userId: currentUserId } = useCurrentUser();
  const navigation = useNavigation();
  const { recordGame } = useGameStore();

  const [item, setItem] = useState(getRandomItem());
  const [questionCount, setQuestionCount] = useState(0);
  const [guessed, setGuessed] = useState(false);
  const [revealedClues, setRevealedClues] = useState(0);

  const init = () => {
    setItem(getRandomItem());
    setQuestionCount(0);
    setGuessed(false);
    setRevealedClues(0);
  };

  const askQuestion = () => {
    if (questionCount < 20 && revealedClues < item.clues.length) {
      setQuestionCount((q) => q + 1);
      setRevealedClues((r) => r + 1);
    }
  };

  const makeGuess = (guessName: string) => {
    if (guessed) return;
    setGuessed(true);

    const finalQuestions = questionCount + 1;
    if (guessName === item.name) {
      const score = Math.max(0, 20 - finalQuestions);
      const plates = calculatePlates("questions", score, true);
      recordGame("questions", { won: true, score, platesEarned: plates });
      Alert.alert(
        "Correct! 🎉",
        `It was ${item.name}!\nQuestions: ${finalQuestions}\nPlates: ${plates}`,
        [{ text: "Next Item", onPress: init }, { text: "Done", onPress: () => navigation.goBack() }]
      );
    } else {
      recordGame("questions", { won: false, score: 0, platesEarned: 0 });
      Alert.alert(`Wrong! It was ${item.name}`, "", [
        { text: "Try Again", onPress: init },
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>20 Questions</Text>
      <Text style={styles.subtitle}>Questions asked: {questionCount}/20</Text>

      <View style={styles.clueBox}>
        <Text style={styles.clueLabel}>Clues revealed:</Text>
        {item.clues.slice(0, revealedClues).map((clue, i) => (
          <Text key={i} style={styles.clueText}>• {clue}</Text>
        ))}
        {revealedClues === 0 && <Text style={styles.clueEmpty}>No clues yet. Ask a question!</Text>}
      </View>

      <Pressable
        onPress={askQuestion}
        disabled={questionCount >= 20 || revealedClues >= item.clues.length}
        style={({ pressed }) => [
          styles.askButton,
          (questionCount >= 20 || revealedClues >= item.clues.length) && styles.askButtonDisabled,
          pressed && styles.askButtonPressed,
        ]}
      >
        <Text style={styles.askButtonText}>Ask Question (+1 clue)</Text>
      </Pressable>

      <Text style={styles.guessLabel}>Make your guess:</Text>
      <View style={styles.guessGrid}>
        {ITEMS.slice(0, 6).map((opt) => (
          <Pressable
            key={opt.name}
            onPress={() => makeGuess(opt.name)}
            disabled={guessed}
            style={({ pressed }) => [
              styles.guessButton,
              guessed && styles.guessButtonDisabled,
              pressed && styles.guessButtonPressed,
            ]}
          >
            <Text style={styles.guessButtonText}>{opt.name}</Text>
          </Pressable>
        ))}
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
  clueBox: {
    backgroundColor: colors.linen[50],
    borderRadius: 12,
    padding: spacing[4],
    width: "100%",
    marginBottom: spacing[4],
    minHeight: 120,
  },
  clueLabel: {
    color: colors.ink[700],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  clueText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginBottom: spacing[1],
  },
  clueEmpty: {
    color: colors.ash[400],
    fontStyle: "italic",
  },
  askButton: {
    backgroundColor: colors.glaze[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  askButtonDisabled: {
    opacity: 0.5,
  },
  askButtonPressed: {
    opacity: 0.85,
  },
  askButtonText: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
  },
  guessLabel: {
    color: colors.ink[700],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  guessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[2],
  },
  guessButton: {
    backgroundColor: colors.ash[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
  guessButtonDisabled: {
    opacity: 0.5,
  },
  guessButtonPressed: {
    opacity: 0.8,
  },
  guessButtonText: {
    color: colors.ink[900],
    fontWeight: typography.weights.semibold,
  },
});
