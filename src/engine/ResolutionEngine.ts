import { eq, and } from "drizzle-orm";
import type * as SQLite from "expo-sqlite";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  applyMemberPlateDelta,
  applyPartyPoolDelta,
  postLedgerTransfer,
  postLedgerTransaction,
} from "../api/ledger";
import { enqueueMutation } from "../api/sync";
import { getMembership } from "../api/party";
import { getWager, getWagerOptions, resolveWager as resolveWagerRecord } from "../api/wager";
import {
  bets,
  createDefaultHlc,
  createUuid,
  type Bet,
  type JsonObject,
  type PoolTransaction,
  type Uuid,
  type Wager,
} from "../db/schema";

export type ResolveEngineInput = {
  wagerId: Uuid;
  winningOptionId?: Uuid;
  resolvedByUserId: Uuid;
  deviceId: string;
  resolutionNote?: string | null;
  resolutionKind?: "manual" | "oracle" | "na";
};

export type ResolutionSummary = {
  wager: Wager;
  winningOptionId: Uuid | null;
  winningBets: Bet[];
  losingBets: Bet[];
  platesDistributed: number;
  platesToPool: number;
};

export class ResolutionEngineError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ResolutionEngineError";
    this.cause = cause;
  }
}

const toResolutionEngineError = (
  message: string,
  error: unknown,
): ResolutionEngineError => {
  if (error instanceof ResolutionEngineError) {
    return error;
  }

  return new ResolutionEngineError(message, error);
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

const poolTransactionToPayload = (transaction: PoolTransaction): JsonObject => ({
  id: transaction.id,
  partyId: transaction.partyId,
  wagerId: transaction.wagerId,
  fromUserId: transaction.fromUserId,
  plateAmount: transaction.plateAmount,
  reason: transaction.reason,
  note: transaction.note,
  timestamp: transaction.timestamp,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
  deletedAt: transaction.deletedAt,
  hlc: transaction.hlc,
  lastModifiedByDeviceId: transaction.lastModifiedByDeviceId,
});

const updateMemberStatsAfterResolution = async (
  partyId: Uuid,
  winningUserIds: Set<string>,
  losingUserIds: Set<string>,
  executor: Pick<SQLite.SQLiteDatabase, "runAsync">,
): Promise<void> => {
  const timestamp = now();

  for (const userId of winningUserIds) {
    await executor.runAsync(
      `update party_members
       set total_wins = total_wins + 1,
           current_streak = current_streak + 1,
           longest_streak = max(longest_streak, current_streak + 1),
           updated_at = ?,
           hlc = ?
       where party_id = ? and user_id = ?`,
      [timestamp, createDefaultHlc(), partyId, userId],
    );
  }

  for (const userId of losingUserIds) {
    await executor.runAsync(
      `update party_members
       set total_losses = total_losses + 1,
           current_streak = 0,
           updated_at = ?,
           hlc = ?
       where party_id = ? and user_id = ?`,
      [timestamp, createDefaultHlc(), partyId, userId],
    );
  }
};

export const distributeWinnings = async (
  wagerId: Uuid,
  winningOptionId: Uuid,
  deviceId: string,
): Promise<ResolutionSummary> => {
  try {
    const wager = await getWager(wagerId);

    if (!wager) {
      throw new ResolutionEngineError("Wager not found.");
    }

    if (wager.status !== "resolved") {
      throw new ResolutionEngineError("Wager must be resolved before distributing winnings.");
    }

    const db = await getDb();
    const allBets = await db
      .select()
      .from(bets)
      .where(and(eq(bets.wagerId, wagerId), eq(bets.status, "locked")));

    if (allBets.length === 0) {
      return {
        wager,
        winningOptionId,
        winningBets: [],
        losingBets: [],
        platesDistributed: 0,
        platesToPool: 0,
      };
    }

    const winningBets = allBets.filter((bet) => bet.optionId === winningOptionId);
    const losingBets = allBets.filter((bet) => bet.optionId !== winningOptionId);
    const totalEscrow = allBets.reduce((sum, bet) => sum + bet.platesWagered, 0);
    const losingPlates = losingBets.reduce((sum, bet) => sum + bet.platesWagered, 0);
    const winningPlates = winningBets.reduce((sum, bet) => sum + bet.platesWagered, 0);

    let platesToPool = 0;
    let platesDistributed = 0;
    const timestamp = now();

    const database = await openSQLiteDatabase();

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        if (winningBets.length === 0) {
          platesToPool = totalEscrow;

          await postLedgerTransaction(
            {
              partyId: wager.partyId,
              sourceTable: "bets",
              sourceId: wagerId,
              wagerId,
              deviceId,
              entries: [
                {
                  accountType: "wager_escrow",
                  accountId: wagerId,
                  plateDelta: -totalEscrow,
                  memo: "No winners; escrow moved to charity pool",
                },
                {
                  accountType: "charity_pool",
                  accountId: wager.partyId,
                  plateDelta: totalEscrow,
                  memo: "No winners; escrow moved to charity pool",
                },
              ],
            },
            transaction,
          );

          await applyPartyPoolDelta(wager.partyId, totalEscrow, transaction);

          for (const bet of losingBets) {
            await transaction.runAsync(
              `update bets
               set status = 'lost', resolved_at = ?, updated_at = ?, hlc = ?, last_modified_by_device_id = ?
               where id = ?`,
              [timestamp, timestamp, createDefaultHlc(), deviceId, bet.id],
            );
          }
        } else if (losingBets.length === 0) {
          platesDistributed = totalEscrow;

          for (const bet of winningBets) {
            await postLedgerTransfer(
              {
                partyId: wager.partyId,
                sourceTable: "bets",
                sourceId: bet.id,
                wagerId,
                betId: bet.id,
                deviceId,
                from: {
                  accountType: "wager_escrow",
                  accountId: wagerId,
                  memo: "Wager refunded; no opposing bets",
                },
                to: {
                  accountType: "member_available",
                  accountId: bet.userId,
                  memo: "Wager refunded; no opposing bets",
                },
                plateAmount: bet.platesWagered,
              },
              transaction,
            );

            await applyMemberPlateDelta(wager.partyId, bet.userId, bet.platesWagered, transaction);

            await transaction.runAsync(
              `update bets
               set status = 'won', resolved_at = ?, updated_at = ?, hlc = ?, last_modified_by_device_id = ?
               where id = ?`,
              [timestamp, timestamp, createDefaultHlc(), deviceId, bet.id],
            );
          }
        } else {
          for (const bet of winningBets) {
            const share = Math.floor((bet.platesWagered * losingPlates) / winningPlates);
            const payout = bet.platesWagered + share;
            platesDistributed += payout;

            await postLedgerTransfer(
              {
                partyId: wager.partyId,
                sourceTable: "bets",
                sourceId: bet.id,
                wagerId,
                betId: bet.id,
                deviceId,
                from: {
                  accountType: "wager_escrow",
                  accountId: wagerId,
                  memo: "Wager winnings",
                },
                to: {
                  accountType: "member_available",
                  accountId: bet.userId,
                  memo: "Wager winnings",
                },
                plateAmount: payout,
              },
              transaction,
            );

            await applyMemberPlateDelta(wager.partyId, bet.userId, payout, transaction);

            await transaction.runAsync(
              `update bets
               set status = 'won', resolved_at = ?, updated_at = ?, hlc = ?, last_modified_by_device_id = ?
               where id = ?`,
              [timestamp, timestamp, createDefaultHlc(), deviceId, bet.id],
            );
          }

          for (const bet of losingBets) {
            platesToPool += bet.platesWagered;

            await postLedgerTransfer(
              {
                partyId: wager.partyId,
                sourceTable: "bets",
                sourceId: bet.id,
                wagerId,
                betId: bet.id,
                deviceId,
                from: {
                  accountType: "wager_escrow",
                  accountId: wagerId,
                  memo: "Wager loss to charity pool",
                },
                to: {
                  accountType: "charity_pool",
                  accountId: wager.partyId,
                  memo: "Wager loss to charity pool",
                },
                plateAmount: bet.platesWagered,
              },
              transaction,
            );

            await transaction.runAsync(
              `update bets
               set status = 'lost', resolved_at = ?, updated_at = ?, hlc = ?, last_modified_by_device_id = ?
               where id = ?`,
              [timestamp, timestamp, createDefaultHlc(), deviceId, bet.id],
            );
          }

          await applyPartyPoolDelta(wager.partyId, losingPlates, transaction);
        }

        const updatedBets = await transaction.getAllAsync<Bet>(
          `select
            id,
            wager_id as wagerId,
            user_id as userId,
            option_id as optionId,
            plates_wagered as platesWagered,
            real_money_amount_cents as realMoneyAmountCents,
            placed_at as placedAt,
            locked_at as lockedAt,
            resolved_at as resolvedAt,
            status,
            created_at as createdAt,
            updated_at as updatedAt,
            deleted_at as deletedAt,
            hlc,
            last_modified_by_device_id as lastModifiedByDeviceId
           from bets where wager_id = ? and deleted_at is null`,
          wagerId,
        );

        const winningUserIds = new Set(
          updatedBets.filter((bet) => bet.status === "won").map((bet) => bet.userId),
        );
        const losingUserIds = new Set(
          updatedBets.filter((bet) => bet.status === "lost").map((bet) => bet.userId),
        );

        await updateMemberStatsAfterResolution(
          wager.partyId,
          winningUserIds,
          losingUserIds,
          transaction,
        );

        for (const bet of updatedBets) {
          const fullBet = await transaction.getFirstAsync<Bet>(
            `select
              id,
              wager_id as wagerId,
              user_id as userId,
              option_id as optionId,
              plates_wagered as platesWagered,
              real_money_amount_cents as realMoneyAmountCents,
              placed_at as placedAt,
              locked_at as lockedAt,
              resolved_at as resolvedAt,
              status,
              created_at as createdAt,
              updated_at as updatedAt,
              deleted_at as deletedAt,
              hlc,
              last_modified_by_device_id as lastModifiedByDeviceId
             from bets where id = ?`,
            bet.id,
          );

          if (fullBet) {
            await enqueueMutation(
              {
                tableName: "bets",
                recordId: fullBet.id,
                operation: "update",
                payload: betToPayload(fullBet),
                deviceId,
                hlc: fullBet.hlc,
              },
              transaction,
            );
          }
        }
      } catch (error) {
        throw toResolutionEngineError("Failed during winnings distribution transaction.", error);
      }
    });

    const updatedWager = await getWager(wagerId);

    if (!updatedWager) {
      throw new ResolutionEngineError("Wager disappeared after distribution.");
    }

    return {
      wager: updatedWager,
      winningOptionId,
      winningBets,
      losingBets,
      platesDistributed,
      platesToPool,
    };
  } catch (error) {
    throw toResolutionEngineError("Failed to distribute winnings.", error);
  }
};

