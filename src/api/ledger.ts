import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDb } from "../db/connection";
import { ledgerEntries } from "../db/schema";

export interface LedgerTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  reference?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hlc: string;
  lastModifiedByDeviceId: string | null;
  partyId: string;
  wagerId: string | null;
  transactionId: string;
  memo: string | null;
  balanceAfter?: number;
  status?: string;
  metadata?: string | null;
}

export interface LedgerTransactionInput {
  userId?: string;
  amount?: number;
  type?: string;
  reference?: string;
  description?: string;
  partyId?: string;
  sourceTable?: string;
  sourceId?: string;
  transactionId?: string;
  deviceId?: string;
  wagerId?: string | null;
  betId?: string | null;
  entries?: Array<{
    accountType: string;
    accountId: string;
    plateDelta: number;
    memo: string;
  }>;
}

export interface AccountBalance {
  partyId: string;
  accountId: string;
  accountType: string;
  balance: number;
  lastUpdated: string;
}

export async function postLedgerTransaction(data: LedgerTransactionInput, _executor?: unknown): Promise<LedgerTransaction> {
  const now = new Date().toISOString();
  const tx: LedgerTransaction = {
    id: Date.now().toString(),
    userId: data.userId || 'anonymous',
    amount: data.amount ?? 0,
    type: data.type ?? 'unknown',
    reference: data.reference,
    description: data.description,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    hlc: Date.now().toString(),
    lastModifiedByDeviceId: data.deviceId || null,
    partyId: data.partyId || 'anonymous',
    wagerId: data.wagerId ?? null,
    transactionId: data.transactionId || Date.now().toString(),
    memo: data.description || null,
    balanceAfter: 0,
    status: 'completed',
    metadata: null,
  };

  // ── NEW: Also write to SQLite ledger_entries ──
  try {
    const db = await getDb();
    if (data.entries && data.entries.length > 0) {
      for (const entry of data.entries) {
        await db.insert(ledgerEntries).values({
          transactionId: tx.transactionId,
          partyId: data.partyId || 'anonymous',
          wagerId: data.wagerId ?? null,
          betId: data.betId ?? null,
          poolTransactionId: null,
          iouId: null,
          sourceTable: (data.sourceTable as any) || 'manual_adjustments',
          sourceId: data.sourceId || tx.transactionId,
          accountType: entry.accountType as any,
          accountId: entry.accountId,
          plateDelta: entry.plateDelta,
          memo: entry.memo || data.description || null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          hlc: now,
          lastModifiedByDeviceId: data.deviceId || null,
        });
      }
    } else {
      await db.insert(ledgerEntries).values({
        transactionId: tx.transactionId,
        partyId: data.partyId || 'anonymous',
        wagerId: data.wagerId ?? null,
        betId: data.betId ?? null,
        poolTransactionId: null,
        iouId: null,
        sourceTable: (data.sourceTable as any) || 'manual_adjustments',
        sourceId: data.sourceId || tx.transactionId,
        accountType: (data.type as any) || 'member_available',
        accountId: data.userId || 'anonymous',
        plateDelta: data.amount ?? 0,
        memo: data.description || null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        hlc: now,
        lastModifiedByDeviceId: data.deviceId || null,
      });
    }
  } catch (err) {
    console.error('[Ledger] SQLite write failed:', err);
  }

  // ── Keep AsyncStorage for backward compatibility ──
  const existing = await AsyncStorage.getItem('ledger_transactions');
  const transactions = existing ? JSON.parse(existing) : [];
  transactions.push(tx);
  await AsyncStorage.setItem('ledger_transactions', JSON.stringify(transactions));
  return tx;
}

export async function getLedgerTransactions(): Promise<LedgerTransaction[]> {
  const data = await AsyncStorage.getItem('ledger_transactions');
  return data ? JSON.parse(data) : [];
}

export async function getPartyAccountBalances(partyId?: string): Promise<AccountBalance[]> {
  return [];
}

export async function listAllLedgerEntries(limit?: number): Promise<LedgerTransaction[]> {
  const data = await AsyncStorage.getItem('ledger_transactions');
  const txs = data ? JSON.parse(data) : [];
  return limit ? txs.slice(0, limit) : txs;
}

export async function listLedgerEntriesForParty(partyId: string, limit?: number): Promise<LedgerTransaction[]> {
  const all = await getLedgerTransactions();
  const filtered = all.filter((t) => t.partyId === partyId || t.userId === partyId);
  return limit ? filtered.slice(0, limit) : filtered;
}
