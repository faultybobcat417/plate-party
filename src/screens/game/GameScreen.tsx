import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import type { GameSessionRecord, GameType } from "../../api/game";
import type { JsonObject, JsonValue } from "../../api/_shared";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { EmptyState } from "../../components/composite/EmptyState";
import { Input } from "../../components/primitives/Input";
import type { PlayStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGameStore } from "../../stores/useGameStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PlayStackParamList, "GameScreen">;
type PlayerMark = "X" | "O";
type RpsChoice = "rock" | "paper" | "scissors";

const WORDS = ["PLATE", "PARTY", "GLAZE", "STEAK", "GAMES", "GOALS"];
const RPS_CHOICES: RpsChoice[] = ["rock", "paper", "scissors"];
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;
const MEMORY_SYMBOLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const QUESTIONS = [
  { prompt: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter"], answer: "Mars" },
  { prompt: "How many sides does a hexagon have?", options: ["5", "6", "8"], answer: "6" },
  { prompt: "What gas do plants absorb?", options: ["Oxygen", "Carbon dioxide", "Hydrogen"], answer: "Carbon dioxide" },
  { prompt: "What is 9 x 7?", options: ["56", "63", "72"], answer: "63" },
  { prompt: "Which ocean is largest?", options: ["Atlantic", "Indian", "Pacific"], answer: "Pacific" },
];

export function GameScreen({ route, navigation }: Props) {
  const { gameId, sessionId } = route.params;
  const { userId } = useCurrentUser();
  const { currentSession, isLoading, error, pollSession, submitGameMove, resolveSession } = useGameStore();
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!sessionId) return undefined;
    void pollSession(sessionId);
    const interval = setInterval(() => {
      void pollSession(sessionId);
    }, 2000);

    const channel = supabase
      .channel(`game-session:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
        () => {
          void pollSession(sessionId);
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [pollSession, sessionId]);

  const session = currentSession?.id === sessionId ? currentSession : null;

  const submitMove = useCallback(
    async (move: JsonObject) => {
      if (!sessionId) return null;
      return submitGameMove({
        sessionId,
        move,
        turnNumber: session?.answers.length ?? 0,
      });
    },
    [session?.answers.length, sessionId, submitGameMove],
  );

  const resolve = useCallback(async () => {
    if (!sessionId) return;
    setResolving(true);
    try {
      await resolveSession(sessionId);
    } catch (caught) {
      Alert.alert("Game not settled", caught instanceof Error ? caught.message : "The server could not resolve this game yet.");
    } finally {
      setResolving(false);
    }
  }, [resolveSession, sessionId]);

  if (!sessionId) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <EmptyState
          icon="🎮"
          title="Wager required"
          message="Start games from the Play tab so both players confirm an equal plate stake first."
          actionLabel="Back to Play"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (isLoading && !session) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ActivityIndicator color={colors.glaze[600]} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <EmptyState
          icon="🎮"
          title="Game not loaded"
          message={error ?? "Pull back and try starting the match again."}
          actionLabel="Back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PLAY</Text>
            <Text style={styles.title}>{formatGameType(gameId)}</Text>
            <Text style={styles.subtitle}>{session.wagerAmount ?? 0} plates escrowed · {session.status}</Text>
          </View>
          <Button title="Back" size="sm" variant="ghost" onPress={() => navigation.goBack()} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {gameId === "rps" ? (
          <RpsGame session={session} userId={userId} onMove={submitMove} onResolve={resolve} resolving={resolving} />
        ) : null}
        {gameId === "tic-tac-toe" ? (
          <TicTacToeGame session={session} userId={userId} onMove={submitMove} onResolve={resolve} resolving={resolving} />
        ) : null}
        {gameId === "word-guess" ? (
          <WordGuessGame session={session} onMove={submitMove} onResolve={resolve} resolving={resolving} />
        ) : null}
        {gameId === "quick-math" ? (
          <QuickMathGame session={session} onMove={submitMove} onResolve={resolve} resolving={resolving} />
        ) : null}
        {gameId === "memory" ? (
          <MemoryGame session={session} onMove={submitMove} onResolve={resolve} resolving={resolving} />
        ) : null}
        {gameId === "questions" ? (
          <QuestionsGame session={session} onMove={submitMove} onResolve={resolve} resolving={resolving} />
        ) : null}

        <MoveLog session={session} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RpsGame({
  session,
  userId,
  onMove,
  onResolve,
  resolving,
}: {
  session: GameSessionRecord;
  userId: string | null;
  onMove: (move: JsonObject) => Promise<GameSessionRecord | null>;
  onResolve: () => Promise<void>;
  resolving: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(30);
  const ownMove = getMoves(session, "rps-choice").find((move) => move.userId === userId);
  const choices = getMoves(session, "rps-choice");
  const readyToResolve = choices.length >= 2 || Boolean(ownMove && timeLeft <= 0);

  useEffect(() => {
    if (ownMove || timeLeft <= 0) return undefined;
    const timer = setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [ownMove, timeLeft]);

  useEffect(() => {
    if (!ownMove && timeLeft === 0) {
      void onMove({ type: "rps-forfeit", reason: "timer-expired" });
    }
  }, [onMove, ownMove, timeLeft]);

  return (
    <Card style={styles.gamePanel}>
      <Text style={styles.panelTitle}>Choose before the turn timer ends</Text>
      <Text style={styles.timer}>{timeLeft}s</Text>
      <View style={styles.choiceRow}>
        {RPS_CHOICES.map((choice) => (
          <Pressable
            key={choice}
            disabled={Boolean(ownMove)}
            onPress={() => void onMove({ type: "rps-choice", choice })}
            style={[styles.choiceButton, ownMove && styles.disabled]}
          >
            <Text style={styles.choiceText}>{choice}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.helper}>{ownMove ? "Move submitted. Waiting for the opponent or server settlement." : "Your move is sent to the server immediately."}</Text>
      {readyToResolve ? <Button title="Settle With Server" loading={resolving} onPress={() => void onResolve()} /> : null}
    </Card>
  );
}

function TicTacToeGame({
  session,
  userId,
  onMove,
  onResolve,
  resolving,
}: {
  session: GameSessionRecord;
  userId: string | null;
  onMove: (move: JsonObject) => Promise<GameSessionRecord | null>;
  onResolve: () => Promise<void>;
  resolving: boolean;
}) {
  const moves = getMoves(session, "tic-tac-toe-move");
  const board = buildBoard(moves);
  const playerMark = getPlayerMark(session, userId);
  const nextMark: PlayerMark = moves.length % 2 === 0 ? "X" : "O";
  const winner = getBoardWinner(board);
  const isTie = !winner && board.every(Boolean);
  const canMove = playerMark === nextMark && !winner && !isTie;

  return (
    <Card style={styles.gamePanel}>
      <Text style={styles.panelTitle}>Standard Rules</Text>
      <Text style={styles.helper}>You are {playerMark}. Current turn: {nextMark}.</Text>
      <View style={styles.board}>
        {board.map((cell, index) => (
          <Pressable
            key={index}
            disabled={!canMove || Boolean(cell)}
            onPress={() => void onMove({ type: "tic-tac-toe-move", cell: index, mark: playerMark })}
            style={[styles.cell, cell && styles.cellFilled]}
          >
            <Text style={styles.cellText}>{cell}</Text>
          </Pressable>
        ))}
      </View>
      {winner || isTie ? (
        <Button title={winner ? `Resolve ${winner} Win` : "Resolve Tie"} loading={resolving} onPress={() => void onResolve()} />
      ) : null}
    </Card>
  );
}

function WordGuessGame({
  session,
  onMove,
  onResolve,
  resolving,
}: {
  session: GameSessionRecord;
  onMove: (move: JsonObject) => Promise<GameSessionRecord | null>;
  onResolve: () => Promise<void>;
  resolving: boolean;
}) {
  const word = pickSeeded(WORDS, session.id);
  const guesses = getMoves(session, "word-guess");
  const [guess, setGuess] = useState("");
  const completed = guesses.some((move) => move.solved === true) || guesses.length >= 6;

  const submitGuess = async () => {
    const normalized = guess.trim().toUpperCase();
    if (!/^[A-Z]{5}$/.test(normalized)) {
      Alert.alert("Five letters", "Enter a five-letter word.");
      return;
    }
    const solved = normalized === word;
    await onMove({
      type: "word-guess",
      guess: normalized,
      attempt: guesses.length + 1,
      solved,
      score: solved ? Math.max(1, 7 - guesses.length) : 0,
    });
    setGuess("");
  };

  return (
    <Card style={styles.gamePanel}>
      <Text style={styles.panelTitle}>Five-letter word, six attempts</Text>
      <Text style={styles.maskedWord}>{completed ? word : maskWord(word, guesses)}</Text>
      <Input label="Guess" value={guess} maxLength={5} autoCapitalize="characters" onChangeText={setGuess} editable={!completed} />
      <Button title="Submit Guess" disabled={completed} onPress={() => void submitGuess()} />
      {completed ? <Button title="Settle With Server" loading={resolving} onPress={() => void onResolve()} /> : null}
    </Card>
  );
}

function QuickMathGame({
  session,
  onMove,
  onResolve,
  resolving,
}: {
  session: GameSessionRecord;
  onMove: (move: JsonObject) => Promise<GameSessionRecord | null>;
  onResolve: () => Promise<void>;
  resolving: boolean;
}) {
  const moves = getMoves(session, "quick-math-answer");
  const problem = getMathProblem(session.id, moves.length);
  const [answer, setAnswer] = useState("");
  const completed = moves.length >= 10;
  const score = moves.filter((move) => move.correct === true).length;

  const submitAnswer = async () => {
    const numeric = Number(answer.trim());
    if (!Number.isInteger(numeric)) {
      Alert.alert("Whole number only", "Enter a whole-number answer.");
      return;
    }
    await onMove({
      type: "quick-math-answer",
      problemIndex: moves.length,
      answer: numeric,
      correct: numeric === problem.answer,
      score: numeric === problem.answer ? 1 : 0,
    });
    setAnswer("");
  };

  return (
    <Card style={styles.gamePanel}>
      <Text style={styles.panelTitle}>10 problems, fastest wins</Text>
      <Text style={styles.score}>Score {score}/10</Text>
      {!completed ? (
        <>
          <Text style={styles.problem}>{problem.prompt}</Text>
          <Input label="Answer" value={answer} keyboardType="numeric" onChangeText={setAnswer} />
          <Button title="Submit Answer" onPress={() => void submitAnswer()} />
        </>
      ) : (
        <Button title="Settle With Server" loading={resolving} onPress={() => void onResolve()} />
      )}
    </Card>
  );
}

function MemoryGame({
  session,
  onMove,
  onResolve,
  resolving,
}: {
  session: GameSessionRecord;
  onMove: (move: JsonObject) => Promise<GameSessionRecord | null>;
  onResolve: () => Promise<void>;
  resolving: boolean;
}) {
  const deck = getMemoryDeck(session.id);
  const moves = getMoves(session, "memory-pair");
  const matchedIndexes = new Set(moves.flatMap((move) => [numberValue(move.first), numberValue(move.second)]).filter(isNumber));
  const [selected, setSelected] = useState<number[]>([]);
  const completed = matchedIndexes.size === deck.length;

  const chooseCard = async (index: number) => {
    if (matchedIndexes.has(index) || selected.includes(index)) return;
    const next = [...selected, index];
    setSelected(next);
    if (next.length === 2) {
      const [first, second] = next;
      const matched = deck[first] === deck[second];
      await onMove({ type: "memory-pair", first, second, matched, moves: moves.length + 1 });
      setSelected([]);
    }
  };

  return (
    <Card style={styles.gamePanel}>
      <Text style={styles.panelTitle}>Fewest moves wins</Text>
      <Text style={styles.score}>Moves {moves.length}</Text>
      <View style={styles.memoryGrid}>
        {deck.map((symbol, index) => {
          const revealed = matchedIndexes.has(index) || selected.includes(index);
          return (
            <Pressable key={index} onPress={() => void chooseCard(index)} style={[styles.memoryCard, revealed && styles.memoryCardOpen]}>
              <Text style={styles.memoryText}>{revealed ? symbol : "?"}</Text>
            </Pressable>
          );
        })}
      </View>
      {completed ? <Button title="Settle With Server" loading={resolving} onPress={() => void onResolve()} /> : null}
    </Card>
  );
}

function QuestionsGame({
  session,
  onMove,
  onResolve,
  resolving,
}: {
  session: GameSessionRecord;
  onMove: (move: JsonObject) => Promise<GameSessionRecord | null>;
  onResolve: () => Promise<void>;
  resolving: boolean;
}) {
  const answers = getMoves(session, "trivia-answer");
  const question = QUESTIONS[answers.length];
  const score = answers.filter((move) => move.correct === true).length;
  const completed = !question;

  return (
    <Card style={styles.gamePanel}>
      <Text style={styles.panelTitle}>5 questions, highest score wins</Text>
      <Text style={styles.score}>Score {score}/5</Text>
      {question ? (
        <>
          <Text style={styles.problem}>{question.prompt}</Text>
          <View style={styles.answerList}>
            {question.options.map((option) => (
              <Pressable
                key={option}
                onPress={() => void onMove({ type: "trivia-answer", answer: option, correct: option === question.answer, score: option === question.answer ? 1 : 0 })}
                style={styles.answerButton}
              >
                <Text style={styles.answerText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <Button title="Settle With Server" loading={resolving} onPress={() => void onResolve()} />
      )}
    </Card>
  );
}

function MoveLog({ session }: { session: GameSessionRecord }) {
  return (
    <Card style={styles.gamePanel}>
      <Text style={styles.panelTitle}>Server Move Log</Text>
      <Text style={styles.helper}>{session.answers.length} submitted move{session.answers.length === 1 ? "" : "s"} synced by polling and Realtime.</Text>
    </Card>
  );
}

function getMoves(session: GameSessionRecord, type: string): JsonObject[] {
  return session.answers.filter((answer): answer is JsonObject => isRecord(answer) && answer.type === type);
}

function buildBoard(moves: JsonObject[]): (PlayerMark | null)[] {
  const board: (PlayerMark | null)[] = Array(9).fill(null);
  moves.forEach((move) => {
    const cell = numberValue(move.cell);
    const mark = move.mark === "X" || move.mark === "O" ? move.mark : null;
    if (cell !== null && cell >= 0 && cell < 9 && mark && !board[cell]) {
      board[cell] = mark;
    }
  });
  return board;
}

function getBoardWinner(board: (PlayerMark | null)[]): PlayerMark | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function getPlayerMark(session: GameSessionRecord, userId: string | null): PlayerMark {
  if (session.player2Id && userId === session.player2Id) return "O";
  return "X";
}

function pickSeeded<T>(items: readonly T[], seed: string): T {
  return items[seedNumber(seed, 0) % items.length] as T;
}

function maskWord(word: string, guesses: JsonObject[]): string {
  const letters = new Set(guesses.flatMap((guess) => String(guess.guess ?? "").split("")));
  return word.split("").map((letter) => (letters.has(letter) ? letter : "_")).join(" ");
}

function getMathProblem(seed: string, index: number): { prompt: string; answer: number } {
  const a = (seedNumber(seed, index) % 12) + 1;
  const b = (seedNumber(seed, index + 31) % 12) + 1;
  const opIndex = seedNumber(seed, index + 71) % 3;
  if (opIndex === 0) return { prompt: `${a} + ${b} = ?`, answer: a + b };
  if (opIndex === 1) return { prompt: `${Math.max(a, b)} - ${Math.min(a, b)} = ?`, answer: Math.max(a, b) - Math.min(a, b) };
  return { prompt: `${a} x ${b} = ?`, answer: a * b };
}

function getMemoryDeck(seed: string): string[] {
  const deck = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS];
  return deck
    .map((symbol, index) => ({ symbol, order: seedNumber(seed, index) }))
    .sort((a, b) => a.order - b.order)
    .map((item) => item.symbol);
}

function seedNumber(seed: string, salt: number): number {
  let hash = 2166136261 + salt;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function numberValue(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isNumber(value: number | null): value is number {
  return typeof value === "number";
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatGameType(value: GameType): string {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  loader: {
    marginTop: spacing[10],
  },
  scroll: {
    gap: spacing[4],
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.glaze[300],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  errorText: {
    color: colors.wine[300],
    fontSize: typography.sizes.sm,
  },
  gamePanel: {
    gap: spacing[3],
  },
  panelTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  helper: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  timer: {
    color: colors.glaze[700],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
  },
  choiceRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  choiceButton: {
    alignItems: "center",
    backgroundColor: colors.glaze[600],
    borderRadius: 12,
    flex: 1,
    padding: spacing[3],
  },
  choiceText: {
    color: colors.black,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: "capitalize",
  },
  disabled: {
    opacity: 0.5,
  },
  board: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    height: 276,
    width: 276,
  },
  cell: {
    alignItems: "center",
    backgroundColor: colors.neutral[900],
    borderColor: colors.neutral[700],
    borderRadius: 8,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    margin: 2,
    width: 88,
  },
  cellFilled: {
    backgroundColor: colors.glaze[100],
  },
  cellText: {
    color: colors.glaze[800],
    fontSize: 42,
    fontWeight: typography.weights.bold,
  },
  maskedWord: {
    color: colors.glaze[700],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  score: {
    color: colors.glaze[700],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  problem: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  memoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    justifyContent: "center",
  },
  memoryCard: {
    alignItems: "center",
    backgroundColor: colors.neutral[900],
    borderRadius: 10,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  memoryCardOpen: {
    backgroundColor: colors.glaze[100],
  },
  memoryText: {
    color: colors.glaze[800],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  answerList: {
    gap: spacing[2],
  },
  answerButton: {
    backgroundColor: colors.neutral[900],
    borderColor: colors.neutral[700],
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing[3],
  },
  answerText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
