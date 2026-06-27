import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '../types/game';

interface GameState {
  games: Game[];
  isLoading: boolean;
  onlineCount: number;
  fetchGames: () => Promise<void>;
  fetchGameById: (id: string) => Promise<Game>;
  playGame: (gameId: string, userId: string, win: boolean) => Promise<void>;
  recordGame: (gameId: string, result: { won: boolean; score: number; platesEarned: number }) => Promise<void>;
}

const mockGames: Game[] = [
  { id: 'g1', title: 'Plate Flip', description: 'Flip a coin, win plates!', prize: 20 },
  { id: 'g2', title: 'Steak Guess', description: 'Guess the weight, win big!', prize: 50 },
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      games: mockGames,
      isLoading: false,
      onlineCount: 42,
      fetchGames: async () => {
        set({ isLoading: true });
        try {
          set({ games: mockGames, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      fetchGameById: async (id) => {
        const game = get().games.find((g) => g.id === id);
        if (!game) throw new Error('Game not found');
        return game;
      },
      playGame: async (gameId, userId, win) => {
        // Record play in DB
      },
      recordGame: async (gameId, result) => {
        // Record game result
      },
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
