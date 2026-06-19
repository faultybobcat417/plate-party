import { and, asc, eq, sql } from "drizzle-orm";
import type * as SQLite from "expo-sqlite";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  createDefaultHlc,
  createUuid,
  ledgerEntries,
  type LedgerAccountType,
  type LedgerEntry,
  type LedgerSourceTable,
  partyMembers,
  parties,
  type Uuid,
} from "../db/schema";
import type { SqlExecutor } from "./sync";

export type LedgerPosting = {
  accountType: LedgerAccountType;
  accountId: string;
  plateDelta: number;
  memo?: string | null;
};

export type LedgerTransactionInput = {
  partyId: Uuid;
  sourceTable: LedgerSourceTable;
  sourceId: Uuid;
  entries: readonly LedgerPosting[];
  deviceId?: string | null;
  wagerId?: Uuid | null;
  betId?: Uuid | null;
  poolTransactionId?: Uuid | null;
  iouId?: Uuid | null;
  transactionId?: Uuid;
  createdAt?: string;
};

export type LedgerTransferInput = {
  partyId: Uuid;
  from: Omit<LedgerPosting, "plateDelta">;
  to: Omit<LedgerPosting, "plateDelta">;
  plateAmount: number;
  sourceTable: LedgerSourceTable;
  sourceId: Uuid;
  deviceId?: string | null;
  wagerId?: Uuid | null;
  betId?: Uuid | null;
  poolTransactionId?: Uuid | null;
  iouId?: Uuid | null;
};

export type AccountBalance = {
  accountType: LedgerAccountType;
  accountId: string;
  balance: number;
};

type BalanceRow = {
  balance: number | null;
};

type MemberBalanceRow = {
  plate_balance: number;
  reserved_plate_balance: number;
};

type PartyPoolRow = {
  charity_pool_plates: number;
};

type TransactionBalanceRow = {
  total: number | null;
};

const ledgerEntrySelectColumns = `
  id,
  transaction_id as transactionId,
  party_id as partyId,
  wager_id as wagerId,
  bet_id as betId,
  pool_transaction_id as poolTransactionId,
  iou_id as iouId,
  source_table as sourceTable,
  source_id as sourceId,
  account_type as accountType,
  account_id as accountId,
  plate_delta as plateDelta,
  memo,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  hlc,
  last_modified_by_device_id as lastModifiedByDeviceId
`;

export class LedgerError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LedgerError";
    this.cause = cause;
  }
}

const toLedgerError = (message: string, error: unknown): LedgerError => {
  if (error instanceof LedgerError) {
    return error;
  }

  return new LedgerError(message, error);
};

const assertPositiveInteger = (value: number, label: string): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new LedgerError(`${label} must be a positive integer.`);
  }
};

export const assertBalancedEntries = (
  entries: readonly LedgerPosting[],
): void => {
  if (entries.length < 2) {
    throw new LedgerError("A ledger transaction requires at least two entries.");
  }

  const total = entries.reduce((sum, entry) => {
    if (!Number.isInteger(entry.plateDelta) || entry.plateDelta === 0) {
      throw new LedgerError("Ledger entry plate deltas must be non-zero integers.");
    }

    return sum + entry.plateDelta;
  }, 0);

  if (total !== 0) {
    throw new LedgerError("Ledger transaction is not balanced.");
  }
};

const validateSufficientMemberBalance = async (
  executor: SqlExecutor,
  partyId: Uuid,
  entries: readonly LedgerPosting[],
): Promise<void> => {
  try {
    const debitsByUser = new Map<string, number>();

    for (const entry of entries) {
      if (entry.accountType === "member_available" && entry.plateDelta < 0) {
        debitsByUser.set(
          entry.accountId,
          (debitsByUser.get(entry.accountId) ?? 0) + Math.abs(entry.plateDelta),
        );
      }
    }

    for (const [userId, debitAmount] of debitsByUser) {
      const row = await executor.getFirstAsync<MemberBalanceRow>(
        `select plate_balance, reserved_plate_balance
         from party_members
         where party_id = ? and user_id = ? and deleted_at is null and left_at is null`,
        [partyId, userId],
      );

      if (!row) {
        throw new LedgerError("Party member account does not exist.");
      }

      if (row.plate_balance < debitAmount) {
        throw new LedgerError("Insufficient plate balance.");
      }
    }
  } catch (error) {
    throw toLedgerError("Failed to validate member balance.", error);
  }
};

