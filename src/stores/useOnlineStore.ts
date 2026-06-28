import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import { supabase } from "../lib/supabase";
import { pickRandom } from "../lib/random";

export type OnlinePlayer = {
  presenceKey: string;
  userId: string;
  onlineAt: string;
  focusedGame?: string;
};

type PresenceStatus = "idle" | "connecting" | "online" | "offline" | "error";

interface OnlineStore {
  onlineCount: number;
  players: OnlinePlayer[];
  status: PresenceStatus;
  error: string | null;
  setPresence: (players: OnlinePlayer[], status?: PresenceStatus) => void;
  setStatus: (status: PresenceStatus, error?: string | null) => void;
  getRandomOpponent: (currentUserId?: string | null) => OnlinePlayer | null;
}

type PresencePayload = {
  userId?: unknown;
  onlineAt?: unknown;
  focusedGame?: unknown;
};

const clientId = Crypto.randomUUID();
let channel: ReturnType<typeof supabase.channel> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export const useOnlineStore = create<OnlineStore>()(
  persist(
    (set, get) => ({
      onlineCount: 0,
      players: [],
      status: "idle",
      error: null,

      setPresence: (players, status) =>
        set({
          players,
          onlineCount: players.length,
          ...(status ? { status } : {}),
          error: null,
        }),

      setStatus: (status, error = null) => set({ status, error }),

      getRandomOpponent: (currentUserId) => {
        const candidates = get().players.filter((player) => player.userId !== currentUserId);
        return candidates.length > 0 ? pickRandom(candidates) : null;
      },
    }),
    {
      name: "online-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onlineCount: state.onlineCount,
        players: state.players,
        status: state.status,
      }),
    },
  ),
);

export async function startOnlinePresence(userId?: string | null): Promise<void> {
  stopOnlinePresence();
  const sessionUserId = userId ?? (await getSessionUserId());

  if (!sessionUserId) {
    useOnlineStore.getState().setStatus("offline");
    return;
  }

  useOnlineStore.getState().setStatus("connecting");
  const presenceKey = `${sessionUserId}:${clientId}`;
  channel = supabase.channel("online_players", {
    config: {
      presence: {
        key: presenceKey,
      },
    },
  });

  const syncPresence = () => {
    if (!channel) return;
    useOnlineStore.getState().setPresence(parsePresenceState(channel.presenceState()), "online");
  };

  const trackPresence = async () => {
    if (!channel) return;
    await channel.track({
      userId: sessionUserId,
      onlineAt: new Date().toISOString(),
    });
  };

  channel
    .on("presence", { event: "sync" }, syncPresence)
    .on("presence", { event: "join" }, syncPresence)
    .on("presence", { event: "leave" }, syncPresence)
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void trackPresence();
        syncPresence();
        heartbeatInterval = setInterval(() => {
          void trackPresence();
        }, 30000);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        useOnlineStore.getState().setStatus("error", "Realtime presence is unavailable.");
      }
    });
}

export function stopOnlinePresence(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (channel) {
    const staleChannel = channel;
    channel = null;
    void staleChannel.untrack();
    void supabase.removeChannel(staleChannel);
  }

  useOnlineStore.getState().setPresence([], "offline");
}

async function getSessionUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

function parsePresenceState(state: Record<string, unknown>): OnlinePlayer[] {
  const byUserId = new Map<string, OnlinePlayer>();

  Object.entries(state).forEach(([presenceKey, payloads]) => {
    if (!Array.isArray(payloads)) return;
    payloads.forEach((payload) => {
      const parsed = parsePresencePayload(presenceKey, payload);
      if (!parsed) return;
      const existing = byUserId.get(parsed.userId);
      if (!existing || existing.onlineAt < parsed.onlineAt) {
        byUserId.set(parsed.userId, parsed);
      }
    });
  });

  return Array.from(byUserId.values()).sort((a, b) => b.onlineAt.localeCompare(a.onlineAt));
}

function parsePresencePayload(presenceKey: string, payload: unknown): OnlinePlayer | null {
  if (!isRecord(payload)) return null;
  const presence = payload as PresencePayload;
  if (typeof presence.userId !== "string") return null;

  return {
    presenceKey,
    userId: presence.userId,
    onlineAt: typeof presence.onlineAt === "string" ? presence.onlineAt : new Date().toISOString(),
    focusedGame: typeof presence.focusedGame === "string" ? presence.focusedGame : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
