import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnlineStore {
  onlineCount: number;
  setOnlineCount: (count: number) => void;
}

export const useOnlineStore = create<OnlineStore>()(
  persist(
    (set) => ({
      onlineCount: 0,
      setOnlineCount: (count) => set({ onlineCount: count }),
    }),
    {
      name: "online-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

let intervalId: ReturnType<typeof setInterval> | null = null;

export const startOnlinePolling = () => {
  if (intervalId) clearInterval(intervalId);
  const update = () => {
    const count = Math.floor(Math.random() * 50) + 1;
    useOnlineStore.getState().setOnlineCount(count);
  };
  update();
  intervalId = setInterval(update, 30000);
};

export const stopOnlinePolling = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