const insertLedgerEntries = async (
  executor: SqlExecutor,
  input: LedgerTransactionInput,
): Promise<LedgerEntry[]> => {
  try {
    assertBalancedEntries(input.entries);
    await validateSufficientMemberBalance(executor, input.partyId, input.entries);

    const transactionId = input.transactionId ?? createUuid();
    const createdAt = input.createdAt ?? new Date().toISOString();
    const inserted: LedgerEntry[] = [];

    for (const entry of input.entries) {
      const id = createUuid();

      await executor.runAsync(
        `insert into ledger_entries (
          id,
          transaction_id,
          party_id,
          wager_id,
          bet_id,
          pool_transaction_id,
          iou_id,
          source_table,
          source_id,
          account_type,
          account_id,
          plate_delta,
          memo,
          created_at,
          updated_at,
          hlc,
          last_modified_by_device_id
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          transactionId,
          input.partyId,
          input.wagerId ?? null,
          input.betId ?? null,
          input.poolTransactionId ?? null,
          input.iouId ?? null,
          input.sourceTable,
          input.sourceId,
          entry.accountType,
          entry.accountId,
          entry.plateDelta,
          entry.memo ?? null,
          createdAt,
          createdAt,
          createDefaultHlc(),
          input.deviceId ?? null,
        ],
      );

      const row = await executor.getFirstAsync<LedgerEntry>(
        `select ${ledgerEntrySelectColumns} from ledger_entries where id = ?`,
        id,
      );

      if (!row) {
        throw new LedgerError("Ledger entry insert succeeded but could not be read.");
      }

      inserted.push(row);
    }

    return inserted;
  } catch (error) {
    throw toLedgerError("Failed to insert ledger entries.", error);
  }
};

export const postLedgerTransaction = async (
  input: LedgerTransactionInput,
  executor?: SqlExecutor,
): Promise<LedgerEntry[]> => {
  try {
    if (executor) {
      return await insertLedgerEntries(executor, input);
    }

    const database = await openSQLiteDatabase();
    let entries: LedgerEntry[] = [];

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        entries = await insertLedgerEntries(transaction, input);
      } catch (error) {
        throw toLedgerError("Failed during ledger transaction.", error);
      }
    });

    return entries;
  } catch (error) {
    throw toLedgerError("Failed to post ledger transaction.", error);
  }
};

export const postLedgerTransfer = async (
  input: LedgerTransferInput,
  executor?: SqlExecutor,
): Promise<LedgerEntry[]> => {
  try {
    assertPositiveInteger(input.plateAmount, "plateAmount");

    return await postLedgerTransaction(
      {
        partyId: input.partyId,
        sourceTable: input.sourceTable,
        sourceId: input.sourceId,
        deviceId: input.deviceId,
        wagerId: input.wagerId,
        betId: input.betId,
        poolTransactionId: input.poolTransactionId,
        iouId: input.iouId,
        entries: [
          {
            accountType: input.from.accountType,
            accountId: input.from.accountId,
            plateDelta: -input.plateAmount,
            memo: input.from.memo ?? null,
          },
          {
            accountType: input.to.accountType,
            accountId: input.to.accountId,
            plateDelta: input.plateAmount,
            memo: input.to.memo ?? null,
          },
        ],
      },
      executor,
    );
  } catch (error) {
    throw toLedgerError("Failed to post ledger transfer.", error);
  }
};

export const getLedgerBalance = async (
  accountType: LedgerAccountType,
  accountId: string,
  partyId?: Uuid,
): Promise<number> => {
  try {
    const database = await openSQLiteDatabase();
    const row = partyId
      ? await database.getFirstAsync<BalanceRow>(
          `select coalesce(sum(plate_delta), 0) as balance
           from ledger_entries
           where account_type = ? and account_id = ? and party_id = ? and deleted_at is null`,
          [accountType, accountId, partyId],
        )
      : await database.getFirstAsync<BalanceRow>(
          `select coalesce(sum(plate_delta), 0) as balance
           from ledger_entries
           where account_type = ? and account_id = ? and deleted_at is null`,
          [accountType, accountId],
        );

    return row?.balance ?? 0;
  } catch (error) {
    throw toLedgerError("Failed to read ledger balance.", error);
  }
};

export const getPartyAccountBalances = async (
  partyId: Uuid,
): Promise<AccountBalance[]> => {
  try {
    const db = await getDb();
    const rows = await db
      .select({
        accountType: ledgerEntries.accountType,
        accountId: ledgerEntries.accountId,
        balance: sql<number>`coalesce(sum(${ledgerEntries.plateDelta}), 0)`,
      })
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.partyId, partyId), sql`${ledgerEntries.deletedAt} is null`))
      .groupBy(ledgerEntries.accountType, ledgerEntries.accountId);

    return rows.map((row) => ({
      accountType: row.accountType,
      accountId: row.accountId,
      balance: Number(row.balance),
    }));
  } catch (error) {
    throw toLedgerError("Failed to read party account balances.", error);
  }
};

export const getMemberPlateBalance = async (
  partyId: Uuid,
  userId: Uuid,
): Promise<number> => {
  try {
    const db = await getDb();
    const member = await db
      .select({ plateBalance: partyMembers.plateBalance })
      .from(partyMembers)
      .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)))
      .limit(1);

    if (!member[0]) {
      throw new LedgerError("Party member not found.");
    }

    return member[0].plateBalance;
  } catch (error) {
    throw toLedgerError("Failed to read member plate balance.", error);
  }
};

export const assertMemberCanSpend = async (
  partyId: Uuid,
  userId: Uuid,
  plateAmount: number,
  executor?: SqlExecutor,
): Promise<void> => {
  try {
    assertPositiveInteger(plateAmount, "plateAmount");
    const database = executor ?? (await openSQLiteDatabase());
    const row = await database.getFirstAsync<MemberBalanceRow>(
      `select plate_balance, reserved_plate_balance
       from party_members
       where party_id = ? and user_id = ? and deleted_at is null and left_at is null`,
      [partyId, userId],
    );

    if (!row) {
      throw new LedgerError("Party member not found.");
    }

    if (row.plate_balance < plateAmount) {
      throw new LedgerError("Insufficient plate balance.");
    }
  } catch (error) {
    throw toLedgerError("Failed to validate spendable plate balance.", error);
  }
};

export const applyMemberPlateDelta = async (
  partyId: Uuid,
  userId: Uuid,
  plateDelta: number,
  executor?: SqlExecutor,
): Promise<number> => {
  try {
    if (!Number.isInteger(plateDelta) || plateDelta === 0) {
      throw new LedgerError("plateDelta must be a non-zero integer.");
    }

    const database = executor ?? (await openSQLiteDatabase());
    const row = await database.getFirstAsync<MemberBalanceRow>(
      `select plate_balance, reserved_plate_balance
       from party_members
       where party_id = ? and user_id = ? and deleted_at is null and left_at is null`,
      [partyId, userId],
    );

    if (!row) {
      throw new LedgerError("Party member not found.");
    }

    const nextBalance = row.plate_balance + plateDelta;

    if (nextBalance < 0) {
      throw new LedgerError("Insufficient plate balance.");
    }

    await database.runAsync(
      `update party_members
       set plate_balance = ?, updated_at = ?, hlc = ?
       where party_id = ? and user_id = ?`,
      [nextBalance, new Date().toISOString(), createDefaultHlc(), partyId, userId],
    );

    return nextBalance;
  } catch (error) {
    throw toLedgerError("Failed to apply member plate balance delta.", error);
  }
};

export const applyPartyPoolDelta = async (
  partyId: Uuid,
  plateDelta: number,
  executor?: SqlExecutor,
): Promise<number> => {
  try {
    if (!Number.isInteger(plateDelta) || plateDelta === 0) {
      throw new LedgerError("plateDelta must be a non-zero integer.");
    }

    const database = executor ?? (await openSQLiteDatabase());
    const row = await database.getFirstAsync<PartyPoolRow>(
      "select charity_pool_plates from parties where id = ? and deleted_at is null",
      partyId,
    );

    if (!row) {
      throw new LedgerError("Party not found.");
    }

    const nextPool = row.charity_pool_plates + plateDelta;

    if (nextPool < 0) {
      throw new LedgerError("Charity pool cannot be negative.");
    }

    await database.runAsync(
      "update parties set charity_pool_plates = ?, updated_at = ?, hlc = ? where id = ?",
      [nextPool, new Date().toISOString(), createDefaultHlc(), partyId],
    );

    return nextPool;
  } catch (error) {
    throw toLedgerError("Failed to apply charity pool delta.", error);
  }
};

export const verifyLedgerTransactionBalanced = async (
  transactionId: Uuid,
): Promise<boolean> => {
  try {
    const database = await openSQLiteDatabase();
    const row = await database.getFirstAsync<TransactionBalanceRow>(
      `select coalesce(sum(plate_delta), 0) as total
       from ledger_entries
       where transaction_id = ? and deleted_at is null`,
      transactionId,
    );

    return (row?.total ?? 0) === 0;
  } catch (error) {
    throw toLedgerError("Failed to verify ledger transaction balance.", error);
  }
};

export const listLedgerEntriesForParty = async (
  partyId: Uuid,
  limit = 100,
): Promise<LedgerEntry[]> => {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.partyId, partyId))
      .orderBy(asc(ledgerEntries.createdAt))
      .limit(limit);
  } catch (error) {
    throw toLedgerError("Failed to list party ledger entries.", error);
  }
};

export const reconcileStoredBalances = async (partyId: Uuid): Promise<void> => {
  try {
    const database = await openSQLiteDatabase();

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        const memberBalances = await transaction.getAllAsync<{
          account_id: string;
          balance: number;
        }>(
          `select account_id, coalesce(sum(plate_delta), 0) as balance
           from ledger_entries
           where party_id = ? and account_type = 'member_available' and deleted_at is null
           group by account_id`,
          partyId,
        );

        for (const balance of memberBalances) {
          await transaction.runAsync(
            `update party_members
             set plate_balance = ?, updated_at = ?, hlc = ?
             where party_id = ? and user_id = ?`,
            [
              balance.balance,
              new Date().toISOString(),
              createDefaultHlc(),
              partyId,
              balance.account_id,
            ],
          );
        }

        const poolBalance = await transaction.getFirstAsync<BalanceRow>(
          `select coalesce(sum(plate_delta), 0) as balance
           from ledger_entries
           where party_id = ? and account_type = 'charity_pool' and deleted_at is null`,
          partyId,
        );

        await transaction.runAsync(
          "update parties set charity_pool_plates = ?, updated_at = ?, hlc = ? where id = ?",
          [
            poolBalance?.balance ?? 0,
            new Date().toISOString(),
            createDefaultHlc(),
            partyId,
          ],
        );
      } catch (error) {
        throw toLedgerError("Failed during balance reconciliation transaction.", error);
      }
    });
  } catch (error) {
    throw toLedgerError("Failed to reconcile stored balances.", error);
  }
};

export const seedMemberOpeningBalance = async (
  partyId: Uuid,
  userId: Uuid,
  plateAmount: number,
  deviceId?: string | null,
  executor?: SqlExecutor,
): Promise<LedgerEntry[]> => {
  try {
    assertPositiveInteger(plateAmount, "plateAmount");

    return await postLedgerTransaction(
      {
        partyId,
        sourceTable: "manual_adjustments",
        sourceId: createUuid(),
        deviceId,
        entries: [
          {
            accountType: "charity_pool",
            accountId: partyId,
            plateDelta: -plateAmount,
            memo: "Opening member allocation",
          },
          {
            accountType: "member_available",
            accountId: userId,
            plateDelta: plateAmount,
            memo: "Opening member allocation",
          },
        ],
      },
      executor,
    );
  } catch (error) {
    throw toLedgerError("Failed to seed member opening balance.", error);
  }
};

export const getCharityPoolStoredBalance = async (
  partyId: Uuid,
): Promise<number> => {
  try {
    const db = await getDb();
    const rows = await db
      .select({ charityPoolPlates: parties.charityPoolPlates })
      .from(parties)
      .where(eq(parties.id, partyId))
      .limit(1);

    if (!rows[0]) {
      throw new LedgerError("Party not found.");
    }

    return rows[0].charityPoolPlates;
  } catch (error) {
    throw toLedgerError("Failed to read charity pool balance.", error);
  }
};

export const ledgerEntryToPayload = (entry: LedgerEntry): Record<string, string | number | null> => ({
  id: entry.id,
  transactionId: entry.transactionId,
  partyId: entry.partyId,
  wagerId: entry.wagerId,
  betId: entry.betId,
  poolTransactionId: entry.poolTransactionId,
  iouId: entry.iouId,
  sourceTable: entry.sourceTable,
  sourceId: entry.sourceId,
  accountType: entry.accountType,
  accountId: entry.accountId,
  plateDelta: entry.plateDelta,
  memo: entry.memo,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
  deletedAt: entry.deletedAt,
  hlc: entry.hlc,
  lastModifiedByDeviceId: entry.lastModifiedByDeviceId,
});
