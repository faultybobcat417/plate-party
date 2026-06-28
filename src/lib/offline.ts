import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";

type OfflinePayload = Record<string, unknown>;
type OfflineMutationHandler = (payload: OfflinePayload) => Promise<void>;

export interface OfflineQueuedMutation {
  id: string;
  kind: string;
  payload: OfflinePayload;
  createdAt: string;
  retryCount: number;
  nextAttemptAt: string;
  lastError?: string;
}

export interface OfflineQueueStats {
  pending: number;
  processing: boolean;
  isOnline: boolean;
  lastProcessedAt: string | null;
  lastError: string | null;
}

const STORAGE_KEY = "@plateparty:offline_mutations";
const handlers = new Map<string, OfflineMutationHandler>();
const queueListeners = new Set<(stats: OfflineQueueStats) => void>();
let processing = false;
let unsubscribeNetInfo: (() => void) | null = null;
let online = true;
let lastProcessedAt: string | null = null;
let lastError: string | null = null;

export function registerOfflineMutationHandler(kind: string, handler: OfflineMutationHandler): void {
  handlers.set(kind, handler);
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  online = Boolean(state.isConnected && state.isInternetReachable !== false);
  return online;
}

export async function queueMutation(kind: string, payload: OfflinePayload, error?: unknown): Promise<OfflineQueuedMutation> {
  const queued: OfflineQueuedMutation = {
    id: Crypto.randomUUID(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    nextAttemptAt: new Date().toISOString(),
    lastError: error instanceof Error ? error.message : undefined,
  };
  const current = await readQueue();
  await writeQueue([...current, queued]);
  await notifyQueueListeners();
  return queued;
}

export async function runOfflineAwareMutation<T>(
  kind: string,
  payload: OfflinePayload,
  executor: () => Promise<T>,
): Promise<{ status: "executed"; result: T } | { status: "queued"; mutation: OfflineQueuedMutation }> {
  if (!(await isOnline())) {
    return { status: "queued", mutation: await queueMutation(kind, payload) };
  }

  try {
    return { status: "executed", result: await executor() };
  } catch (error) {
    if (isRetryableNetworkError(error)) {
      return { status: "queued", mutation: await queueMutation(kind, payload, error) };
    }
    throw error;
  }
}

export async function processOfflineQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  lastError = null;
  await notifyQueueListeners();

  try {
    const now = Date.now();
    const queue = await readQueue();
    const remaining: OfflineQueuedMutation[] = [];

    for (const mutation of queue) {
      if (new Date(mutation.nextAttemptAt).getTime() > now) {
        remaining.push(mutation);
        continue;
      }

      const handler = handlers.get(mutation.kind);
      if (!handler) {
        lastError = `No offline handler registered for ${mutation.kind}.`;
        remaining.push({
          ...mutation,
          retryCount: mutation.retryCount + 1,
          nextAttemptAt: nextAttempt(mutation.retryCount + 1),
          lastError,
        });
        continue;
      }

      try {
        await handler(mutation.payload);
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Retry failed.";
        remaining.push({
          ...mutation,
          retryCount: mutation.retryCount + 1,
          nextAttemptAt: nextAttempt(mutation.retryCount + 1),
          lastError,
        });
      }
    }

    await writeQueue(remaining);
    lastProcessedAt = new Date().toISOString();
  } finally {
    processing = false;
    await notifyQueueListeners();
  }
}

export function startOfflineQueueProcessor(): () => void {
  if (unsubscribeNetInfo) return unsubscribeNetInfo;
  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    online = Boolean(state.isConnected && state.isInternetReachable !== false);
    void notifyQueueListeners();
    if (online) {
      void processOfflineQueue();
    }
  });
  void isOnline().then(() => notifyQueueListeners());
  return unsubscribeNetInfo;
}

export async function getOfflineQueue(): Promise<OfflineQueuedMutation[]> {
  return readQueue();
}

export async function getOfflineQueueStats(): Promise<OfflineQueueStats> {
  const queue = await readQueue();
  return { pending: queue.length, processing, isOnline: online, lastProcessedAt, lastError };
}

export async function clearOfflineQueue(): Promise<void> {
  await writeQueue([]);
  await notifyQueueListeners();
}

export function subscribeToOfflineQueue(listener: (stats: OfflineQueueStats) => void): () => void {
  queueListeners.add(listener);
  void getOfflineQueueStats().then(listener);
  return () => {
    queueListeners.delete(listener);
  };
}

async function readQueue(): Promise<OfflineQueuedMutation[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedMutation);
  } catch {
    return [];
  }
}

async function writeQueue(queue: OfflineQueuedMutation[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

async function notifyQueueListeners(): Promise<void> {
  if (queueListeners.size === 0) return;
  const stats = await getOfflineQueueStats();
  queueListeners.forEach((listener) => listener(stats));
}

function nextAttempt(retryCount: number): string {
  const delayMs = Math.min(30_000, 1000 * 2 ** Math.max(0, retryCount - 1));
  return new Date(Date.now() + delayMs).toISOString();
}

function isQueuedMutation(value: unknown): value is OfflineQueuedMutation {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<OfflineQueuedMutation>;
  return (
    typeof item.id === "string" &&
    typeof item.kind === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.nextAttemptAt === "string" &&
    typeof item.retryCount === "number" &&
    typeof item.payload === "object" &&
    item.payload !== null
  );
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("offline") ||
    message.includes("internet")
  );
}
