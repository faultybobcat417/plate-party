import { z } from "zod";

import { FinancialOperationError } from "../lib/errors";
import { PaginationSchema, UUIDSchema } from "../lib/validation";
import { supabase } from "../lib/supabase";
import {
  getRequiredSession,
  isRecord,
  readNumber,
  readString,
  type JsonObject,
} from "./_shared";
import { getTransactions } from "./plates";

export type LedgerTransactionType =
  | "earn"
  | "spend"
  | "donate"
  | "donation"
  | "purchase"
  | "iap_purchase"
  | "win"
  | "loss"
  | "refund"
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
  balanceAfter?: number;
  type?: LedgerTransactionType | string;
  description?: string;
  referenceId?: string | null;
  referenceType?: string | null;
  reference?: string;
  partyId?: string;
  sourceTable?: string;
  sourceId?: string;
  transactionId?: string;
  deviceId?: string;
  wagerId?: string;
  betId?: string;
  entries?: LedgerEntryInput[];
  metadata?: JsonObject;
  createdAt: string | Date;
}

export type AccountBalance = {
  accountId: string;
  accountType: string;
  balance: number;
};

const PartyBalanceRowsSchema = z.array(z.record(z.string(), z.unknown()));
const PartyLedgerSchema = PaginationSchema.extend({
  partyId: UUIDSchema,
});

export async function postLedgerTransaction(
  _tx: Omit<LedgerTransaction, "id" | "createdAt">,
): Promise<LedgerTransaction> {
  throw new FinancialOperationError("Ledger writes must be created by atomic Supabase RPCs.");
}

export async function getUserLedger(userId: string): Promise<LedgerTransaction[]> {
  return getTransactions(userId);
}

export async function listLedgerEntriesForParty(partyId: string, limit = 100): Promise<LedgerTransaction[]> {
  const parsed = PartyLedgerSchema.parse({ partyId, limit });
  const entries = await getTransactions(undefined, { limit: parsed.limit });
  return entries
    .map((entry) => ({ ...entry, partyId: getPartyId(entry.metadata) }))
    .filter((entry) => entry.partyId === parsed.partyId);
}

export async function listAllLedgerEntries(limit = 200): Promise<LedgerTransaction[]> {
  return getTransactions(undefined, { limit });
}

export async function getPartyAccountBalances(partyId: string): Promise<AccountBalance[]> {
  await getRequiredSession();
  const id = UUIDSchema.parse(partyId);
  const { data, error } = await supabase
    .from("party_members")
    .select("user_id, plate_balance")
    .eq("party_id", id)
    .is("deleted_at", null);

  if (error) throw error;
  return PartyBalanceRowsSchema.parse(data ?? []).map((row) => ({
    accountId: readString(row, "userId", "user_id") ?? "",
    accountType: "user",
    balance: readNumber(row, "plateBalance", "plate_balance") ?? 0,
  }));
}

function getPartyId(metadata: JsonObject | undefined): string | undefined {
  const value = metadata?.partyId ?? metadata?.party_id;
  return typeof value === "string" ? value : undefined;
}
