import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  plates: number;
  betsPlaced: number;
  wins: number;
}

interface UserState {
  user: User | null;
  plates: number;
  betsPlaced: number;
  wins: number;
  isLoading: boolean;
  topGivers: Array<{ id: string; name: string; totalGiven: number }>;
  fetchUserProfile: () => Promise<void>;
  fetchTopGivers: () => Promise<void>;
  addPlates: (amount: number) => void;
  deductPlates: (amount: number) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      plates: 1000,
      betsPlaced: 0,
      wins: 0,
      isLoading: false,
      topGivers: [],
      fetchUserProfile: async () => {
        set({ isLoading: true });
        try {
          set({
            user: {
              id: 'user1',
              name: 'Test User',
              username: 'testuser',
              plates: get().plates,
              betsPlaced: get().betsPlaced,
              wins: get().wins,
            },
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },
      fetchTopGivers: async () => {
        set({
          topGivers: [
            { id: '1', name: 'Alice', totalGiven: 500 },
            { id: '2', name: 'Bob', totalGiven: 300 },
            { id: '3', name: 'Charlie', totalGiven: 200 },
          ],
        });
      },
      addPlates: (amount) => set((state) => ({ plates: state.plates + amount })),
      deductPlates: (amount) => set((state) => ({ plates: Math.max(0, state.plates - amount) })),
      logout: async () => {
        set({ user: null, plates: 0, betsPlaced: 0, wins: 0 });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
