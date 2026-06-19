import { and, eq, isNull } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  applyMemberPlateDelta,
  assertMemberCanSpend,
  postLedgerTransfer,
} from "./ledger";
import { enqueueMutation } from "./sync";
import {
  bets,
  createDefaultHlc,
  createUuid,
  type Bet,
  type JsonObject,
  type Uuid,
} from "../db/schema";

export type PlaceBetInput = {
  wagerId: Uuid;
  userId: Uuid;
  optionId: Uuid;
  deviceId: string;
};

export type BetWithUser = Bet & {
  displayName: string;
  avatarColor: string;
};

export type BetWithWager = Bet & {
  question: string;
  partyId: Uuid;
};

type BetRow = {
  id: string;
  wager_id: string;
  user_id: string;
  option_id: string;
  plates_wagered: number;
  real_money_amount_cents: number | null;
  placed_at: string;
  locked_at: string | null;
  resolved_at: string | null;
  status: Bet["status"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  hlc: string;
  last_modified_by_device_id: string | null;
  display_name: string;
  avatar_color: string;
};

type BetWithWagerRow = {
  id: string;
  wager_id: string;
  user_id: string;
  option_id: string;
  plates_wagered: number;
  real_money_amount_cents: number | null;
  placed_at: string;
  locked_at: string | null;
  resolved_at: string | null;
  status: Bet["status"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  hlc: string;
  last_modified_by_device_id: string | null;
  question: string;
  party_id: string;
};

const betSelectColumns = `
  b.id,
  b.wager_id as wagerId,
  b.user_id as userId,
  b.option_id as optionId,
  b.plates_wagered as platesWagered,
  b.real_money_amount_cents as realMoneyAmountCents,
  b.placed_at as placedAt,
  b.locked_at as lockedAt,
  b.resolved_at as resolvedAt,
  b.status,
  b.created_at as createdAt,
  b.updated_at as updatedAt,
  b.deleted_at as deletedAt,
  b.hlc,
  b.last_modified_by_device_id as lastModifiedByDeviceId
`;

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

const betToPayload = (bet: Bet): JsonObject => ({
  id: bet.id,
  wagerId: bet.wagerId,
  userId: bet.userId,
  optionId: bet.optionId,
  platesWagered: bet.platesWagered,
  realMoneyAmountCents: bet.realMoneyAmountCents,
  placedAt: bet.placedAt,
  lockedAt: bet.lockedAt,
  resolvedAt: bet.resolvedAt,
  status: bet.status,
  createdAt: bet.createdAt,
  updatedAt: bet.updatedAt,
  deletedAt: bet.deletedAt,
  hlc: bet.hlc,
  lastModifiedByDeviceId: bet.lastModifiedByDeviceId,
});

const rowToBetWithUser = (row: BetRow): BetWithUser => ({
  id: row.id,
  wagerId: row.wager_id,
  userId: row.user_id,
  optionId: row.option_id,
  platesWagered: row.plates_wagered,
  realMoneyAmountCents: row.real_money_amount_cents,
  placedAt: row.placed_at,
  lockedAt: row.locked_at,
  resolvedAt: row.resolved_at,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
  hlc: row.hlc,
  lastModifiedByDeviceId: row.last_modified_by_device_id,
  displayName: row.display_name,
  avatarColor: row.avatar_color,
});

const rowToBetWithWager = (row: BetWithWagerRow): BetWithWager => ({
  id: row.id,
  wagerId: row.wager_id,
  userId: row.user_id,
  optionId: row.option_id,
  platesWagered: row.plates_wagered,
  realMoneyAmountCents: row.real_money_amount_cents,
  placedAt: row.placed_at,
  lockedAt: row.locked_at,
  resolvedAt: row.resolved_at,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
  hlc: row.hlc,
  lastModifiedByDeviceId: row.last_modified_by_device_id,
  question: row.question,
  partyId: row.party_id,
});

export const validateBalance = async (
  partyId: Uuid,
  userId: Uuid,
  plateAmount: number,
): Promise<void> => {
  try {
    await assertMemberCanSpend(partyId, userId, plateAmount);
  } catch (error) {
    throw toBetApiError("Failed to validate plate balance.", error);
  }
};

export const placeBet = async (input: PlaceBetInput): Promise<Bet> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const betId = createUuid();
    const betHlc = createDefaultHlc();
    let bet: Bet | null = null;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        const wager = await transaction.getFirstAsync<{
          id: string;
          party_id: string;
          stake_plates: number;
          status: "open" | "locked" | "resolved" | "void";
        }>(
          `select id, party_id, stake_plates, status
           from wagers
           where id = ? and deleted_at is null
           limit 1`,
          input.wagerId,
        );

        if (!wager) {
          throw new BetApiError("Wager not found.");
        }

        if (wager.status !== "open") {
          throw new BetApiError("Wager is not open for betting.");
        }

        const option = await transaction.getFirstAsync<{ id: string }>(
          `select id from wager_options
           where id = ? and wager_id = ? and deleted_at is null
           limit 1`,
          [input.optionId, input.wagerId],
        );

        if (!option) {
          throw new BetApiError("Wager option does not belong to this wager.");
        }

        const existingBet = await transaction.getFirstAsync<{ id: string }>(
          `select id from bets
           where wager_id = ? and user_id = ? and deleted_at is null
           limit 1`,
          [input.wagerId, input.userId],
        );

        if (existingBet) {
          throw new BetApiError("User has already placed a bet on this wager.");
        }

        await assertMemberCanSpend(wager.party_id, input.userId, wager.stake_plates, transaction);

        await transaction.runAsync(
          `insert into bets (
            id,
            wager_id,
            user_id,
            option_id,
            plates_wagered,
            real_money_amount_cents,
            placed_at,
            status,
            created_at,
            updated_at,
            hlc,
            last_modified_by_device_id
          ) values (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
          [
            betId,
            input.wagerId,
            input.userId,
            input.optionId,
            wager.stake_plates,
            null,
            timestamp,
            timestamp,
            timestamp,
            betHlc,
            input.deviceId,
          ],
        );

        await postLedgerTransfer(
          {
            partyId: wager.party_id,
            sourceTable: "bets",
            sourceId: betId,
            wagerId: input.wagerId,
            betId,
            deviceId: input.deviceId,
            from: {
              accountType: "member_available",
              accountId: input.userId,
              memo: `Bet placed on wager ${input.wagerId}`,
            },
            to: {
              accountType: "wager_escrow",
              accountId: input.wagerId,
              memo: `Bet placed on wager ${input.wagerId}`,
            },
            plateAmount: wager.stake_plates,
          },
          transaction,
        );

        await applyMemberPlateDelta(
          wager.party_id,
          input.userId,
          -wager.stake_plates,
          transaction,
        );

        await transaction.runAsync(
          `update party_members
           set total_plates_wagered = total_plates_wagered + ?,
               updated_at = ?,
               hlc = ?
           where party_id = ? and user_id = ?`,
          [wager.stake_plates, timestamp, createDefaultHlc(), wager.party_id, input.userId],
        );

        bet = await transaction.getFirstAsync<Bet>(
          `select ${betSelectColumns} from bets b where b.id = ?`,
          betId,
        );

        if (!bet) {
          throw new BetApiError("Bet insert succeeded but could not be read.");
        }

        await enqueueMutation(
          {
            tableName: "bets",
            recordId: betId,
            operation: "insert",
            payload: betToPayload(bet),
            deviceId: input.deviceId,
            hlc: betHlc,
          },
          transaction,
        );
      } catch (error) {
        throw toBetApiError("Failed during bet placement transaction.", error);
      }
    });

    if (!bet) {
      throw new BetApiError("Bet placement did not produce a bet.");
    }

    return bet;
  } catch (error) {
    throw toBetApiError("Failed to place bet.", error);
  }
};

export const getBet = async (betId: Uuid): Promise<Bet | null> => {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(bets)
      .where(and(eq(bets.id, betId), isNull(bets.deletedAt)))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    throw toBetApiError("Failed to read bet.", error);
  }
};

export const getBetsForWager = async (wagerId: Uuid): Promise<BetWithUser[]> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<BetRow>(
      `select
        b.id,
        b.wager_id,
        b.user_id,
        b.option_id,
        b.plates_wagered,
        b.real_money_amount_cents,
        b.placed_at,
        b.locked_at,
        b.resolved_at,
        b.status,
        b.created_at,
        b.updated_at,
        b.deleted_at,
        b.hlc,
        b.last_modified_by_device_id,
        u.display_name,
        u.avatar_color
       from bets b
       join users u on u.id = b.user_id
       where b.wager_id = ? and b.deleted_at is null
       order by b.placed_at asc`,
      wagerId,
    );

    return rows.map(rowToBetWithUser);
  } catch (error) {
    throw toBetApiError("Failed to list bets for wager.", error);
  }
};

export const getUserBets = async (
  userId: Uuid,
  limit = 50,
): Promise<BetWithWager[]> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<BetWithWagerRow>(
      `select
        b.id,
        b.wager_id,
        b.user_id,
        b.option_id,
        b.plates_wagered,
        b.real_money_amount_cents,
        b.placed_at,
        b.locked_at,
        b.resolved_at,
        b.status,
        b.created_at,
        b.updated_at,
        b.deleted_at,
        b.hlc,
        b.last_modified_by_device_id,
        w.question,
        w.party_id
       from bets b
       join wagers w on w.id = b.wager_id
       where b.user_id = ? and b.deleted_at is null
       order by b.placed_at desc
       limit ?`,
      [userId, limit],
    );

    return rows.map(rowToBetWithWager);
  } catch (error) {
    throw toBetApiError("Failed to list user bets.", error);
  }
};

export const lockBetsForWager = async (
  wagerId: Uuid,
  deviceId: string,
): Promise<Bet[]> => {
  try {
    const db = await getDb();
    const timestamp = now();
    const hlc = createDefaultHlc();

    const updated = await db
      .update(bets)
      .set({
        status: "locked",
        lockedAt: timestamp,
        updatedAt: timestamp,
        hlc,
        lastModifiedByDeviceId: deviceId,
      })
      .where(and(eq(bets.wagerId, wagerId), eq(bets.status, "pending")))
      .returning();

    for (const bet of updated) {
      await enqueueMutation({
        tableName: "bets",
        recordId: bet.id,
        operation: "update",
        payload: betToPayload(bet),
        deviceId,
        baseHlc: bet.hlc,
        hlc,
      });
    }

    return updated;
  } catch (error) {
    throw toBetApiError("Failed to lock bets for wager.", error);
  }
};
