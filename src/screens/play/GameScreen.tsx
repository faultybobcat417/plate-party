import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useGameStore } from "../../stores/useGameStore";
import { supabase } from "../../lib/supabase";

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export function GameScreen() {
  const { user } = useAuth();
  const { startSession, submitAnswers } = useGameStore();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ questionId: string; selected: number; correct: boolean; timeMs: number }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<"loading" | "playing" | "finished">("loading");
  const [startTime, setStartTime] = useState(0);

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("game-session", { body: { action: "generate", count: 5 } });
      if (error) throw error;
      setQuestions(data.questions || []);
      setGameState("playing");
      setStartTime(Date.now());
    } catch (err: any) { Alert.alert("Error", err.message || "Failed to load game."); }
    finally { setLoading(false); }
  };

  const startGame = async () => {
    if (!user?.id) { Alert.alert("Error", "Please sign in to play."); return; }
    try {
      const session = await startSession(user.id, "trivia");
      setSessionId(session.id);
    } catch (err: any) { Alert.alert("Error", err.message); }
  };

  const handleAnswer = async (selectedIndex: number) => {
    const question = questions[currentIndex];
    const isCorrect = selectedIndex === question.correctIndex;
    const timeMs = Date.now() - startTime;
    const answer = { questionId: question.id, selected: selectedIndex, correct: isCorrect, timeMs };
    setSelectedAnswers((prev) => [...prev, answer]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setGameState("finished");
      if (sessionId) {
        await submitAnswers(sessionId, [...selectedAnswers, answer], timeMs);
        const score = [...selectedAnswers, answer].filter((a) => a.correct).length;
        Alert.alert("Game Over", `Score: ${score}/${questions.length}${score >= 4 ? "
+10 Plates!" : ""}`);
      }
    }
  };

  if (loading) return <View style={styles.container}><ActivityIndicator color="#FFD700" /></View>;

  if (gameState === "loading") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Trivia Challenge</Text>
        <Text style={styles.subtitle}>5 questions. 5 plates to play. 10 plates prize.</Text>
        <TouchableOpacity style={styles.button} onPress={startGame}><Text style={styles.buttonText}>Start Game (5 Plates)</Text></TouchableOpacity>
      </View>
    );
  }

  if (gameState === "finished") {
    const score = selectedAnswers.filter((a) => a.correct).length;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Over</Text>
        <Text style={styles.scoreText}>{score} / {questions.length}</Text>
        <TouchableOpacity style={styles.button} onPress={() => { setGameState("loading"); setCurrentIndex(0); setSelectedAnswers([]); fetchQuestions(); }}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const question = questions[currentIndex];
  return (
    <View style={styles.container}>
      <Text style={styles.progress}>Question {currentIndex + 1} / {questions.length}</Text>
      <Text style={styles.question}>{question.question}</Text>
      {question.options.map((opt, idx) => (
        <TouchableOpacity key={idx} style={styles.optionButton} onPress={() => handleAnswer(idx)}>
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default GameScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFD700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 32, textAlign: "center" },
  progress: { fontSize: 14, color: "#888", marginBottom: 16 },
  question: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 24, lineHeight: 28 },
  optionButton: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 12, padding: 16, marginBottom: 12 },
  optionText: { color: "#fff", fontSize: 16 },
  button: { backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#0a0a0a", fontSize: 16, fontWeight: "bold" },
  scoreText: { fontSize: 48, fontWeight: "bold", color: "#FFD700", textAlign: "center", marginVertical: 24 },
});
