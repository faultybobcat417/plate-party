import { and, sql } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  bets,
  createDefaultHlc,
  createUuid,
  partyMembers,
  poolTransactions,
  type Uuid,
  wagers,
} from "../db/schema";
import { postLedgerTransaction } from "../api/ledger";
import { enqueueMutation } from "../api/sync";
import { lockBetsForWager } from "../api/bet";

export type ResolveWagerInput = {
  wagerId: Uuid;
  partyId: Uuid;
  winningOptionId?: Uuid;
  resolutionKind: "manual" | "oracle" | "na";
  resolutionNote?: string | null;
  resolvedByUserId: Uuid;
  deviceId: string;
};

export type ResolveWagerResult = {
  wagerId: Uuid;
  status: "resolved" | "void";
  winningOptionId?: Uuid;
  totalEscrow: number;
  totalWinners: number;
  platesToPool: number;
  platesToWinners: number;
};

export class ResolutionEngineError extends Error {
  public readonly cause: unknown;
  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ResolutionEngineError";
    this.cause = cause;
  }
}

const toResolutionEngineError = (message: string, error: unknown): ResolutionEngineError => {
  if (error instanceof ResolutionEngineError) return error;
  return new ResolutionEngineError(message, error);
};

const now = (): string => new Date().toISOString();

