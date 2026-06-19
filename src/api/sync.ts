import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type * as SQLite from "expo-sqlite";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  createDefaultHlc,
  createUuid,
  type JsonObject,
  type JsonValue,
  type SyncOperation,
  type SyncOutboxEntry,
  type SyncOutboxStatus,
  syncOutbox,
  type SyncTableName,
} from "../db/schema";

export type SqlExecutor = Pick<
  SQLite.SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync"
>;

export type SyncPeer = {
  id: string;
  endpoint: string;
  lastSeenAt?: string;
  lastPulledHlc?: string;
};

export type EnqueueMutationInput = {
  tableName: SyncTableName;
  recordId: string;
  operation: SyncOperation;
  payload: JsonObject;
  deviceId: string;
  baseHlc?: string | null;
  hlc?: string;
};

export type InboundMutation = {
  id: string;
  tableName: SyncTableName;
  recordId: string;
  operation: SyncOperation;
  payload: JsonObject;
  deviceId: string;
  hlc: string;
  baseHlc?: string | null;
  createdAt?: string;
};

export type OutboxStats = {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  conflicted: number;
};

export type PushResult = {
  peerId: string;
  attempted: number;
  accepted: number;
  failed: number;
};

export type PullResult = {
  peerId: string;
  received: number;
  applied: number;
  skipped: number;
  conflicts: InboundMutation[];
  checkpointHlc?: string;
};

export type ProcessOutboxResult = {
  pushed: PushResult[];
  pulled: PullResult[];
};

type TableConfig = {
  tableName: SyncTableName;
  columns: readonly string[];
  primaryKey: readonly string[];
  softDeleteColumn?: string;
};

type ExistingHlcRow = {
  hlc: string | null;
  status?: string | null;
  winning_option_id?: string | null;
};

type CountRow = {
  count: number;
};

type PeerPushResponse = {
  acceptedIds?: unknown;
  conflicts?: unknown;
};

type PeerPullResponse = {
  mutations?: unknown;
  checkpointHlc?: unknown;
};