export const handleNAPenalty = async (
  wagerId: Uuid,
  deviceId: string,
): Promise<ResolutionSummary> => {
  try {
    const wager = await getWager(wagerId);

    if (!wager) {
      throw new ResolutionEngineError("Wager not found.");
    }

    if (wager.status !== "void") {
      throw new ResolutionEngineError("Wager must be voided before handling N/A penalty.");
    }

    const db = await getDb();
    const allBets = await db
      .select()
      .from(bets)
      .where(and(eq(bets.wagerId, wagerId), eq(bets.status, "locked")));

    if (allBets.length === 0) {
      return {
        wager,
        winningOptionId: null,
        winningBets: [],
        losingBets: [],
        platesDistributed: 0,
        platesToPool: 0,
      };
    }

    const timestamp = now();
    let platesDistributed = 0;
    let platesToPool = 0;

    const database = await openSQLiteDatabase();

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        if (wager.naPolicy === "refund") {
          for (const bet of allBets) {
            platesDistributed += bet.platesWagered;

            await postLedgerTransfer(
              {
                partyId: wager.partyId,
                sourceTable: "bets",
                sourceId: bet.id,
                wagerId,
                betId: bet.id,
                deviceId,
                from: {
                  accountType: "wager_escrow",
                  accountId: wagerId,
                  memo: "N/A refund",
                },
                to: {
                  accountType: "member_available",
                  accountId: bet.userId,
                  memo: "N/A refund",
                },
                plateAmount: bet.platesWagered,
              },
              transaction,
            );

            await applyMemberPlateDelta(wager.partyId, bet.userId, bet.platesWagered, transaction);

            await transaction.runAsync(
              `update bets
               set status = 'void', resolved_at = ?, updated_at = ?, hlc = ?, last_modified_by_device_id = ?
               where id = ?`,
              [timestamp, timestamp, createDefaultHlc(), deviceId, bet.id],
            );
          }
        } else {
          for (const bet of allBets) {
            const penalty = Math.min(bet.platesWagered, wager.naPenaltyPlates);
            const refund = bet.platesWagered - penalty;
            platesToPool += penalty;
            platesDistributed += refund;

            if (penalty > 0) {
              await postLedgerTransfer(
                {
                  partyId: wager.partyId,
                  sourceTable: "bets",
                  sourceId: bet.id,
                  wagerId,
                  betId: bet.id,
                  deviceId,
                  from: {
                    accountType: "wager_escrow",
                    accountId: wagerId,
                    memo: "N/A penalty to charity pool",
                  },
                  to: {
                    accountType: "charity_pool",
                    accountId: wager.partyId,
                    memo: "N/A penalty to charity pool",
                  },
                  plateAmount: penalty,
                },
                transaction,
              );

              const poolId = createUuid();
              await transaction.runAsync(
                `insert into pool_transactions (
                  id,
                  party_id,
                  wager_id,
                  from_user_id,
                  plate_amount,
                  reason,
                  note,
                  timestamp,
                  created_at,
                  updated_at,
                  hlc,
                  last_modified_by_device_id
                ) values (?, ?, ?, ?, ?, 'na_penalty', ?, ?, ?, ?, ?, ?)`,
                [
                  poolId,
                  wager.partyId,
                  wagerId,
                  bet.userId,
                  penalty,
                  `N/A penalty from wager ${wagerId}`,
                  timestamp,
                  timestamp,
                  timestamp,
                  createDefaultHlc(),
                  deviceId,
                ],
              );

              const poolTx = await transaction.getFirstAsync<PoolTransaction>(
                `select
                  id,
                  party_id as partyId,
                  wager_id as wagerId,
                  from_user_id as fromUserId,
                  plate_amount as plateAmount,
                  reason,
                  note,
                  timestamp,
                  created_at as createdAt,
                  updated_at as updatedAt,
                  deleted_at as deletedAt,
                  hlc,
                  last_modified_by_device_id as lastModifiedByDeviceId
                 from pool_transactions where id = ?`,
                poolId,
              );

              if (poolTx) {
                await enqueueMutation(
                  {
                    tableName: "pool_transactions",
                    recordId: poolId,
                    operation: "insert",
                    payload: poolTransactionToPayload(poolTx),
                    deviceId,
                    hlc: poolTx.hlc,
                  },
                  transaction,
                );
              }
            }

            if (refund > 0) {
              await postLedgerTransfer(
                {
                  partyId: wager.partyId,
                  sourceTable: "bets",
                  sourceId: bet.id,
                  wagerId,
                  betId: bet.id,
                  deviceId,
                  from: {
                    accountType: "wager_escrow",
                    accountId: wagerId,
                    memo: "N/A refund after penalty",
                  },
                  to: {
                    accountType: "member_available",
                    accountId: bet.userId,
                    memo: "N/A refund after penalty",
                  },
                  plateAmount: refund,
                },
                transaction,
              );

              await applyMemberPlateDelta(wager.partyId, bet.userId, refund, transaction);
            }

            await transaction.runAsync(
              `update bets
               set status = 'void', resolved_at = ?, updated_at = ?, hlc = ?, last_modified_by_device_id = ?
               where id = ?`,
              [timestamp, timestamp, createDefaultHlc(), deviceId, bet.id],
            );
          }

          await applyPartyPoolDelta(wager.partyId, platesToPool, transaction);
        }

        const updatedBets = await transaction.getAllAsync<Bet>(
          `select
            id,
            wager_id as wagerId,
            user_id as userId,
            option_id as optionId,
            plates_wagered as platesWagered,
            real_money_amount_cents as realMoneyAmountCents,
            placed_at as placedAt,
            locked_at as lockedAt,
            resolved_at as resolvedAt,
            status,
            created_at as createdAt,
            updated_at as updatedAt,
            deleted_at as deletedAt,
            hlc,
            last_modified_by_device_id as lastModifiedByDeviceId
           from bets where wager_id = ? and deleted_at is null`,
          wagerId,
        );

        for (const bet of updatedBets) {
          await enqueueMutation(
            {
              tableName: "bets",
              recordId: bet.id,
              operation: "update",
              payload: betToPayload(bet),
              deviceId,
              hlc: bet.hlc,
            },
            transaction,
          );
        }
      } catch (error) {
        throw toResolutionEngineError("Failed during N/A penalty transaction.", error);
      }
    });

    const updatedWager = await getWager(wagerId);

    if (!updatedWager) {
      throw new ResolutionEngineError("Wager disappeared after N/A handling.");
    }

    return {
      wager: updatedWager,
      winningOptionId: null,
      winningBets: [],
      losingBets: allBets,
      platesDistributed,
      platesToPool,
    };
  } catch (error) {
    throw toResolutionEngineError("Failed to handle N/A penalty.", error);
  }
};