export const resolveWager = async (input: ResolveWagerInput): Promise<ResolveWagerResult> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();
    let result: ResolveWagerResult = {
      wagerId: input.wagerId,
      status: "void",
      totalEscrow: 0,
      totalWinners: 0,
      platesToPool: 0,
      platesToWinners: 0,
    };

    await database.withExclusiveTransactionAsync(async (transaction) => {
      // 1. Validate wager
      const wager = await transaction.getFirstAsync<{
        id: string; party_id: string; status: string; deadline: string;
        oracle_status: string; na_policy: string; na_penalty_plates: number;
        created_by_user_id: string;
      }>(
        "select id, party_id, status, deadline, oracle_status, na_policy, na_penalty_plates, created_by_user_id from wagers where id = ? and deleted_at is null",
        input.wagerId,
      );
      if (!wager) throw new ResolutionEngineError("Wager not found.");
      if (wager.status !== "open" && wager.status !== "locked") throw new ResolutionEngineError(`Wager already ${wager.status}.`);
      if (wager.party_id !== input.partyId) throw new ResolutionEngineError("Wager does not belong to party.");

      // 2. Validate permissions
      if (input.resolutionKind === "manual") {
        const member = await transaction.getFirstAsync<{ role: string }>(
          "select role from party_members where party_id = ? and user_id = ? and deleted_at is null and left_at is null",
          [input.partyId, input.resolvedByUserId],
        );
        if (!member || member.role !== "host") throw new ResolutionEngineError("Only host can manually resolve.");
      }
      if (input.resolutionKind === "oracle" && wager.oracle_status !== "validated") {
        throw new ResolutionEngineError("Oracle has not been validated.");
      }
      if (new Date(wager.deadline) > new Date() && input.resolutionKind !== "manual") {
        throw new ResolutionEngineError("Deadline has not passed.");
      }

      // 3. Lock bets if not already locked
      if (wager.status === "open") {
        await lockBetsForWager(input.wagerId, input.deviceId);
      }

      // 4. Calculate total escrow
      const escrowRow = await transaction.getFirstAsync<{ total: number | null }>(
        "select coalesce(sum(plate_delta), 0) as total from ledger_entries where wager_id = ? and account_type = 'wager_escrow' and plate_delta > 0 and deleted_at is null",
        input.wagerId,
      );
      const totalEscrow = Number(escrowRow?.total ?? 0);

      let platesToPool = 0;
      let platesToWinners = 0;
      let totalWinners = 0;

      // 5. Resolve with winning option
      if (input.winningOptionId) {
        const winningBets = await transaction.getAllAsync<{
          id: string; user_id: string; plates_wagered: number;
        }>(
          "select id, user_id, plates_wagered from bets where wager_id = ? and option_id = ? and status = 'locked' and deleted_at is null",
          [input.wagerId, input.winningOptionId],
        );

        totalWinners = winningBets.length;

        if (totalWinners === 0) {
          platesToPool = totalEscrow;
          const txId = createUuid();
          await postLedgerTransaction({
            partyId: input.partyId,
            sourceTable: "pool_transactions",
            sourceId: txId,
            transactionId: txId,
            deviceId: input.deviceId,
            wagerId: input.wagerId,
            entries: [
              { accountType: "wager_escrow", accountId: input.wagerId, plateDelta: -totalEscrow, memo: "No winners - escrow to pool" },
              { accountType: "charity_pool", accountId: input.partyId, plateDelta: totalEscrow, memo: "No winners - charity pool" },
            ],
          });

          await transaction.runAsync(
            `insert into pool_transactions (id, party_id, wager_id, plate_amount, reason, note, timestamp, created_at, updated_at, hlc, last_modified_by_device_id)
             values (?, ?, ?, ?, 'wager_loss', 'No winning bets - all to charity pool', ?, ?, ?, ?, ?)`,
            [createUuid(), input.partyId, input.wagerId, totalEscrow, timestamp, timestamp, timestamp, hlc, input.deviceId],
          );
        } else {
          const totalWinningPlates = winningBets.reduce((sum, b) => sum + b.plates_wagered, 0);
          let distributed = 0;

          for (const bet of winningBets) {
            const share = Math.floor((bet.plates_wagered * totalEscrow) / totalWinningPlates);
            distributed += share;
            platesToWinners += share;

            const txId = createUuid();
            await postLedgerTransaction({
              partyId: input.partyId,
              sourceTable: "bets",
              sourceId: bet.id,
              transactionId: txId,
              deviceId: input.deviceId,
              wagerId: input.wagerId,
              betId: bet.id,
              entries: [
                { accountType: "wager_escrow", accountId: input.wagerId, plateDelta: -share, memo: "Winner share" },
                { accountType: "member_available", accountId: bet.user_id, plateDelta: share, memo: "Winnings credited" },
              ],
            });

            await transaction.runAsync(
              `update party_members set total_wins = total_wins + 1, current_streak = current_streak + 1,
               longest_streak = max(longest_streak, current_streak + 1), plate_balance = plate_balance + ?,
               reserved_plate_balance = max(0, reserved_plate_balance - ?), updated_at = ?, hlc = ?
               where party_id = ? and user_id = ?`,
              [share, bet.plates_wagered, timestamp, hlc, input.partyId, bet.user_id],
            );

            await transaction.runAsync(
              "update bets set status = 'won', resolved_at = ?, updated_at = ?, hlc = ? where id = ?",
              [timestamp, timestamp, hlc, bet.id],
            );
          }

          const remainder = totalEscrow - distributed;
          platesToPool = remainder;
          if (remainder > 0) {
            const txId = createUuid();
            await postLedgerTransaction({
              partyId: input.partyId,
              sourceTable: "pool_transactions",
              sourceId: txId,
              transactionId: txId,
              deviceId: input.deviceId,
              wagerId: input.wagerId,
              entries: [
                { accountType: "wager_escrow", accountId: input.wagerId, plateDelta: -remainder, memo: "Remainder to pool" },
                { accountType: "charity_pool", accountId: input.partyId, plateDelta: remainder, memo: "Remainder to pool" },
              ],
            });

            await transaction.runAsync(
              `insert into pool_transactions (id, party_id, wager_id, plate_amount, reason, note, timestamp, created_at, updated_at, hlc, last_modified_by_device_id)
               values (?, ?, ?, ?, 'wager_loss', 'Remainder from proportional distribution', ?, ?, ?, ?, ?)`,
              [createUuid(), input.partyId, input.wagerId, remainder, timestamp, timestamp, timestamp, hlc, input.deviceId],
            );
          }
        }

        await transaction.runAsync(
          "update bets set status = 'lost', resolved_at = ?, updated_at = ?, hlc = ? where wager_id = ? and status = 'locked' and option_id != ?",
          [timestamp, timestamp, hlc, input.wagerId, input.winningOptionId],
        );

        const losingBets = await transaction.getAllAsync<{ user_id: string; plates_wagered: number }>(
          "select user_id, plates_wagered from bets where wager_id = ? and status = 'lost' and deleted_at is null",
          input.wagerId,
        );
        for (const bet of losingBets) {
          await transaction.runAsync(
            "update party_members set total_losses = total_losses + 1, current_streak = 0, reserved_plate_balance = max(0, reserved_plate_balance - ?), updated_at = ?, hlc = ? where party_id = ? and user_id = ?",
            [bet.plates_wagered, timestamp, hlc, input.partyId, bet.user_id],
          );
        }

        await transaction.runAsync(
          "update wagers set status = 'resolved', winning_option_id = ?, resolution_kind = ?, resolution_note = ?, resolved_at = ?, updated_at = ?, hlc = ? where id = ?",
          [input.winningOptionId, input.resolutionKind, input.resolutionNote ?? null, timestamp, timestamp, hlc, input.wagerId],
        );

        await enqueueMutation({
          tableName: "wagers",
          recordId: input.wagerId,
          operation: "update",
          payload: { status: "resolved", winningOptionId: input.winningOptionId, resolutionKind: input.resolutionKind },
          deviceId: input.deviceId,
          hlc,
        });

        result = { wagerId: input.wagerId, status: "resolved", winningOptionId: input.winningOptionId, totalEscrow, totalWinners, platesToPool, platesToWinners };
      } else {
        const allBets = await transaction.getAllAsync<{ id: string; user_id: string; plates_wagered: number }>(
          "select id, user_id, plates_wagered from bets where wager_id = ? and status = 'locked' and deleted_at is null",
          input.wagerId,
        );

        if (wager.na_policy === "refund") {
          for (const bet of allBets) {
            const txId = createUuid();
            await postLedgerTransaction({
              partyId: input.partyId,
              sourceTable: "bets",
              sourceId: bet.id,
              transactionId: txId,
              deviceId: input.deviceId,
              wagerId: input.wagerId,
              betId: bet.id,
              entries: [
                { accountType: "wager_escrow", accountId: input.wagerId, plateDelta: -bet.plates_wagered, memo: "N/A refund" },
                { accountType: "member_available", accountId: bet.user_id, plateDelta: bet.plates_wagered, memo: "N/A refund" },
              ],
            });

            await transaction.runAsync(
              "update party_members set plate_balance = plate_balance + ?, reserved_plate_balance = max(0, reserved_plate_balance - ?), updated_at = ?, hlc = ? where party_id = ? and user_id = ?",
              [bet.plates_wagered, bet.plates_wagered, timestamp, hlc, input.partyId, bet.user_id],
            );

            await transaction.runAsync(
              "update bets set status = 'void', resolved_at = ?, updated_at = ?, hlc = ? where id = ?",
              [timestamp, timestamp, hlc, bet.id],
            );
          }
          platesToWinners = totalEscrow;
        } else {
          for (const bet of allBets) {
            const txId = createUuid();
            await postLedgerTransaction({
              partyId: input.partyId,
              sourceTable: "pool_transactions",
              sourceId: txId,
              transactionId: txId,
              deviceId: input.deviceId,
              wagerId: input.wagerId,
              betId: bet.id,
              entries: [
                { accountType: "wager_escrow", accountId: input.wagerId, plateDelta: -bet.plates_wagered, memo: "N/A send to pool" },
                { accountType: "charity_pool", accountId: input.partyId, plateDelta: bet.plates_wagered, memo: "N/A send to pool" },
              ],
            });

            await transaction.runAsync(
              "update party_members set reserved_plate_balance = max(0, reserved_plate_balance - ?), updated_at = ?, hlc = ? where party_id = ? and user_id = ?",
              [bet.plates_wagered, timestamp, hlc, input.partyId, bet.user_id],
            );

            await transaction.runAsync(
              "update bets set status = 'lost', resolved_at = ?, updated_at = ?, hlc = ? where id = ?",
              [timestamp, timestamp, hlc, bet.id],
            );
          }

          await transaction.runAsync(
            `insert into pool_transactions (id, party_id, wager_id, plate_amount, reason, note, timestamp, created_at, updated_at, hlc, last_modified_by_device_id)
             values (?, ?, ?, ?, 'na_penalty', 'N/A resolution - all plates to charity pool', ?, ?, ?, ?, ?)`,
            [createUuid(), input.partyId, input.wagerId, totalEscrow, timestamp, timestamp, timestamp, hlc, input.deviceId],
          );
          platesToPool = totalEscrow;
        }

        await transaction.runAsync(
          "update wagers set status = 'void', resolution_kind = ?, resolution_note = ?, resolved_at = ?, updated_at = ?, hlc = ? where id = ?",
          [input.resolutionKind, input.resolutionNote ?? null, timestamp, timestamp, hlc, input.wagerId],
        );

        await enqueueMutation({
          tableName: "wagers",
          recordId: input.wagerId,
          operation: "update",
          payload: { status: "void", resolutionKind: input.resolutionKind },
          deviceId: input.deviceId,
          hlc,
        });

        result = { wagerId: input.wagerId, status: "void", totalEscrow, totalWinners: 0, platesToPool, platesToWinners: 0 };
      }
    });

    return result;
  } catch (error) {
    throw toResolutionEngineError("Failed to resolve wager.", error);
  }
};

