import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StakeCompetition, StakeEntry } from '../types/stake';
import { postLedgerTransaction } from '../api/ledger';

interface StakeState {
  competitions: StakeCompetition[];
  savedCompetitions: string[];
  posts: any[];
  isLoading: boolean;
  error: string | null;
  fetchCompetitionById: (id: string) => Promise<StakeCompetition>;
  enterCompetition: (competitionId: string) => Promise<void>;
  pickWinner: (competitionId: string, entryId: string) => Promise<void>;
  toggleSaveCompetition: (competitionId: string) => void;
  loadPosts: () => Promise<void>;
  stake: (data: any) => Promise<void>;
  clearError: () => void;
  addPost: (post: any) => Promise<void>;
}

const mockCompetitions: StakeCompetition[] = [
  {
    id: '1',
    title: 'Best Steak Recipe',
    description: 'Share your best steak recipe and win plates!',
    entryFee: 50,
    prize: 500,
    creatorId: 'user1',
    status: 'open',
    entries: [
      { id: 'e1', userId: 'user2', userName: 'GrillMaster' },
      { id: 'e2', userId: 'user3', userName: 'SteakLover' },
    ],
  },
];

export const useStakeStore = create<StakeState>()(
  persist(
    (set, get) => ({
      competitions: mockCompetitions,
      savedCompetitions: [],
      posts: [],
      isLoading: false,
      error: null,
      fetchCompetitionById: async (id) => {
        set({ isLoading: true });
        try {
          const comp = get().competitions.find((c) => c.id === id);
          if (!comp) throw new Error('Competition not found');
          return comp;
        } finally {
          set({ isLoading: false });
        }
      },
      enterCompetition: async (competitionId) => {
        const comp = get().competitions.find((c) => c.id === competitionId);
        if (!comp) throw new Error('Competition not found');
        if (comp.status === 'closed') throw new Error('Competition is closed');
        set((state) => ({
          competitions: state.competitions.map((c) =>
            c.id === competitionId
              ? { ...c, entries: [...c.entries, { id: 'new', userId: 'currentUser', userName: 'You' }] }
              : c
          ),
        }));
      },
      pickWinner: async (competitionId, entryId) => {
        const comp = get().competitions.find((c) => c.id === competitionId);
        if (!comp) throw new Error('Competition not found');
        set((state) => ({
          competitions: state.competitions.map((c) =>
            c.id === competitionId ? { ...c, status: 'closed' as const } : c
          ),
        }));
      },
      toggleSaveCompetition: (competitionId) => {
        set((state) => ({
          savedCompetitions: state.savedCompetitions.includes(competitionId)
            ? state.savedCompetitions.filter((id) => id !== competitionId)
            : [...state.savedCompetitions, competitionId],
        }));
      },
      loadPosts: async () => {
        set({ posts: [] });
      },
      stake: async (data) => {
        // TODO: implement stake creation
      },
      clearError: () => set({ error: null }),
      addPost: async (post) => {
        set((state) => ({ posts: [post, ...state.posts] }));
      },
    }),
    {
      name: 'stake-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
