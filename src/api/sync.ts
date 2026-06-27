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

export async function enqueueMutation(_mutation: Omit<SyncMutation, "id" | "timestamp">): Promise<void> {
  // Phase 0 compatibility stub. Phase 1 wires this to sync_outbox.
}

export async function getPendingMutations(): Promise<SyncMutation[]> {
  return [];
}

export async function clearSyncedMutations(): Promise<void> {}

export async function countPendingOutbox(): Promise<number> {
  return 0;
}

export async function getOutboxStats(): Promise<OutboxStats> {
  return { pending: 0, sending: 0, sent: 0, failed: 0, conflicted: 0 };
}

export async function processOutbox(_peers: SyncPeer[]): Promise<void> {}
