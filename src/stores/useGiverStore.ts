import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GiverEntry {
  userId: string;
  userName: string;
  avatar: string;
  platesGiven: number;
  rank: number;
}

interface GiverStore {
  topGivers: GiverEntry[];
  isLoading: boolean;
  loadTopGivers: () => Promise<void>;
}

const demoGivers: GiverEntry[] = [
  { userId: "user1", userName: "Alice", avatar: "https://i.pravatar.cc/150?img=1", platesGiven: 4782, rank: 1 },
  { userId: "user2", userName: "Bob", avatar: "https://i.pravatar.cc/150?img=2", platesGiven: 4210, rank: 2 },
  { userId: "user3", userName: "Carol", avatar: "https://i.pravatar.cc/150?img=3", platesGiven: 3895, rank: 3 },
  { userId: "user4", userName: "Dave", avatar: "https://i.pravatar.cc/150?img=4", platesGiven: 3201, rank: 4 },
  { userId: "user5", userName: "Eve", avatar: "https://i.pravatar.cc/150?img=5", platesGiven: 2880, rank: 5 },
  { userId: "user6", userName: "Frank", avatar: "https://i.pravatar.cc/150?img=6", platesGiven: 2450, rank: 6 },
  { userId: "user7", userName: "Grace", avatar: "https://i.pravatar.cc/150?img=7", platesGiven: 2100, rank: 7 },
  { userId: "user8", userName: "Henry", avatar: "https://i.pravatar.cc/150?img=8", platesGiven: 1850, rank: 8 },
  { userId: "user9", userName: "Ivy", avatar: "https://i.pravatar.cc/150?img=9", platesGiven: 1200, rank: 9 },
  { userId: "user10", userName: "Jack", avatar: "https://i.pravatar.cc/150?img=10", platesGiven: 500, rank: 10 },
];

export const useGiverStore = create<GiverStore>()(
  persist(
    (set) => ({
      topGivers: demoGivers,
      isLoading: false,
      loadTopGivers: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ topGivers: demoGivers, isLoading: false });
      },
    }),
    {
      name: "giver-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
