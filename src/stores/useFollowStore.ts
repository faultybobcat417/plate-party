import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FollowStore {
  following: string[];
  follow: (userId: string) => void;
  unfollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
}

export const useFollowStore = create<FollowStore>()(
  persist(
    (set, get) => ({
      following: ["user1", "user2", "user3"],
      follow: (userId) =>
        set((state) => {
          if (state.following.includes(userId)) return state;
          return { following: [...state.following, userId] };
        }),
      unfollow: (userId) =>
        set((state) => ({
          following: state.following.filter((id) => id !== userId),
        })),
      isFollowing: (userId) => get().following.includes(userId),
    }),
    {
      name: "follow-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
