import { create } from "zustand";
import * as Crypto from "expo-crypto";

import {
  createGameSession,
  getGameSession,
  getGameSessions,
  resolveGame,
  submitMove,
  type GameSessionRecord,
  type GameType,
  type SubmitMoveInput,
  isGameType,
  saveGameResult,
} from "../api/game";
import type { Game } from "../types/game";
import {
  registerOfflineMutationHandler,
  runOfflineAwareMutation,
  startOfflineQueueProcessor,
} from "../lib/offline";
import type { JsonObject } from "../api/_shared";

type GameAnswer = JsonObject & {
  correct?: boolean;
};

type RecordedGameResult = {
  won: boolean;
  score: number;
  platesEarned: number;
};

interface GameState {
  sessions: GameSessionRecord[];
  games: Game[];
  currentSession: GameSessionRecord | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  onlineCount: number;
  startSession: (userId: string, gameType: string) => Promise<GameSessionRecord>;
  createSession: (input: { opponentId: string; gameType: GameType; wagerAmount: number }) => Promise<GameSessionRecord>;
  submitGameMove: (input: SubmitMoveInput) => Promise<GameSessionRecord>;
  pollSession: (sessionId: string) => Promise<GameSessionRecord | null>;
  resolveSession: (sessionId: string) => Promise<GameSessionRecord | null>;
  submitAnswers: (sessionId: string, answers: GameAnswer[], timeTakenMs: number) => Promise<void>;
  fetchSessions: (userId?: string) => Promise<void>;
  fetchGames: (userId?: string) => Promise<void>;
  recordGame: (gameType: string, result: number | RecordedGameResult, won?: boolean) => Promise<void>;
  clearError: () => void;
}

const GAME_CREATE_SESSION = "game.createSession";
const GAME_SUBMIT_MOVE = "game.submitMove";

registerOfflineMutationHandler(GAME_CREATE_SESSION, async (payload) => {
  await createGameSession({
    opponentId: String(payload.opponentId),
    gameType: normalizeGameType(String(payload.gameType)),
    wagerAmount: typeof payload.wagerAmount === "number" ? payload.wagerAmount : 1,
  });
});
registerOfflineMutationHandler(GAME_SUBMIT_MOVE, async (payload) => {
  await submitMove({
    sessionId: String(payload.sessionId),
    move: typeof payload.move === "object" && payload.move !== null ? (payload.move as JsonObject) : {},
    turnNumber: typeof payload.turnNumber === "number" ? payload.turnNumber : undefined,
  });
});
startOfflineQueueProcessor();

export const useGameStore = create<GameState>((set, get) => ({
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
  error: null,
  onlineCount: 0,

  startSession: async (userId, gameType) => {
    const normalizedType = normalizeGameType(gameType);
    return get().createSession({ opponentId: userId, gameType: normalizedType, wagerAmount: 1 });
  },

  createSession: async (input) => {
    const optimistic = createOptimisticSession(input.opponentId, input.gameType, input.wagerAmount);
    set((state) => ({
      sessions: [optimistic, ...state.sessions],
      currentSession: optimistic,
      loading: true,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await runOfflineAwareMutation(GAME_CREATE_SESSION, input, () => createGameSession(input));
      if (result.status === "executed") {
        set((state) => ({
          sessions: state.sessions.map((session) => (session.id === optimistic.id ? result.result : session)),
          currentSession: result.result,
        }));
        return result.result;
      }
      return optimistic;
    } catch (error) {
      set((state) => ({
        sessions: state.sessions.filter((session) => session.id !== optimistic.id),
        currentSession: state.currentSession?.id === optimistic.id ? null : state.currentSession,
        error: error instanceof Error ? error.message : "Failed to start game",
      }));
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  submitGameMove: async (input) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const result = await runOfflineAwareMutation(
        GAME_SUBMIT_MOVE,
        { sessionId: input.sessionId, move: input.move, turnNumber: input.turnNumber },
        () => submitMove(input),
      );
      if (result.status === "executed") {
        set((state) => ({
          sessions: upsertSession(state.sessions, result.result),
          currentSession: result.result,
        }));
        return result.result;
      }

      const optimistic = appendOptimisticMove(get().currentSession, input);
      if (optimistic) {
        set((state) => ({
          sessions: upsertSession(state.sessions, optimistic),
          currentSession: optimistic,
        }));
        return optimistic;
      }

      throw new Error("Game move queued until the connection returns.");
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to submit move" });
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  pollSession: async (sessionId) => {
    try {
      const session = await getGameSession(sessionId);
      if (session) {
        set((state) => ({
          sessions: upsertSession(state.sessions, session),
          currentSession: session,
          error: null,
        }));
      }
      return session;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to refresh game" });
      return null;
    }
  },

  resolveSession: async (sessionId) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const resolved = await resolveGame({ sessionId });
      if (resolved) {
        set((state) => ({
          sessions: upsertSession(state.sessions, resolved),
          currentSession: resolved,
        }));
      }
      return resolved;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to resolve game" });
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  submitAnswers: async (sessionId, answers, timeTakenMs) => {
    const score = answers.filter((answer) => answer.correct).length;
    const move = { answers, score, timeTakenMs, completedAt: new Date().toISOString() };
    set((state) => ({
      currentSession: state.currentSession?.id === sessionId
        ? { ...state.currentSession, answers, score, timeTakenMs, status: "completed", completedAt: new Date().toISOString() }
        : state.currentSession,
      loading: true,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await runOfflineAwareMutation(GAME_SUBMIT_MOVE, { sessionId, move }, () => submitMove({ sessionId, move }));
      if (result.status === "executed") {
        set({ currentSession: result.result });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to submit answers" });
      throw error;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  fetchSessions: async (userId) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const sessions = await getGameSessions({ userId, limit: 50 });
      set({ sessions, loading: false, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch game sessions", loading: false, isLoading: false });
    }
  },

  fetchGames: async (userId = "") => {
    if (userId) await get().fetchSessions(userId);
    set({ isLoading: false, loading: false });
  },

  recordGame: async (gameType, result, won = false) => {
    const normalizedType = normalizeGameType(gameType);
    const record =
      typeof result === "number"
        ? { won, score: result, platesEarned: 0 }
        : result;
    saveGameResult(normalizedType, record);
  },

  clearError: () => set({ error: null }),
}));

function normalizeGameType(gameType: string): GameType {
  if (gameType === "trivia") return "questions";
  return isGameType(gameType) ? gameType : "questions";
}

function createOptimisticSession(opponentId: string, gameType: GameType, wagerAmount: number): GameSessionRecord {
  return {
    id: Crypto.randomUUID(),
    player2Id: opponentId,
    gameType,
    score: 0,
    answers: [],
    status: "queued",
    wagerAmount,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

function upsertSession(sessions: GameSessionRecord[], session: GameSessionRecord): GameSessionRecord[] {
  const exists = sessions.some((item) => item.id === session.id);
  if (!exists) return [session, ...sessions];
  return sessions.map((item) => (item.id === session.id ? session : item));
}

function appendOptimisticMove(currentSession: GameSessionRecord | null, input: SubmitMoveInput): GameSessionRecord | null {
  if (!currentSession || currentSession.id !== input.sessionId) return null;
  return {
    ...currentSession,
    answers: [...currentSession.answers, input.move],
  };
}
