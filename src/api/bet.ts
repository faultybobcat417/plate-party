import { and, eq, sql } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  bets,
  createDefaultHlc,
  createUuid,
  partyMembers,
  type Uuid,
  wagerOptions,
  wagers,
} from "../db/schema";
import { postLedgerTransaction } from "./ledger";
import { enqueueMutation } from "./sync";

export type PlaceBetInput = {
  wagerId: Uuid;
  optionId: Uuid;
  userId: Uuid;
  partyId: Uuid;
  plates: number;
  realMoneyAmountCents?: number | null;
  deviceId: string;
};

export type PlaceBetResult = {
  betId: Uuid;
  transactionId: Uuid;
};

export type CancelBetInput = {
  betId: Uuid;
  userId: Uuid;
  deviceId: string;
};

export type CancelBetResult = {
  refunded: boolean;
  platesRefunded: number;
};

export type BetWithDetails = {
  id: Uuid;
  wagerId: Uuid;
  userId: Uuid;
  optionId: Uuid;
  platesWagered: number;
  realMoneyAmountCents: number | null;
  placedAt: string;
  lockedAt: string | null;
  resolvedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hlc: string;
  lastModifiedByDeviceId: string | null;
  userDisplayName: string;
  optionLabel: string;
  displayName?: string;
};

export type UserBetWithDetails = {
  id: Uuid;
  wagerId: Uuid;
  userId: Uuid;
  optionId: Uuid;
  platesWagered: number;
  realMoneyAmountCents: number | null;
  placedAt: string;
  lockedAt: string | null;
  resolvedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hlc: string;
  lastModifiedByDeviceId: string | null;
  wagerQuestion: string;
  partyName: string;
  optionLabel: string;
};

export class BetApiError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "BetApiError";
    this.cause = cause;
  }
}

const toBetApiError = (message: string, error: unknown): BetApiError => {
  if (error instanceof BetApiError) {
    return error;
  }
  return new BetApiError(message, error);
};

const now = (): string => new Date().toISOString();

