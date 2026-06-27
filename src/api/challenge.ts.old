import { and, sql } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  challenges,
  createDefaultHlc,
  createUuid,
  type Uuid,
} from "../db/schema";
import { enqueueMutation } from "./sync";

export type ChallengeType = "self" | "bounty" | "group";
export type ChallengeStatus = "open" | "claimed" | "completed" | "expired";

export type Challenge = {
  id: Uuid;
  title: string;
  description: string | null;
  type: ChallengeType;
  rewardPlates: number;
  deadline: string;
  status: ChallengeStatus;
  creatorId: Uuid;
  completerId: Uuid | null;
  proofImageUrl: string | null;
  proofNote: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hlc: string;
  lastModifiedByDeviceId: string | null;
};

export type CreateChallengeInput = {
  creatorId: Uuid;
  title: string;
  description?: string | null;
  type: ChallengeType;
  rewardPlates: number;
  deadline: string;
  deviceId?: string;
};

export type SubmitProofInput = {
  challengeId: Uuid;
  completerId?: Uuid;
  evidenceUrl?: string | null;
  proofNote?: string | null;
  deviceId?: string;
  submitterId?: Uuid;
  proofType?: string;
};

export type ProofSubmission = {
  id: string;
  challengeId: Uuid;
  verifierId: Uuid;
  proofImageUrl?: string | null;
  proofNote?: string | null;
  proofType?: string;
  submittedAt?: string;
  deviceId?: string;
  approved?: boolean;
  title?: string;
  description?: string | null;
  type?: ChallengeType;
  rewardPlates?: number;
  deadline?: string;
  status?: ChallengeStatus;
  creatorId?: Uuid;
  completerId?: Uuid | null;
  claimedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  hlc?: string;
  lastModifiedByDeviceId?: string | null;
};

export class ChallengeApiError extends Error {
  public readonly cause: unknown;
  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ChallengeApiError";
    this.cause = cause;
  }
}

const toChallengeApiError = (message: string, error: unknown): ChallengeApiError => {
  if (error instanceof ChallengeApiError) return error;
  return new ChallengeApiError(message, error);
};

const now = (): string => new Date().toISOString();

export const createChallenge = async (input: CreateChallengeInput): Promise<Challenge> => {
  try {
    if (input.rewardPlates <= 0) throw new ChallengeApiError("rewardPlates must be > 0.");
    if (new Date(input.deadline) <= new Date()) throw new ChallengeApiError("Deadline must be in the future.");

    const database = await openSQLiteDatabase();
    const challengeId = createUuid();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const deviceId = input.deviceId ?? "unknown";

    await database.runAsync(
      `insert into challenges (id, title, description, type, reward_plates, deadline, status, creator_id, created_at, updated_at, hlc, last_modified_by_device_id)
       values (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)`,
      [challengeId, input.title, input.description ?? null, input.type, input.rewardPlates, input.deadline,
       input.creatorId, timestamp, timestamp, hlc, deviceId],
    );

    const row = await database.getFirstAsync<Challenge>(
      `select id, title, description, type, reward_plates as rewardPlates, deadline, status, creator_id as creatorId,
       completer_id as completerId, proof_image_url as proofImageUrl, proof_note as proofNote, claimed_at as claimedAt,
       completed_at as completedAt, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt, hlc,
       last_modified_by_device_id as lastModifiedByDeviceId
       from challenges where id = ?`,
      challengeId,
    );

    if (!row) throw new ChallengeApiError("Challenge insert failed.");

    await enqueueMutation({
      tableName: "challenges",
      recordId: challengeId,
      operation: "insert",
      payload: { id: challengeId, title: input.title, type: input.type, rewardPlates: input.rewardPlates, status: "open", creatorId: input.creatorId },
      deviceId,
      hlc,
    });

    return row;
  } catch (error) {
    throw toChallengeApiError("Failed to create challenge.", error);
  }
};

