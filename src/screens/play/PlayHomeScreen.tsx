import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, spacing, typography } from "../../theme";
import { OnlineUsersHeader } from "../../components/play/OnlineUsersHeader";
import type { PlayStackParamList } from "../../navigation/types";
import type { GameType } from "../../api/game";

const GAMES: { id: GameType; title: string; description: string; emoji: string }[] = [
  { id: "memory", title: "Memory Match", description: "Find the pairs", emoji: "🧠" },
  { id: "questions", title: "20 Questions", description: "Yes or no guessing", emoji: "❓" },
  { id: "quick-math", title: "Quick Math", description: "Speed arithmetic", emoji: "🔢" },
  { id: "rps", title: "Rock Paper Scissors", description: "Best of 5 wins", emoji: "✊" },
  { id: "tic-tac-toe", title: "Tic-Tac-Toe", description: "Classic 3x3 grid", emoji: "⭕" },
  { id: "word-guess", title: "Word Guess", description: "Guess the word", emoji: "🔤" },
];

type PlayNav = NativeStackNavigationProp<PlayStackParamList>;

export function PlayHomeScreen() {
  const navigation = useNavigation<PlayNav>();

  const renderGame = ({ item }: { item: typeof GAMES[0] }) => (
    <Pressable
      style={styles.gameCard}
      onPress={() => navigation.navigate("GameScreen", { gameId: item.id })}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}`}
    >
      <Text style={styles.gameEmoji}>{item.emoji}</Text>
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle}>{item.title}</Text>
        <Text style={styles.gameDesc}>{item.description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Play</Text>
        <Text style={styles.subtitle}>6 games. Win plates. Climb ranks.</Text>
        <OnlineUsersHeader />
      </View>
      <FlatList
        data={GAMES}
        renderItem={renderGame}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.linen[100],
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    position: "relative",
  },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    color: colors.ink[900],
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.ash[500],
    marginTop: spacing[1],
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[3],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameEmoji: {
    fontSize: 32,
    marginRight: spacing[4],
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink[900],
  },
  gameDesc: {
    fontSize: typography.sizes.sm,
    color: colors.ash[500],
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.ash[400],
  },
});
