import * as Crypto from "expo-crypto";

export type LedgerTransactionType =
  | "earn"
  | "spend"
  | "donate"
  | "win"
  | "loss"
  | "tutorial_reward"
  | "goal_reward"
  | "bet_placed"
  | "wager_escrow";

export type LedgerEntryInput = {
  accountType: string;
  accountId: string;
  plateDelta: number;
  memo?: string;
};

export interface LedgerTransaction {
  id: string;
  userId?: string;
  amount?: number;
  type?: LedgerTransactionType;
  description?: string;
  reference?: string;
  partyId?: string;
  sourceTable?: string;
  sourceId?: string;
  transactionId?: string;
  deviceId?: string;
  wagerId?: string;
  betId?: string;
  entries?: LedgerEntryInput[];
  createdAt: string;
}

export type AccountBalance = {
  accountId: string;
  accountType: string;
  balance: number;
};

export async function postLedgerTransaction(
  tx: Omit<LedgerTransaction, "id" | "createdAt">,
): Promise<LedgerTransaction> {
  return {
    id: tx.transactionId ?? Crypto.randomUUID(),
    ...tx,
    createdAt: new Date().toISOString(),
  };
}

export async function getUserLedger(_userId: string): Promise<LedgerTransaction[]> {
  return [];
}

export async function listLedgerEntriesForParty(
  _partyId: string,
  _limit = 100,
): Promise<LedgerTransaction[]> {
  return [];
}

export async function listAllLedgerEntries(_limit = 200): Promise<LedgerTransaction[]> {
  return [];
}

export async function getPartyAccountBalances(_partyId: string): Promise<AccountBalance[]> {
  return [];
}