export const claimChallenge = async (challengeId: Uuid, completerId: Uuid, deviceId?: string): Promise<void> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const devId = deviceId ?? "unknown";

    const challenge = await database.getFirstAsync<{
      id: string; status: string; creator_id: string; type: string;
    }>(
      "select id, status, creator_id, type from challenges where id = ? and deleted_at is null",
      challengeId,
    );
    if (!challenge) throw new ChallengeApiError("Challenge not found.");
    if (challenge.status !== "open") throw new ChallengeApiError(`Challenge status is ${challenge.status}.`);
    if (challenge.type !== "self" && challenge.creator_id === completerId) {
      throw new ChallengeApiError("Creator cannot claim their own bounty/group challenge.");
    }

    await database.runAsync(
      "update challenges set status = 'claimed', completer_id = ?, claimed_at = ?, updated_at = ?, hlc = ? where id = ?",
      [completerId, timestamp, timestamp, hlc, challengeId],
    );

    await enqueueMutation({
      tableName: "challenges",
      recordId: challengeId,
      operation: "update",
      payload: { status: "claimed", completerId, claimedAt: timestamp },
      deviceId: devId,
      hlc,
    });
  } catch (error) {
    throw toChallengeApiError("Failed to claim challenge.", error);
  }
};

export const submitProof = async (input: SubmitProofInput): Promise<ProofSubmission> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const deviceId = input.deviceId ?? "unknown";

    await database.withExclusiveTransactionAsync(async (transaction) => {
      const challenge = await transaction.getFirstAsync<{
        id: string; status: string; creator_id: string; type: string; completer_id: string | null;
      }>(
        "select id, status, creator_id, type, completer_id from challenges where id = ? and deleted_at is null",
        input.challengeId,
      );
      if (!challenge) throw new ChallengeApiError("Challenge not found.");
      if (challenge.status !== "claimed") throw new ChallengeApiError(`Challenge status is ${challenge.status}.`);
      if (challenge.creator_id !== input.completerId) throw new ChallengeApiError("Only creator can verify.");
      if (!challenge.completer_id) throw new ChallengeApiError("Challenge has no completer.");

      await transaction.runAsync(
        "update challenges set status = 'completed', completed_at = ?, proof_image_url = ?, proof_note = ?, updated_at = ?, hlc = ? where id = ?",
        [timestamp, input.evidenceUrl ?? null, input.proofNote ?? null, timestamp, hlc, input.challengeId],
      );

      await enqueueMutation({
        tableName: "challenges",
        recordId: input.challengeId,
        operation: "update",
        payload: {
          status: "completed",
          completedAt: timestamp,
          proofImageUrl: input.evidenceUrl ?? null,
          proofNote: input.proofNote ?? null,
        },
        deviceId,
        hlc,
      }, transaction);
    });

    return {
      id: createUuid(),
      challengeId: input.challengeId,
      verifierId: input.completerId!,
      proofImageUrl: input.evidenceUrl ?? null,
      proofNote: input.proofNote ?? null,
      submittedAt: timestamp,
      deviceId,
      proofType: input.proofType ?? "photo",
    };
  } catch (error) {
    throw toChallengeApiError("Failed to submit proof.", error);
  }
};

