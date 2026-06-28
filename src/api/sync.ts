import {
  clearOfflineQueue,
  getOfflineQueue,
  getOfflineQueueStats,
  processOfflineQueue,
  queueMutation,
} from "../lib/offline";

export interface SyncMutation {
  id: string;
  table?: string;
  tableName?: string;
  recordId?: string;
  operation: "insert" | "update" | "delete";
  data?: unknown;
  payload?: Record<string, unknown>;
  deviceId?: string;
  hlc?: string;
  timestamp: string;
}

export type SyncPeer = {
  id: string;
  endpoint?: string;
};

export type OutboxStats = {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  conflicted: number;
};

export async function enqueueMutation(mutation: Omit<SyncMutation, "id" | "timestamp">): Promise<void> {
  await queueMutation("sync.mutation", toOfflinePayload(mutation));
}

export async function getPendingMutations(): Promise<SyncMutation[]> {
  const queue = await getOfflineQueue();
  return queue.map((item) => ({
    id: item.id,
    table: typeof item.payload.table === "string" ? item.payload.table : undefined,
    tableName: typeof item.payload.tableName === "string" ? item.payload.tableName : undefined,
    recordId: typeof item.payload.recordId === "string" ? item.payload.recordId : undefined,
    operation: isOperation(item.payload.operation) ? item.payload.operation : "update",
    data: item.payload.data,
    payload: isRecord(item.payload.payload) ? item.payload.payload : item.payload,
    deviceId: typeof item.payload.deviceId === "string" ? item.payload.deviceId : undefined,
    hlc: typeof item.payload.hlc === "string" ? item.payload.hlc : undefined,
    timestamp: item.createdAt,
  }));
}

export async function clearSyncedMutations(): Promise<void> {
  await clearOfflineQueue();
}

export async function countPendingOutbox(): Promise<number> {
  return (await getOfflineQueueStats()).pending;
}

export async function getOutboxStats(): Promise<OutboxStats> {
  const stats = await getOfflineQueueStats();
  return {
    pending: stats.pending,
    sending: stats.processing ? stats.pending : 0,
    sent: 0,
    failed: stats.lastError ? 1 : 0,
    conflicted: 0,
  };
}

export async function processOutbox(_peers: SyncPeer[]): Promise<void> {
  await processOfflineQueue();
}

function toOfflinePayload(mutation: Omit<SyncMutation, "id" | "timestamp">): Record<string, unknown> {
  return {
    table: mutation.table,
    tableName: mutation.tableName,
    recordId: mutation.recordId,
    operation: mutation.operation,
    data: mutation.data,
    payload: mutation.payload,
    deviceId: mutation.deviceId,
    hlc: mutation.hlc,
  };
}

function isOperation(value: unknown): value is SyncMutation["operation"] {
  return value === "insert" || value === "update" || value === "delete";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
