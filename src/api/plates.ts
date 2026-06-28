import { z } from "zod";

import {
  IdempotencyKeySchema,
  assertOwnUser,
  getRequiredSession,
  invokeEdgeFunction,
  isRecord,
  readDateValue,
  readNumber,
  readString,
  type JsonObject,
} from "./_shared";
import { FinancialOperationError } from "../lib/errors";
import { PaginationSchema, PlateAmountSchema, UUIDSchema } from "../lib/validation";
import { supabase } from "../lib/supabase";

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

export interface LedgerTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: LedgerTransactionType | string;
  referenceId?: string | null;
  referenceType?: string | null;
  metadata?: JsonObject;
  createdAt: string | Date;
}

export interface PlateMutationResult {
  success?: boolean;
  newBalance?: number;
  balance?: number;
  ledgerEntryId?: string;
  receiptId?: string;
  donationId?: string;
}

export interface PurchasePlatesInput {
  amount: number;
  receiptId: string;
  platform?: "ios" | "android" | "web";
  productId?: string;
  idempotencyKey?: string;
}

export interface DonatePlatesInput {
  amount: number;
  charityName: string;
  charityUrl?: string | null;
  idempotencyKey?: string;
}

const EdgeResultSchema = z.unknown();
const LedgerRowSchema = z.record(z.string(), z.unknown());
const LedgerRowsSchema = z.array(LedgerRowSchema);

const PurchasePlatesSchema = z.object({
  amount: PlateAmountSchema,
  receiptId: z.string().trim().min(1).max(200),
  platform: z.enum(["ios", "android", "web"]).default("ios"),
  productId: z.string().trim().min(1).max(120).optional(),
  idempotencyKey: IdempotencyKeySchema,
});

const DonatePlatesSchema = z.object({
  amount: PlateAmountSchema,
  charityName: z.string().trim().min(1).max(120),
  charityUrl: z.string().trim().url().max(2048).nullish(),
  idempotencyKey: IdempotencyKeySchema,
});

const BalanceQuerySchema = z.object({
  userId: UUIDSchema.optional(),
});

const LedgerQuerySchema = PaginationSchema.extend({
  userId: UUIDSchema.optional(),
});

export async function purchasePlates(input: PurchasePlatesInput): Promise<PlateMutationResult> {
  const parsed = PurchasePlatesSchema.parse(input);
  const result = await invokeEdgeFunction(
    "purchase-plates",
    {
      amount: parsed.amount,
      receiptId: parsed.receiptId,
      platform: parsed.platform,
      productId: parsed.productId,
    },
    EdgeResultSchema,
    parsed.idempotencyKey,
  );

  return normalizePlateMutationResult(result);
}

export async function donatePlates(input: DonatePlatesInput): Promise<PlateMutationResult> {
  const parsed = DonatePlatesSchema.parse(input);
  const result = await invokeEdgeFunction(
    "donate-plates",
    {
      amount: parsed.amount,
      charityName: parsed.charityName,
      charityUrl: parsed.charityUrl ?? null,
    },
    EdgeResultSchema,
    parsed.idempotencyKey,
  );

  return normalizePlateMutationResult(result);
}

export async function getBalance(userId?: string): Promise<number> {
  const session = await getRequiredSession();
  const parsed = BalanceQuerySchema.parse({ userId });
  const scopedUserId = assertOwnUser(session, parsed.userId);
  const { data, error } = await supabase
    .from("users")
    .select("plates")
    .eq("id", scopedUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data || !isRecord(data)) return 0;
  return readNumber(data, "plates") ?? 0;
}

export async function getTransactions(userId?: string, input: Partial<z.infer<typeof LedgerQuerySchema>> = {}): Promise<LedgerTransaction[]> {
  const session = await getRequiredSession();
  const parsed = LedgerQuerySchema.parse({ ...input, userId });
  const scopedUserId = assertOwnUser(session, parsed.userId);
  let query = supabase
    .from("ledger_entries")
    .select("*")
    .eq("user_id", scopedUserId)
    .order("created_at", { ascending: false })
    .limit(parsed.limit);

  if (parsed.cursor) query = query.lt("created_at", parsed.cursor);

  const { data, error } = await query;
  if (error) throw error;
  return LedgerRowsSchema.parse(data ?? []).map(normalizeLedgerTransaction);
}

export async function getPlateBalance(userId: string): Promise<number> {
  return getBalance(userId);
}

export async function getLedgerHistory(userId: string, limit = 50): Promise<LedgerTransaction[]> {
  return getTransactions(userId, { limit });
}

export async function deductPlates(): Promise<never> {
  throw new FinancialOperationError("Plate deductions must go through an authenticated Edge Function.");
}

export async function addPlates(): Promise<never> {
  throw new FinancialOperationError("Plate credits must go through an authenticated Edge Function.");
}

function normalizePlateMutationResult(result: unknown): PlateMutationResult {
  if (!isRecord(result)) {
    return { success: true };
  }

  return {
    success: readBooleanLike(result, "success"),
    newBalance: readNumber(result, "newBalance", "new_balance") ?? readNumber(result, "balance"),
    balance: readNumber(result, "balance"),
    ledgerEntryId: readString(result, "ledgerEntryId", "ledger_entry_id"),
    receiptId: readString(result, "receiptId", "receipt_id"),
    donationId: readString(result, "donationId", "donation_id"),
  };
}

function normalizeLedgerTransaction(row: Record<string, unknown>): LedgerTransaction {
  const metadata = row.metadata && isRecord(row.metadata) ? (row.metadata as JsonObject) : undefined;

  return {
    id: readString(row, "id") ?? "",
    userId: readString(row, "userId", "user_id") ?? "",
    amount: readNumber(row, "amount") ?? 0,
    balanceAfter: readNumber(row, "balanceAfter", "balance_after") ?? 0,
    type: readString(row, "type") ?? "spend",
    referenceId: readString(row, "referenceId", "reference_id") ?? null,
    referenceType: readString(row, "referenceType", "reference_type") ?? null,
    metadata,
    createdAt: readDateValue(row, "createdAt", "created_at") ?? new Date().toISOString(),
  };
}

function readBooleanLike(row: Record<string, unknown>, key: string): boolean | undefined {
  const value = row[key];
  return typeof value === "boolean" ? value : undefined;
}
