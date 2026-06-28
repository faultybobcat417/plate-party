import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  submitTriviaGameResult,
  type TriviaAnswer,
} from "../../api/challenges";
import { Button } from "../../components/primitives/Button";
import type { PartyStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "GameScreen">;

const TRIVIA_QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
    category: "Geography",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    category: "Science",
  },
  {
    question: "What is 2 + 2 x 2?",
    options: ["6", "8", "4", "10"],
    correctIndex: 0,
    category: "Math",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"],
    correctIndex: 2,
    category: "Art",
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctIndex: 3,
    category: "Geography",
  },
] as const;

const QUESTION_SECONDS = 15;

export function GameScreen({ navigation, route }: Props) {
  const { challengeId } = route.params;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<TriviaAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());
  const [gameStartedAt] = useState(() => Date.now());
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const question = TRIVIA_QUESTIONS[questionIndex];
  const progress = (questionIndex + 1) / TRIVIA_QUESTIONS.length;
  const accuracy = useMemo(() => {
    if (!answers.length) return 0;
    const correct = answers.filter((answer) => answer.correct).length;
    return Math.round((correct / answers.length) * 100);
  }, [answers]);
  const totalTimeMs = Date.now() - gameStartedAt;

  const moveNext = useCallback(() => {
    if (questionIndex >= TRIVIA_QUESTIONS.length - 1) {
      setComplete(true);
      return;
    }

    setQuestionIndex((previous) => previous + 1);
    setTimeLeft(QUESTION_SECONDS);
    setSelectedIndex(null);
    setFeedback(null);
    setQuestionStartedAt(Date.now());
  }, [questionIndex]);

  const answerQuestion = useCallback((optionIndex: number | null, timedOut = false) => {
    if (selectedIndex !== null || complete) return;

    const elapsedMs = Date.now() - questionStartedAt;
    const correct = optionIndex === question.correctIndex;
    const points = correct ? 10 + (elapsedMs < 5000 ? 5 : 0) : 0;
    const answer: TriviaAnswer = {
      questionIndex,
      selectedIndex: optionIndex,
      correctIndex: question.correctIndex,
      correct,
      elapsedMs,
      timedOut,
    };

    setSelectedIndex(optionIndex);
    setScore((previous) => previous + points);
    setAnswers((previous) => [...previous, answer]);
    setFeedback(timedOut ? "Time's up!" : correct ? `Correct! +${points}` : "Wrong!");
    setTimeout(moveNext, 1000);
  }, [complete, moveNext, question.correctIndex, questionIndex, questionStartedAt, selectedIndex]);

  useEffect(() => {
    if (complete || selectedIndex !== null) return;
    if (timeLeft <= 0) {
      answerQuestion(null, true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((previous) => previous - 1), 1000);
    return () => clearTimeout(timer);
  }, [answerQuestion, complete, selectedIndex, timeLeft]);

  const submitResults = useCallback(async () => {
    const finalTimeMs = Date.now() - gameStartedAt;
    const flaggedReason = answers.length === TRIVIA_QUESTIONS.length && finalTimeMs < 5000
      ? `Suspicious trivia completion time: ${finalTimeMs}ms`
      : undefined;

    if (flaggedReason) {
      console.warn(flaggedReason);
    }

    setSubmitting(true);
    try {
      await submitTriviaGameResult({
        challengeId,
        score,
        answers,
        timeTakenMs: finalTimeMs,
        flaggedReason,
      });
      navigation.replace("ChallengeDetail", { challengeId });
    } catch (caught) {
      Alert.alert("Could not submit results", caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, challengeId, gameStartedAt, navigation, score]);

  if (complete) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.completeContent}>
          <Text style={styles.completeTitle}>Game Complete</Text>
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>Final Score</Text>

          <View style={styles.resultsGrid}>
            <ResultStat label="Accuracy" value={`${accuracy}%`} />
            <ResultStat label="Time" value={formatDuration(totalTimeMs)} />
          </View>

          <Button
            title="Submit Results"
            size="lg"
            loading={submitting}
            disabled={submitting}
            onPress={() => void submitResults()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.gameContent}>
        <View style={styles.topBar}>
          <View style={styles.questionMeta}>
            <Text style={styles.progressText}>Question {questionIndex + 1}/{TRIVIA_QUESTIONS.length}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { flex: progress }]} />
              <View style={{ flex: 1 - progress }} />
            </View>
          </View>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{question.category}</Text>
        </View>

        <View style={[styles.timerCircle, { borderColor: timerColor(timeLeft) }]}>
          <Text style={[styles.timerText, { color: timerColor(timeLeft) }]}>{timeLeft}</Text>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsGrid}>
          {question.options.map((option, index) => {
            const answered = selectedIndex !== null;
            const selected = selectedIndex === index;
            const correct = index === question.correctIndex;
            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="button"
                disabled={answered}
                key={option}
                onPress={() => answerQuestion(index)}
                style={[
                  styles.answerButton,
                  answered && correct ? styles.answerCorrect : null,
                  answered && selected && !correct ? styles.answerWrong : null,
                ]}
              >
                <Text style={styles.answerText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {feedback ? (
          <View style={styles.feedbackOverlay}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        ) : null}

        {submitting ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator color={colors.glaze[500]} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultStat}>
      <Text style={styles.resultValue}>{value}</Text>
      <Text style={styles.resultLabel}>{label}</Text>
    </View>
  );
}

function timerColor(timeLeft: number): string {
  if (timeLeft <= 3) return colors.lose;
  if (timeLeft <= 8) return colors.gold;
  return colors.white;
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}:${String(remainder).padStart(2, "0")}` : `${remainder}s`;
}

export default GameScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink[900],
    flex: 1,
  },
  gameContent: {
    flex: 1,
    gap: spacing[4],
    padding: spacing[5],
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4],
    justifyContent: "space-between",
  },
  questionMeta: {
    flex: 1,
    gap: spacing[2],
  },
  progressText: {
    color: colors.ash[300],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  progressTrack: {
    backgroundColor: colors.ink[700],
    borderRadius: 999,
    flexDirection: "row",
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.glaze[500],
  },
  scoreText: {
    color: colors.gold,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  categoryText: {
    color: colors.ash[300],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  timerCircle: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 44,
    borderWidth: 4,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  timerText: {
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
  },
  questionText: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights["2xl"],
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  answerButton: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 2,
    flexBasis: "47%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 112,
    padding: spacing[4],
  },
  answerCorrect: {
    borderColor: colors.win,
  },
  answerWrong: {
    borderColor: colors.lose,
  },
  answerText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: "center",
  },
  feedbackOverlay: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.glaze[500],
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  feedbackText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  submittingRow: {
    alignItems: "center",
  },
  completeContent: {
    flex: 1,
    gap: spacing[5],
    justifyContent: "center",
    padding: spacing[5],
  },
  completeTitle: {
    color: colors.white,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  finalScore: {
    color: colors.gold,
    fontSize: typography.sizes["5xl"],
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  finalLabel: {
    color: colors.ash[400],
    fontSize: typography.sizes.base,
    textAlign: "center",
  },
  resultsGrid: {
    flexDirection: "row",
    gap: spacing[3],
  },
  resultStat: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: spacing[4],
  },
  resultValue: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  resultLabel: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
});