export const placeBet = async (input: PlaceBetInput): Promise<PlaceBetResult> => {
  try {
    if (input.plates <= 0) {
      throw new BetApiError("Plate amount must be greater than 0.");
    }

    const database = await openSQLiteDatabase();
    const betId = createUuid();
    const transactionId = createUuid();
    const timestamp = now();
    const betHlc = createDefaultHlc();

    await database.withExclusiveTransactionAsync(async (transaction) => {
      // 1. Validate wager is open and deadline not passed
      const wagerRow = await transaction.getFirstAsync<{
        id: string;
        party_id: string;
        deadline: string;
        status: string;
      }>(
        "select id, party_id, deadline, status from wagers where id = ? and deleted_at is null",
        input.wagerId,
      );

      if (!wagerRow) {
        throw new BetApiError("Wager not found.");
      }

      if (wagerRow.status !== "open") {
        throw new BetApiError(`Wager status is ${wagerRow.status}, expected 'open'.`);
      }

      if (new Date(wagerRow.deadline) <= new Date()) {
        throw new BetApiError("Wager deadline has passed.");
      }

      if (wagerRow.party_id !== input.partyId) {
        throw new BetApiError("Wager does not belong to party.");
      }

      // 2. Validate option belongs to wager
      const optionRow = await transaction.getFirstAsync<{ id: string }>(
        "select id from wager_options where id = ? and wager_id = ? and deleted_at is null",
        [input.optionId, input.wagerId],
      );
      if (!optionRow) {
        throw new BetApiError("Option does not belong to this wager.");
      }

      // 3. Validate user is active member
      const memberRow = await transaction.getFirstAsync<{
        plate_balance: number;
        reserved_plate_balance: number;
      }>(
        "select plate_balance, reserved_plate_balance from party_members where party_id = ? and user_id = ? and deleted_at is null and left_at is null",
        [input.partyId, input.userId],
      );
      if (!memberRow) {
        throw new BetApiError("User is not an active member of this party.");
      }

      // 4. Validate no duplicate bet
      const existingBet = await transaction.getFirstAsync<{ id: string }>(
        "select id from bets where wager_id = ? and user_id = ? and deleted_at is null",
        [input.wagerId, input.userId],
      );
      if (existingBet) {
        throw new BetApiError("User already has a bet on this wager.");
      }

      // 5. Validate sufficient balance
      const availableBalance = memberRow.plate_balance - memberRow.reserved_plate_balance;
      if (availableBalance < input.plates) {
        throw new BetApiError(
          `Insufficient plate balance. Available: ${availableBalance}, Required: ${input.plates}`,
        );
      }

      // 6. Post ledger transaction: member_available -> wager_escrow
      await postLedgerTransaction(
        {
          partyId: input.partyId,
          sourceTable: "bets",
          sourceId: betId,
          transactionId,
          deviceId: input.deviceId,
          wagerId: input.wagerId,
          entries: [
            {
              accountType: "member_available",
              accountId: input.userId,
              plateDelta: -input.plates,
              memo: "Bet placed - reserve plates",
            },
            {
              accountType: "wager_escrow",
              accountId: input.wagerId,
              plateDelta: input.plates,
              memo: "Bet placed - escrow plates",
            },
          ],
        });

      // 7. Update member reserved balance and total wagered
      await transaction.runAsync(
        "update party_members set reserved_plate_balance = reserved_plate_balance + ?, total_plates_wagered = total_plates_wagered + ?, updated_at = ?, hlc = ? where party_id = ? and user_id = ?",
        [input.plates, input.plates, timestamp, createDefaultHlc(), input.partyId, input.userId],
      );

      // 8. Insert bet
      await transaction.runAsync(
        `insert into bets (
          id, wager_id, user_id, option_id, plates_wagered, real_money_amount_cents,
          placed_at, status, created_at, updated_at, hlc, last_modified_by_device_id
        ) values (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [
          betId,
          input.wagerId,
          input.userId,
          input.optionId,
          input.plates,
          input.realMoneyAmountCents ?? null,
          timestamp,
          timestamp,
          timestamp,
          betHlc,
          input.deviceId,
        ],
      );

      // 9. Enqueue sync mutation
      await enqueueMutation(
        {
          tableName: "bets",
          recordId: betId,
          operation: "insert",
          payload: {
            id: betId,
            wagerId: input.wagerId,
            userId: input.userId,
            optionId: input.optionId,
            platesWagered: input.plates,
            realMoneyAmountCents: input.realMoneyAmountCents ?? null,
            status: "pending",
            placedAt: timestamp,
          },
          deviceId: input.deviceId,
          hlc: betHlc,
        });
    });

    return { betId, transactionId };
  } catch (error) {
    throw toBetApiError("Failed to place bet.", error);
  }
};

export const cancelBet = async (input: CancelBetInput): Promise<CancelBetResult> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const cancelHlc = createDefaultHlc();
    let platesRefunded = 0;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      // 1. Fetch bet
      const betRow = await transaction.getFirstAsync<{
        id: string;
        wager_id: string;
        user_id: string;
        plates_wagered: number;
        status: string;
      }>(
        "select id, wager_id, user_id, plates_wagered, status from bets where id = ? and deleted_at is null",
        input.betId,
      );
      if (!betRow) {
        throw new BetApiError("Bet not found.");
      }
      if (betRow.user_id !== input.userId) {
        throw new BetApiError("Bet does not belong to user.");
      }
      if (betRow.status !== "pending") {
        throw new BetApiError(`Cannot cancel bet with status ${betRow.status}.`);
      }

      // 2. Check wager is still open
      const wagerRow = await transaction.getFirstAsync<{ status: string; party_id: string }>(
        "select status, party_id from wagers where id = ? and deleted_at is null",
        betRow.wager_id,
      );
      if (!wagerRow || wagerRow.status !== "open") {
        throw new BetApiError("Cannot cancel bet on closed wager.");
      }

      platesRefunded = betRow.plates_wagered;

      // 3. Refund ledger: wager_escrow -> member_available
      await postLedgerTransaction(
        {
          partyId: wagerRow.party_id,
          sourceTable: "bets",
          sourceId: betRow.id,
          deviceId: input.deviceId,
          wagerId: betRow.wager_id,
          betId: betRow.id,
          entries: [
            {
              accountType: "wager_escrow",
              accountId: betRow.wager_id,
              plateDelta: -betRow.plates_wagered,
              memo: "Bet cancelled - refund from escrow",
            },
            {
              accountType: "member_available",
              accountId: input.userId,
              plateDelta: betRow.plates_wagered,
              memo: "Bet cancelled - refund to available",
            },
          ],
        },
        transaction,
      );

      // 4. Update member reserved balance
      await transaction.runAsync(
        "update party_members set reserved_plate_balance = max(0, reserved_plate_balance - ?), updated_at = ?, hlc = ? where party_id = ? and user_id = ?",
        [betRow.plates_wagered, timestamp, cancelHlc, wagerRow.party_id, input.userId],
      );

      // 5. Update bet status
      await transaction.runAsync(
        "update bets set status = 'void', updated_at = ?, hlc = ? where id = ?",
        [timestamp, cancelHlc, input.betId],
      );

      // 6. Sync
      await enqueueMutation(
        {
          tableName: "bets",
          recordId: betRow.id,
          operation: "update",
          payload: { status: "void" },
          deviceId: input.deviceId,
          hlc: cancelHlc,
        });
    });

    return { refunded: true, platesRefunded };
  } catch (error) {
    throw toBetApiError("Failed to cancel bet.", error);
  }
};

export const getBetsForWager = async (wagerId: Uuid): Promise<BetWithDetails[]> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<BetWithDetails>(
      `select
        b.id, b.wager_id as wagerId, b.user_id as userId, b.option_id as optionId,
        b.plates_wagered as platesWagered, b.real_money_amount_cents as realMoneyAmountCents,
        b.placed_at as placedAt, b.locked_at as lockedAt, b.resolved_at as resolvedAt,
        b.status, b.created_at as createdAt, b.updated_at as updatedAt,
        b.deleted_at as deletedAt, b.hlc, b.last_modified_by_device_id as lastModifiedByDeviceId,
        u.display_name as userDisplayName, wo.label as optionLabel
       from bets b
       join users u on u.id = b.user_id
       join wager_options wo on wo.id = b.option_id
       where b.wager_id = ? and b.deleted_at is null
       order by b.created_at desc`,
      wagerId,
    );
    return rows;
  } catch (error) {
    throw toBetApiError("Failed to get bets for wager.", error);
  }
};

export const getBetsForUser = async (userId: Uuid): Promise<UserBetWithDetails[]> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<UserBetWithDetails>(
      `select
        b.id, b.wager_id as wagerId, b.user_id as userId, b.option_id as optionId,
        b.plates_wagered as platesWagered, b.real_money_amount_cents as realMoneyAmountCents,
        b.placed_at as placedAt, b.locked_at as lockedAt, b.resolved_at as resolvedAt,
        b.status, b.created_at as createdAt, b.updated_at as updatedAt,
        b.deleted_at as deletedAt, b.hlc, b.last_modified_by_device_id as lastModifiedByDeviceId,
        w.question as wagerQuestion, p.name as partyName, wo.label as optionLabel
       from bets b
       join wagers w on w.id = b.wager_id
       join parties p on p.id = w.party_id
       join wager_options wo on wo.id = b.option_id
       where b.user_id = ? and b.deleted_at is null
       order by b.created_at desc`,
      userId,
    );
    return rows;
  } catch (error) {
    throw toBetApiError("Failed to get bets for user.", error);
  }
};

export const lockBetsForWager = async (wagerId: Uuid, deviceId: string): Promise<number> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();

    await database.runAsync(
      "update bets set status = 'locked', locked_at = ?, updated_at = ?, hlc = ? where wager_id = ? and status = 'pending' and deleted_at is null",
      [timestamp, timestamp, hlc, wagerId],
    );

    const row = await database.getFirstAsync<{ count: number }>(
      "select count(*) as count from bets where wager_id = ? and status = 'locked' and deleted_at is null",
      wagerId,
    );

    return row?.count ?? 0;
  } catch (error) {
    throw toBetApiError("Failed to lock bets for wager.", error);
  }
};