export const resolveWager = async (
  input: ResolveEngineInput,
): Promise<ResolutionSummary> => {
  try {
    const wager = await getWager(input.wagerId);

    if (!wager) {
      throw new ResolutionEngineError("Wager not found.");
    }

    const membership = await getMembership(wager.partyId, input.resolvedByUserId);

    if (!membership || membership.role !== "host") {
      throw new ResolutionEngineError("Only a host can resolve a wager.");
    }

    const resolutionKind = input.resolutionKind ?? (wager.oracleType === "manual" ? "manual" : "oracle");

    if (resolutionKind === "na") {
      const { voidWager } = await import("../api/wager");
      await voidWager({
        wagerId: input.wagerId,
        deviceId: input.deviceId,
        reason: input.resolutionNote ?? "N/A resolution",
      });

      return await handleNAPenalty(input.wagerId, input.deviceId);
    }

    if (!input.winningOptionId) {
      throw new ResolutionEngineError("winningOptionId is required for non-N/A resolutions.");
    }

    const options = await getWagerOptions(wager.id);
    const isValidOption = options.some((option) => option.id === input.winningOptionId);

    if (!isValidOption) {
      throw new ResolutionEngineError("Winning option does not belong to this wager.");
    }

    await resolveWagerRecord({
      wagerId: input.wagerId,
      winningOptionId: input.winningOptionId,
      resolvedByUserId: input.resolvedByUserId,
      deviceId: input.deviceId,
      resolutionNote: input.resolutionNote,
    });

    return await distributeWinnings(input.wagerId, input.winningOptionId, input.deviceId);
  } catch (error) {
    throw toResolutionEngineError("Failed to resolve wager.", error);
  }
};