export const reviewProof = async (
  proofIdOrInput: string | ProofSubmission,
  challengeId?: Uuid,
  approved?: boolean,
): Promise<ProofSubmission> => {
  try {
    if (typeof proofIdOrInput === "object") {
      // Object form
      return await submitProof({
        challengeId: proofIdOrInput.challengeId,
        completerId: proofIdOrInput.verifierId,
        evidenceUrl: proofIdOrInput.proofImageUrl,
        proofNote: proofIdOrInput.proofNote,
        deviceId: proofIdOrInput.deviceId,
      });
    } else {
      // 3-arg form: reviewProof(proofId, challengeId, approved)
      // For now, just approve by completing the challenge
      const database = await openSQLiteDatabase();
      const timestamp = now();
      const hlc = createDefaultHlc();

      if (!challengeId) throw new ChallengeApiError("challengeId is required.");
      const challenge = await database.getFirstAsync<{
        id: string; creator_id: string; completer_id: string | null;
        proof_image_url: string | null; proof_note: string | null;
      }>(
        "select id, creator_id, completer_id, proof_image_url, proof_note from challenges where id = ? and deleted_at is null",
        challengeId,
      );
      if (!challenge) throw new ChallengeApiError("Challenge not found.");

      if (approved) {
        await database.runAsync(
          "update challenges set status = 'completed', completed_at = ?, updated_at = ?, hlc = ? where id = ?",
          [timestamp, timestamp, hlc, challengeId],
        );
      }

      return {
        id: proofIdOrInput,
        challengeId: challengeId!,
        verifierId: challenge.creator_id,
        proofImageUrl: challenge.proof_image_url,
        proofNote: challenge.proof_note,
        submittedAt: timestamp,
        approved,
      };
    }
  } catch (error) {
    throw toChallengeApiError("Failed to review proof.", error);
  }
};

export const listChallenges = async (status?: ChallengeStatus): Promise<Array<Challenge & { creatorDisplayName: string }>> => {
  try {
    const database = await openSQLiteDatabase();
    let sql = `select c.id, c.title, c.description, c.type, c.reward_plates as rewardPlates, c.deadline, c.status, c.creator_id as creatorId,
       c.completer_id as completerId, c.proof_image_url as proofImageUrl, c.proof_note as proofNote, c.claimed_at as claimedAt,
       c.completed_at as completedAt, c.created_at as createdAt, c.updated_at as updatedAt, c.deleted_at as deletedAt, c.hlc,
       c.last_modified_by_device_id as lastModifiedByDeviceId, u.display_name as creatorDisplayName
       from challenges c join users u on u.id = c.creator_id
       where c.deleted_at is null`;
    const params: string[] = [];

    if (status) {
      sql += " and c.status = ?";
      params.push(status);
    } else {
      sql += " and c.status = 'open'";
    }

    sql += " order by c.created_at desc";

    const rows = await database.getAllAsync<Challenge & { creatorDisplayName: string }>(sql, params);
    return rows;
  } catch (error) {
    throw toChallengeApiError("Failed to list challenges.", error);
  }
};

export const getPendingProofs = async (creatorId: Uuid): Promise<ProofSubmission[]> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<ProofSubmission>(
      `select id, title, description, type, reward_plates as rewardPlates, deadline, status, creator_id as creatorId,
       completer_id as completerId, proof_image_url as proofImageUrl, proof_note as proofNote, claimed_at as claimedAt,
       completed_at as completedAt, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt, hlc,
       last_modified_by_device_id as lastModifiedByDeviceId
       from challenges where creator_id = ? and status = 'claimed' and deleted_at is null
       order by claimed_at desc`,
      creatorId,
    );
    return rows;
  } catch (error) {
    throw toChallengeApiError("Failed to get pending proofs.", error);
  }
};

export const expireChallenges = async (): Promise<number> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();

    const expired = await database.getAllAsync<{ id: string }>(
      "select id from challenges where status = 'open' and deadline < ? and deleted_at is null",
      timestamp,
    );

    for (const challenge of expired) {
      await database.runAsync(
        "update challenges set status = 'expired', updated_at = ?, hlc = ? where id = ?",
        [timestamp, hlc, challenge.id],
      );

      await enqueueMutation({
        tableName: "challenges",
        recordId: challenge.id,
        operation: "update",
        payload: { status: "expired" },
        deviceId: "system",
        hlc,
      });
    }

    return expired.length;
  } catch (error) {
    throw toChallengeApiError("Failed to expire challenges.", error);
  }
};