const tableConfigs: Record<SyncTableName, TableConfig> = {
  users: {
    tableName: "users",
    columns: [
      "id",
      "display_name",
      "avatar_color",
      "device_id",
      "venmo_handle",
      "cash_app_handle",
      "paypal_me_handle",
      "created_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
  parties: {
    tableName: "parties",
    columns: [
      "id",
      "name",
      "invite_code",
      "charity_org_name",
      "charity_org_url",
      "charity_pool_plates",
      "real_money_enabled",
      "default_stake_plates",
      "created_by_user_id",
      "next_wager_picker_user_id",
      "created_at",
      "updated_at",
      "archived_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
  party_members: {
    tableName: "party_members",
    columns: [
      "party_id",
      "user_id",
      "role",
      "plate_balance",
      "reserved_plate_balance",
      "current_streak",
      "longest_streak",
      "total_wins",
      "total_losses",
      "total_plates_wagered",
      "joined_at",
      "left_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["party_id", "user_id"],
    softDeleteColumn: "deleted_at",
  },
  wagers: {
    tableName: "wagers",
    columns: [
      "id",
      "party_id",
      "created_by_user_id",
      "question",
      "stake_plates",
      "deadline",
      "status",
      "winning_option_id",
      "real_money_amount_cents",
      "oracle_type",
      "oracle_config",
      "oracle_status",
      "oracle_result",
      "na_policy",
      "na_penalty_plates",
      "resolution_kind",
      "resolution_note",
      "locked_at",
      "resolved_at",
      "created_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
  wager_options: {
    tableName: "wager_options",
    columns: [
      "id",
      "wager_id",
      "label",
      "sort_order",
      "created_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
  bets: {
    tableName: "bets",
    columns: [
      "id",
      "wager_id",
      "user_id",
      "option_id",
      "plates_wagered",
      "real_money_amount_cents",
      "placed_at",
      "locked_at",
      "resolved_at",
      "status",
      "created_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
  pool_transactions: {
    tableName: "pool_transactions",
    columns: [
      "id",
      "party_id",
      "wager_id",
      "from_user_id",
      "plate_amount",
      "reason",
      "note",
      "timestamp",
      "created_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
  ious: {
    tableName: "ious",
    columns: [
      "id",
      "party_id",
      "from_user_id",
      "to_user_id",
      "wager_id",
      "dollar_amount_cents",
      "payment_provider",
      "external_payment_ref",
      "settled",
      "settled_at",
      "created_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
  ledger_entries: {
    tableName: "ledger_entries",
    columns: [
      "id",
      "transaction_id",
      "party_id",
      "wager_id",
      "bet_id",
      "pool_transaction_id",
      "iou_id",
      "source_table",
      "source_id",
      "account_type",
      "account_id",
      "plate_delta",
      "memo",
      "created_at",
      "updated_at",
      "deleted_at",
      "hlc",
      "last_modified_by_device_id",
    ],
    primaryKey: ["id"],
    softDeleteColumn: "deleted_at",
  },
};

export class SyncApiError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "SyncApiError";
    this.cause = cause;
  }
}

const toSyncApiError = (message: string, error: unknown): SyncApiError => {
  if (error instanceof SyncApiError) {
    return error;
  }

  return new SyncApiError(message, error);
};

export const compareHlc = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

export const normalizePeerEndpoint = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const camelToSnake = (key: string): string =>
  key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toSqlValue = (value: JsonValue | undefined): SQLite.SQLiteBindValue => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value;
};

const toPayloadColumnMap = (
  payload: JsonObject,
  config: TableConfig,
): Map<string, SQLite.SQLiteBindValue> => {
  const allowed = new Set(config.columns);
  const values = new Map<string, SQLite.SQLiteBindValue>();

  for (const [key, value] of Object.entries(payload)) {
    const columnName = allowed.has(key) ? key : camelToSnake(key);

    if (allowed.has(columnName)) {
      values.set(columnName, toSqlValue(value));
    }
  }

  return values;
};

const buildWhereClause = (
  config: TableConfig,
  values: Map<string, SQLite.SQLiteBindValue>,
): { clause: string; params: SQLite.SQLiteBindValue[] } => {
  const params = config.primaryKey.map((column) => values.get(column) ?? null);
  const hasAllKeys = params.every((value) => value !== null);

  if (!hasAllKeys) {
    throw new SyncApiError(
      `Cannot apply ${config.tableName} mutation without primary key values.`,
    );
  }

  return {
    clause: config.primaryKey.map((column) => `${column} = ?`).join(" and "),
    params,
  };
};

const getExistingRecord = async (
  executor: SqlExecutor,
  config: TableConfig,
  values: Map<string, SQLite.SQLiteBindValue>,
): Promise<ExistingHlcRow | null> => {
  try {
    const where = buildWhereClause(config, values);
    const selectedColumns =
      config.tableName === "wagers"
        ? "hlc, status, winning_option_id"
        : "hlc";

    return await executor.getFirstAsync<ExistingHlcRow>(
      `select ${selectedColumns} from ${config.tableName} where ${where.clause} limit 1`,
      where.params,
    );
  } catch (error) {
    throw toSyncApiError(`Failed to read existing ${config.tableName} record.`, error);
  }
};

const isResolutionConflict = (
  tableName: SyncTableName,
  existing: ExistingHlcRow | null,
  values: Map<string, SQLite.SQLiteBindValue>,
): boolean => {
  if (tableName !== "wagers" || !existing) {
    return false;
  }

  const incomingStatus = values.get("status");
  const incomingWinner = values.get("winning_option_id");
  const existingWinner = existing.winning_option_id ?? null;

  return (
    existing.status === "resolved" &&
    incomingStatus === "resolved" &&
    existingWinner !== incomingWinner
  );
};

const markLocalConflict = async (
  executor: SqlExecutor,
  mutation: InboundMutation,
): Promise<void> => {
  try {
    await executor.runAsync(
      `insert into sync_outbox (
        id,
        table_name,
        record_id,
        operation,
        payload,
        base_hlc,
        hlc,
        device_id,
        status,
        attempts,
        last_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, 'conflicted', 0, ?)`,
      [
        createUuid(),
        mutation.tableName,
        mutation.recordId,
        mutation.operation,
        JSON.stringify(mutation.payload),
        mutation.baseHlc ?? null,
        mutation.hlc,
        mutation.deviceId,
        "Conflicting wager resolution received from peer.",
      ],
    );
  } catch (error) {
    throw toSyncApiError("Failed to mark inbound sync conflict.", error);
  }
};

const upsertInboundRecord = async (
  executor: SqlExecutor,
  mutation: InboundMutation,
): Promise<"applied" | "skipped" | "conflict"> => {
  try {
    const config = tableConfigs[mutation.tableName];
    const values = toPayloadColumnMap(
      { ...mutation.payload, hlc: mutation.hlc, lastModifiedByDeviceId: mutation.deviceId },
      config,
    );

    for (const primaryKey of config.primaryKey) {
      if (!values.has(primaryKey)) {
        values.set(primaryKey, primaryKey === "id" ? mutation.recordId : null);
      }
    }

    const existing = await getExistingRecord(executor, config, values);

    if (isResolutionConflict(mutation.tableName, existing, values)) {
      await markLocalConflict(executor, mutation);
      return "conflict";
    }

    if (existing?.hlc && compareHlc(existing.hlc, mutation.hlc) > 0) {
      return "skipped";
    }

    if (mutation.operation === "delete") {
      const where = buildWhereClause(config, values);

      if (config.softDeleteColumn) {
        await executor.runAsync(
          `update ${config.tableName} set ${config.softDeleteColumn} = ?, hlc = ?, last_modified_by_device_id = ? where ${where.clause}`,
          [new Date().toISOString(), mutation.hlc, mutation.deviceId, ...where.params],
        );
      } else {
        await executor.runAsync(
          `delete from ${config.tableName} where ${where.clause}`,
          where.params,
        );
      }

      return "applied";
    }

    const columns = [...values.keys()];
    const placeholders = columns.map(() => "?").join(", ");
    const updateColumns = columns.filter(
      (column) => !config.primaryKey.includes(column),
    );
    const updateSet = updateColumns
      .map((column) => `${column} = excluded.${column}`)
      .join(", ");
    const conflictTarget = config.primaryKey.join(", ");
    const params = columns.map((column) => values.get(column) ?? null);

    await executor.runAsync(
      `insert into ${config.tableName} (${columns.join(", ")})
       values (${placeholders})
       on conflict (${conflictTarget}) do update set ${updateSet}`,
      params,
    );

    return "applied";
  } catch (error) {
    throw toSyncApiError(`Failed to apply inbound ${mutation.tableName} mutation.`, error);
  }
};

const isInboundMutation = (value: unknown): value is InboundMutation => {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.tableName === "string" &&
    typeof value.recordId === "string" &&
    typeof value.operation === "string" &&
    isJsonObject(value.payload) &&
    typeof value.deviceId === "string" &&
    typeof value.hlc === "string" &&
    value.tableName in tableConfigs
  );
};

const parsePeerPushResponse = (value: unknown): string[] => {
  if (!isJsonObject(value)) {
    return [];
  }

  const response = value as PeerPushResponse;
  if (!Array.isArray(response.acceptedIds)) {
    return [];
  }

  return response.acceptedIds.filter((id): id is string => typeof id === "string");
};

const parsePeerPullResponse = (
  value: unknown,
): { mutations: InboundMutation[]; checkpointHlc?: string } => {
  if (!isJsonObject(value)) {
    return { mutations: [] };
  }

  const response = value as PeerPullResponse;
  const mutations = Array.isArray(response.mutations)
    ? response.mutations.filter(isInboundMutation)
    : [];
  const checkpointHlc =
    typeof response.checkpointHlc === "string" ? response.checkpointHlc : undefined;

  return { mutations, checkpointHlc };
};

export const enqueueMutation = async (
  input: EnqueueMutationInput,
  executor?: SqlExecutor,
): Promise<SyncOutboxEntry> => {
  try {
    const database = executor ?? (await openSQLiteDatabase());
    const id = createUuid();
    const hlc = input.hlc ?? createDefaultHlc();

    await database.runAsync(
      `insert into sync_outbox (
        id,
        table_name,
        record_id,
        operation,
        payload,
        base_hlc,
        hlc,
        device_id,
        status,
        attempts
      ) values (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [
        id,
        input.tableName,
        input.recordId,
        input.operation,
        JSON.stringify(input.payload),
        input.baseHlc ?? null,
        hlc,
        input.deviceId,
      ],
    );

    const entry = await database.getFirstAsync<SyncOutboxEntry>(
      "select * from sync_outbox where id = ?",
      id,
    );

    if (!entry) {
      throw new SyncApiError("Outbox insert succeeded but the entry could not be read.");
    }

    return entry;
  } catch (error) {
    throw toSyncApiError("Failed to enqueue sync mutation.", error);
  }
};

export const listPendingMutations = async (
  limit = 100,
): Promise<SyncOutboxEntry[]> => {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(syncOutbox)
      .where(inArray(syncOutbox.status, ["pending", "failed"]))
      .orderBy(asc(syncOutbox.createdAt))
      .limit(limit);
  } catch (error) {
    throw toSyncApiError("Failed to list pending sync mutations.", error);
  }
};

export const listMutationsSince = async (
  sinceHlc?: string,
  limit = 500,
): Promise<SyncOutboxEntry[]> => {
  try {
    const db = await getDb();
    const whereClause = sinceHlc
      ? and(eq(syncOutbox.status, "sent"), gt(syncOutbox.hlc, sinceHlc))
      : eq(syncOutbox.status, "sent");

    return await db
      .select()
      .from(syncOutbox)
      .where(whereClause)
      .orderBy(asc(syncOutbox.hlc))
      .limit(limit);
  } catch (error) {
    throw toSyncApiError("Failed to list sync mutations by checkpoint.", error);
  }
};

export const updateOutboxStatus = async (
  ids: string[],
  status: SyncOutboxStatus,
  lastError?: string | null,
): Promise<void> => {
  try {
    if (ids.length === 0) {
      return;
    }

    const db = await getDb();
    const now = new Date().toISOString();

    await db
      .update(syncOutbox)
      .set({
        status,
        updatedAt: now,
        sentAt: status === "sent" ? now : undefined,
        lastError: lastError ?? null,
      })
      .where(inArray(syncOutbox.id, ids));
  } catch (error) {
    throw toSyncApiError("Failed to update sync outbox status.", error);
  }
};

export const incrementOutboxFailure = async (
  ids: string[],
  errorMessage: string,
): Promise<void> => {
  try {
    if (ids.length === 0) {
      return;
    }

    const db = await getDb();
    await db
      .update(syncOutbox)
      .set({
        status: "failed",
        updatedAt: new Date().toISOString(),
        lastError: errorMessage,
        attempts: sql`${syncOutbox.attempts} + 1`,
      })
      .where(inArray(syncOutbox.id, ids));
  } catch (error) {
    throw toSyncApiError("Failed to record sync outbox failure.", error);
  }
};

export const applyInboundMutations = async (
  mutations: InboundMutation[],
): Promise<PullResult> => {
  try {
    const database = await openSQLiteDatabase();
    let applied = 0;
    let skipped = 0;
    const conflicts: InboundMutation[] = [];

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        for (const mutation of mutations) {
          const result = await upsertInboundRecord(transaction, mutation);

          if (result === "applied") {
            applied += 1;
          } else if (result === "conflict") {
            conflicts.push(mutation);
          } else {
            skipped += 1;
          }
        }
      } catch (error) {
        throw toSyncApiError("Failed during inbound sync transaction.", error);
      }
    });

    return {
      peerId: "inbound",
      received: mutations.length,
      applied,
      skipped,
      conflicts,
      checkpointHlc: mutations.at(-1)?.hlc,
    };
  } catch (error) {
    throw toSyncApiError("Failed to apply inbound sync mutations.", error);
  }
};

export const getOutboxStats = async (): Promise<OutboxStats> => {
  try {
    const db = await getDb();
    const rows = await db
      .select({
        status: syncOutbox.status,
        count: sql<number>`count(*)`,
      })
      .from(syncOutbox)
      .groupBy(syncOutbox.status);

    const stats: OutboxStats = {
      pending: 0,
      sending: 0,
      sent: 0,
      failed: 0,
      conflicted: 0,
    };

    for (const row of rows) {
      stats[row.status] = Number(row.count);
    }

    return stats;
  } catch (error) {
    throw toSyncApiError("Failed to read sync outbox stats.", error);
  }
};

export const countPendingOutbox = async (): Promise<number> => {
  try {
    const database = await openSQLiteDatabase();
    const row = await database.getFirstAsync<CountRow>(
      "select count(*) as count from sync_outbox where status in ('pending', 'failed')",
    );

    return row?.count ?? 0;
  } catch (error) {
    throw toSyncApiError("Failed to count pending sync outbox entries.", error);
  }
};

export const pushMutationsToPeer = async (
  peer: SyncPeer,
  mutations: SyncOutboxEntry[],
): Promise<PushResult> => {
  try {
    if (mutations.length === 0) {
      return { peerId: peer.id, attempted: 0, accepted: 0, failed: 0 };
    }

    const ids = mutations.map((mutation) => mutation.id);
    await updateOutboxStatus(ids, "sending");

    const response = await fetch(`${normalizePeerEndpoint(peer.endpoint)}/sync/push`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mutations }),
    });

    if (!response.ok) {
      throw new SyncApiError(`Peer responded with HTTP ${response.status}.`);
    }

    const acceptedIds = parsePeerPushResponse(await response.json());
    const acceptedSet = new Set(acceptedIds);
    const failedIds = ids.filter((id) => !acceptedSet.has(id));

    await updateOutboxStatus(acceptedIds, "sent");

    if (failedIds.length > 0) {
      await incrementOutboxFailure(failedIds, "Peer did not acknowledge mutation.");
    }

    return {
      peerId: peer.id,
      attempted: ids.length,
      accepted: acceptedIds.length,
      failed: failedIds.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown push error.";
    await incrementOutboxFailure(
      mutations.map((mutation) => mutation.id),
      message,
    );
    throw toSyncApiError(`Failed to push mutations to peer ${peer.id}.`, error);
  }
};

export const pullMutationsFromPeer = async (
  peer: SyncPeer,
  sinceHlc?: string,
): Promise<PullResult> => {
  try {
    const response = await fetch(`${normalizePeerEndpoint(peer.endpoint)}/sync/pull`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sinceHlc }),
    });

    if (!response.ok) {
      throw new SyncApiError(`Peer responded with HTTP ${response.status}.`);
    }

    const parsed = parsePeerPullResponse(await response.json());
    const result = await applyInboundMutations(parsed.mutations);

    return {
      ...result,
      peerId: peer.id,
      checkpointHlc: parsed.checkpointHlc ?? result.checkpointHlc,
    };
  } catch (error) {
    throw toSyncApiError(`Failed to pull mutations from peer ${peer.id}.`, error);
  }
};

export const processOutbox = async (
  peers: SyncPeer[],
  limit = 100,
): Promise<ProcessOutboxResult> => {
  try {
    const pending = await listPendingMutations(limit);
    const pushed: PushResult[] = [];
    const pulled: PullResult[] = [];

    for (const peer of peers) {
      pushed.push(await pushMutationsToPeer(peer, pending));
      pulled.push(await pullMutationsFromPeer(peer, peer.lastPulledHlc));
    }

    return { pushed, pulled };
  } catch (error) {
    throw toSyncApiError("Failed to process sync outbox.", error);
  }
};

export const serializeOutboxEntry = (
  entry: SyncOutboxEntry,
): InboundMutation => ({
  id: entry.id,
  tableName: entry.tableName,
  recordId: entry.recordId,
  operation: entry.operation,
  payload: entry.payload,
  deviceId: entry.deviceId,
  hlc: entry.hlc,
  baseHlc: entry.baseHlc,
  createdAt: entry.createdAt,
});