export const autoExpireWagers = async (partyId?: Uuid, deviceId?: string): Promise<number> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();

    let sql = "select id, party_id, created_by_user_id from wagers where status = 'open' and deadline < ? and deleted_at is null";
    const params: string[] = [timestamp];

    if (partyId) {
      sql += " and party_id = ?";
      params.push(partyId);
    }

    const expired = await database.getAllAsync<{ id: string; party_id: string; created_by_user_id: string }>(sql, params);
    let count = 0;

    for (const wager of expired) {
      try {
        await resolveWager({
          wagerId: wager.id,
          partyId: wager.party_id,
          resolutionKind: "na",
          resolutionNote: "Auto-expired: deadline passed",
          resolvedByUserId: wager.created_by_user_id,
          deviceId: deviceId ?? "system",
        });
        count++;
      } catch (error) {
        console.error(`Failed to auto-expire wager ${wager.id}:`, error);
      }
    }

    return count;
  } catch (error) {
    throw toResolutionEngineError("Failed to auto-expire wagers.", error);
  }
};

export const resolveNA = async (
  wagerId: Uuid,
  partyId: Uuid,
  resolvedByUserId: Uuid,
  deviceId: string,
  note?: string | null,
): Promise<ResolveWagerResult> => {
  return resolveWager({
    wagerId,
    partyId,
    resolutionKind: "na",
    resolutionNote: note,
    resolvedByUserId,
    deviceId,
  });
};
