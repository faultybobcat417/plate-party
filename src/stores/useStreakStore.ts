import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreakData {
  challengeId: string;
  currentStreak: number;
  bestStreak: number;
  lastCheckIn: string | null;
  checkInHistory: Record<string, boolean>;
  freezesUsed: number;
  freezesAvailable: number;
}

interface StreakState {
  streaks: Record<string, StreakData>;
  checkIn: (challengeId: string) => Promise<void>;
  useFreeze: (challengeId: string) => Promise<boolean>;
  getStreak: (challengeId: string) => StreakData | null;
  getCalendarData: (challengeId: string) => { date: string; status: 'check' | 'miss' | 'freeze' | 'today' }[];
}

const TODAY = new Date().toISOString().split('T')[0];

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      streaks: {},

      checkIn: async (challengeId) => {
        const existing = get().streaks[challengeId] || {
          challengeId,
          currentStreak: 0,
          bestStreak: 0,
          lastCheckIn: null,
          checkInHistory: {},
          freezesUsed: 0,
          freezesAvailable: 2,
        };

        if (existing.lastCheckIn === TODAY) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        const isConsecutive = existing.lastCheckIn === yStr;

        let newStreak = isConsecutive ? existing.currentStreak + 1 : 1;
        // check if freeze was used yesterday (we'll handle in useFreeze)
        const history = { ...existing.checkInHistory, [TODAY]: true };
        const best = Math.max(existing.bestStreak, newStreak);

        set((state) => ({
          streaks: {
            ...state.streaks,
            [challengeId]: {
              ...existing,
              currentStreak: newStreak,
              bestStreak: best,
              lastCheckIn: TODAY,
              checkInHistory: history,
            },
          },
        }));
      },

      useFreeze: async (challengeId) => {
        const existing = get().streaks[challengeId];
        if (!existing || existing.freezesAvailable <= 0) return false;

        const updated = {
          ...existing,
          freezesUsed: existing.freezesUsed + 1,
          freezesAvailable: existing.freezesAvailable - 1,
          // we freeze yesterday if lastCheckIn is not today and not yesterday
        };
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        if (existing.lastCheckIn !== TODAY && existing.lastCheckIn !== yStr) {
          // apply freeze to yesterday
          updated.checkInHistory = { ...existing.checkInHistory, [yStr]: true };
          updated.lastCheckIn = TODAY; // effectively saves streak
        }

        set((state) => ({
          streaks: { ...state.streaks, [challengeId]: updated },
        }));
        return true;
      },

      getStreak: (challengeId) => get().streaks[challengeId] || null,

      getCalendarData: (challengeId) => {
        const data = get().streaks[challengeId];
        if (!data) return [];
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 30);
        const days = [];
        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          let status: 'check' | 'miss' | 'freeze' | 'today' = 'miss';
          if (dateStr === TODAY) status = 'today';
          else if (data.checkInHistory[dateStr]) status = 'check';
          // we can't differentiate freeze easily without more metadata, but we'll mark as check for now
          days.push({ date: dateStr, status });
        }
        return days;
      },
    }),
    {
      name: 'streak-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
