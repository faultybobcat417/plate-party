import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { GameSession } from "../db/schema";

interface GameState {
  sessions: GameSession[];
  currentSession: GameSession | null;
  loading: boolean;
  onlineCount: number;
  startSession: (userId: string, gameType: string) => Promise<GameSession>;
  submitAnswers: (sessionId: string, answers: any[], timeTakenMs: number) => Promise<void>;
  fetchSessions: (userId: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessions: [],
  currentSession: null,
  loading: false,
  onlineCount: 0,
  startSession: async (userId: string, gameType: string) => {
    const { data, error } = await supabase.from("game_sessions").insert({ user_id: userId, game_type: gameType, status: "playing" }).select().single();
    if (error) throw error;
    const session = data as GameSession;
    set({ currentSession: session });
    return session;
  },
  submitAnswers: async (sessionId: string, answers: any[], timeTakenMs: number) => {
    const score = answers.filter((a) => a.correct).length;
    const { data, error } = await supabase.from("game_sessions").update({ score, answers, time_taken_ms: timeTakenMs, status: "completed", completed_at: new Date().toISOString() }).eq("id", sessionId).select().single();
    if (error) throw error;
    set({ currentSession: data as GameSession });
  },
  fetchSessions: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.from("game_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      set({ sessions: (data || []) as GameSession[], loading: false });
    } catch (error) {
      console.error("Failed to fetch game sessions:", error);
      set({ loading: false });
    }
  },
}));
