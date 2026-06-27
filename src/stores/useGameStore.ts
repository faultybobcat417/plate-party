import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { GameSession } from "../db/schema";
import type { Game } from "../types/game";

type GameAnswer = {
  correct?: boolean;
  [key: string]: unknown;
};

type RecordedGameResult = {
  won: boolean;
  score: number;
  platesEarned: number;
};

interface GameState {
  sessions: GameSession[];
  games: Game[];
  currentSession: GameSession | null;
  loading: boolean;
  isLoading: boolean;
  onlineCount: number;
  startSession: (userId: string, gameType: string) => Promise<GameSession>;
  submitAnswers: (sessionId: string, answers: GameAnswer[], timeTakenMs: number) => Promise<void>;
  fetchSessions: (userId: string) => Promise<void>;
  fetchGames: (userId?: string) => Promise<void>;
  recordGame: (gameType: string, result: number | RecordedGameResult, won?: boolean) => Promise<void>;
}

export const useGameStore = create<GameState>((set) => ({
  sessions: [],
  games: [
    { id: "word-guess", title: "Word Guess", description: "Solve the word before time runs out.", prize: 15 },
    { id: "rps", title: "Rock Paper Scissors", description: "Fast wager-friendly classic.", prize: 5 },
    { id: "tic-tac-toe", title: "Tic Tac Toe", description: "Three in a row wins.", prize: 10 },
    { id: "memory", title: "Memory", description: "Match cards and beat your score.", prize: 5 },
    { id: "quick-math", title: "Quick Math", description: "Answer as many as you can.", prize: 10 },
    { id: "questions", title: "Questions", description: "Trivia for plates.", prize: 20 },
  ],
  currentSession: null,
  loading: false,
  isLoading: false,
  onlineCount: 0,
  startSession: async (userId: string, gameType: string) => {
    const { data, error } = await supabase.from("game_sessions").insert({ user_id: userId, game_type: gameType, status: "playing" }).select().single();
    if (error) throw error;
    const session = data as GameSession;
    set({ currentSession: session });
    return session;
  },
  submitAnswers: async (sessionId: string, answers: GameAnswer[], timeTakenMs: number) => {
    const score = answers.filter((a) => a.correct).length;
    const { data, error } = await supabase.from("game_sessions").update({ score, answers, time_taken_ms: timeTakenMs, status: "completed", completed_at: new Date().toISOString() }).eq("id", sessionId).select().single();
    if (error) throw error;
    set({ currentSession: data as GameSession });
  },
  fetchSessions: async (userId: string) => {
    set({ loading: true, isLoading: true });
    try {
      const { data, error } = await supabase.from("game_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      const sessions = (data || []) as GameSession[];
      set({ sessions, loading: false, isLoading: false });
    } catch (error) {
      set({ loading: false, isLoading: false });
    }
  },
  fetchGames: async (userId = "") => {
    if (userId) await useGameStore.getState().fetchSessions(userId);
    set({ isLoading: false, loading: false });
  },
  recordGame: async (_gameType, _result, _won = false) => {},
}));
