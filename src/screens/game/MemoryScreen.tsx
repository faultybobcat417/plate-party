import { useState, useEffect, useCallback } from "react";
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
import { shuffle } from "../../lib/random";

const EMOJIS = ["🍕", "🚀", "🐱", "🌵", "🎸", "💎", "🍦", "🎈"];

type Card = {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
};

export function MemoryScreen() {
  const { userId: currentUserId } = useCurrentUser();
  const navigation = useNavigation();
  const { recordGame } = useGameStore();

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const init = useCallback(() => {
    const pairs = shuffle([...EMOJIS, ...EMOJIS]);
    setCards(pairs.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })));
    setFlippedIds([]);
    setMoves(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (flippedIds.length === 2) {
      const [a, b] = flippedIds;
      const cardA = cards.find((c) => c.id === a)!;
      const cardB = cards.find((c) => c.id === b)!;

      setTimeout(() => {
        if (cardA.emoji === cardB.emoji) {
          setCards((prev) =>
            prev.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c))
          );
        } else {
          setCards((prev) =>
            prev.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c))
          );
        }
        setFlippedIds([]);
      }, 600);
    }
  }, [flippedIds, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched) && !gameOver) {
      setGameOver(true);
      const score = Math.max(0, 20 - moves);
      const plates = calculatePlates("memory", score, true);
      recordGame("memory", { won: true, score, platesEarned: plates });
      Alert.alert(
        "You Won! 🎉",
        `Moves: ${moves}\nScore: ${score}\nPlates: ${plates}`,
        [{ text: "Play Again", onPress: init }, { text: "Done", onPress: () => navigation.goBack() }]
      );
    }
  }, [cards, moves, gameOver, recordGame, init, navigation]);

  const handlePress = (id: number) => {
    if (flippedIds.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setFlippedIds((prev) => [...prev, id]);
    if (flippedIds.length === 0) setMoves((m) => m + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Memory Match</Text>
      <Text style={styles.subtitle}>Moves: {moves}</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable
            key={card.id}
            onPress={() => handlePress(card.id)}
            style={[
              styles.card,
              card.flipped && styles.cardFlipped,
              card.matched && styles.cardMatched,
            ]}
          >
            <Text style={styles.cardText}>
              {card.flipped || card.matched ? card.emoji : "?"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={init} style={styles.resetButton}>
        <Text style={styles.resetText}>New Game</Text>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[2],
    width: 340,
  },
  card: {
    width: 75,
    height: 75,
    backgroundColor: colors.glaze[600],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFlipped: {
    backgroundColor: colors.linen[50],
    borderWidth: 2,
    borderColor: colors.glaze[400],
  },
  cardMatched: {
    backgroundColor: "#10B981",
    opacity: 0.7,
  },
  cardText: {
    fontSize: 32,
  },
  resetButton: {
    marginTop: spacing[6],
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
