import { and, sql } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  createDefaultHlc,
  createUuid,
  stakeEntries,
  stakePosts,
  type Uuid,
} from "../db/schema";
import { enqueueMutation } from "./sync";

export type CreateStakePostInput = {
  creatorId: Uuid;
  content: string;
  targetPlates: number;
  deadline: string;
  options: Array<{ label: string }>;
  deviceId?: string;
  creatorName?: string;
  creatorAvatar?: string;
};

export type StakePost = {
  id: Uuid;
  creatorId: Uuid;
  content: string;
  targetPlates: number;
  totalStaked: number;
  participantCount: number;
  deadline: string;
  status: string;
  optionsJson: Array<{ label: string; staked: number }>;
  options?: Array<{ label: string; staked: number }>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hlc: string;
  lastModifiedByDeviceId: string | null;
  creatorName?: string;
  creatorAvatar?: string;
};

export type StakeOnPostInput = {
  postId: Uuid;
  userId: Uuid;
  optionIndex: number;
  platesStaked: number;
  deviceId?: string;
};

export type StakeEntry = {
  id: Uuid;
  postId: Uuid;
  userId: Uuid;
  optionIndex: number;
  platesStaked: number;
  createdAt: string;
  hlc: string;
  lastModifiedByDeviceId: string | null;
};

export class StakeApiError extends Error {
  public readonly cause: unknown;
  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "StakeApiError";
    this.cause = cause;
  }
}

const toStakeApiError = (message: string, error: unknown): StakeApiError => {
  if (error instanceof StakeApiError) return error;
  return new StakeApiError(message, error);
};

const now = (): string => new Date().toISOString();

export const createStakePost = async (input: CreateStakePostInput): Promise<StakePost> => {
  try {
    if (input.targetPlates <= 0) throw new StakeApiError("targetPlates must be > 0.");
    if (input.options.length < 2) throw new StakeApiError("Minimum 2 options required.");
    if (new Date(input.deadline) <= new Date()) throw new StakeApiError("Deadline must be in the future.");

    const database = await openSQLiteDatabase();
    const postId = createUuid();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const deviceId = input.deviceId ?? "unknown";
    const optionsJson = input.options.map((opt) => ({ ...opt, staked: 0 }));

    await database.runAsync(
      `insert into stake_posts (id, creator_id, content, target_plates, total_staked, participant_count, deadline, status, options_json, created_at, updated_at, hlc, last_modified_by_device_id)
       values (?, ?, ?, ?, 0, 0, ?, 'open', ?, ?, ?, ?, ?)`,
      [postId, input.creatorId, input.content, input.targetPlates, input.deadline,
       JSON.stringify(optionsJson), timestamp, timestamp, hlc, deviceId],
    );

    const row = await database.getFirstAsync<StakePost>(
      `select id, creator_id as creatorId, content, target_plates as targetPlates, total_staked as totalStaked,
       participant_count as participantCount, deadline, status, options_json as optionsJson,
       created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt, hlc,
       last_modified_by_device_id as lastModifiedByDeviceId
       from stake_posts where id = ?`,
      postId,
    );

    if (!row) throw new StakeApiError("Stake post insert failed.");
    row.options = optionsJson;

    await enqueueMutation({
      tableName: "stake_posts",
      recordId: postId,
      operation: "insert",
      payload: { id: postId, creatorId: input.creatorId, content: input.content, targetPlates: input.targetPlates, status: "open" },
      deviceId,
      hlc,
    });

    return row;
  } catch (error) {
    throw toStakeApiError("Failed to create stake post.", error);
  }
};

export const stakeOnPost = async (input: StakeOnPostInput): Promise<void> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const deviceId = input.deviceId ?? "unknown";

    await database.withExclusiveTransactionAsync(async (transaction) => {
      const post = await transaction.getFirstAsync<{
        id: string; status: string; options_json: string; total_staked: number; participant_count: number;
      }>(
        "select id, status, options_json, total_staked, participant_count from stake_posts where id = ? and deleted_at is null",
        input.postId,
      );
      if (!post) throw new StakeApiError("Stake post not found.");
      if (post.status !== "open") throw new StakeApiError(`Post status is ${post.status}.`);

      const options = JSON.parse(post.options_json) as Array<{ label: string; staked: number }>;
      if (input.optionIndex < 0 || input.optionIndex >= options.length) throw new StakeApiError("Invalid option index.");
      if (input.platesStaked <= 0) throw new StakeApiError("platesStaked must be > 0.");

      const existing = await transaction.getFirstAsync<{ id: string }>(
        "select id from stake_entries where post_id = ? and user_id = ?",
        [input.postId, input.userId],
      );
      if (existing) throw new StakeApiError("User already staked on this post.");

      const entryId = createUuid();
      await transaction.runAsync(
        `insert into stake_entries (id, post_id, user_id, option_index, plates_staked, created_at, hlc, last_modified_by_device_id)
         values (?, ?, ?, ?, ?, ?, ?, ?)`,
        [entryId, input.postId, input.userId, input.optionIndex, input.platesStaked, timestamp, hlc, deviceId],
      );

      options[input.optionIndex].staked = (options[input.optionIndex].staked || 0) + input.platesStaked;
      await transaction.runAsync(
        "update stake_posts set total_staked = total_staked + ?, participant_count = participant_count + 1, options_json = ?, updated_at = ?, hlc = ? where id = ?",
        [input.platesStaked, JSON.stringify(options), timestamp, hlc, input.postId],
      );

      await enqueueMutation({
        tableName: "stake_entries",
        recordId: entryId,
        operation: "insert",
        payload: { id: entryId, postId: input.postId, userId: input.userId, optionIndex: input.optionIndex, platesStaked: input.platesStaked },
        deviceId,
        hlc,
      }, transaction);
    });
  } catch (error) {
    throw toStakeApiError("Failed to stake on post.", error);
  }
};

export const resolveStakePost = async (postId: Uuid, winningOptionIndex: number, resolverId: Uuid, deviceId?: string): Promise<void> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const devId = deviceId ?? "unknown";

    await database.withExclusiveTransactionAsync(async (transaction) => {
      const post = await transaction.getFirstAsync<{
        id: string; creator_id: string; status: string; deadline: string; options_json: string; total_staked: number;
      }>(
        "select id, creator_id, status, deadline, options_json, total_staked from stake_posts where id = ? and deleted_at is null",
        postId,
      );
      if (!post) throw new StakeApiError("Stake post not found.");
      if (post.creator_id !== resolverId) throw new StakeApiError("Only creator can resolve.");
      if (post.status !== "open" && post.status !== "locked") throw new StakeApiError("Post already resolved.");
      if (new Date(post.deadline) > new Date()) throw new StakeApiError("Deadline has not passed.");

      const options = JSON.parse(post.options_json) as Array<{ label: string; staked: number }>;
      if (winningOptionIndex < 0 || winningOptionIndex >= options.length) throw new StakeApiError("Invalid winning option.");

      const entries = await transaction.getAllAsync<{
        id: string; user_id: string; option_index: number; plates_staked: number;
      }>(
        "select id, user_id, option_index, plates_staked from stake_entries where post_id = ?",
        postId,
      );

      const winningEntries = entries.filter((e) => e.option_index === winningOptionIndex);
      const totalWinningPlates = winningEntries.reduce((sum, e) => sum + e.plates_staked, 0);

      if (totalWinningPlates > 0) {
        for (const entry of winningEntries) {
          const share = Math.floor((entry.plates_staked * post.total_staked) / totalWinningPlates);
        }
      }

      await transaction.runAsync(
        "update stake_posts set status = 'resolved', updated_at = ?, hlc = ? where id = ?",
        [timestamp, hlc, postId],
      );

      await enqueueMutation({
        tableName: "stake_posts",
        recordId: postId,
        operation: "update",
        payload: { status: "resolved" },
        deviceId: devId,
        hlc,
      }, transaction);
    });
  } catch (error) {
    throw toStakeApiError("Failed to resolve stake post.", error);
  }
};

export const listStakePosts = async (): Promise<Array<StakePost & { creatorDisplayName: string }>> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<StakePost & { creatorDisplayName: string }>(
      `select sp.id, sp.creator_id as creatorId, sp.content, sp.target_plates as targetPlates, sp.total_staked as totalStaked,
       sp.participant_count as participantCount, sp.deadline, sp.status, sp.options_json as optionsJson,
       sp.created_at as createdAt, sp.updated_at as updatedAt, sp.deleted_at as deletedAt, sp.hlc,
       sp.last_modified_by_device_id as lastModifiedByDeviceId, u.display_name as creatorDisplayName
       from stake_posts sp join users u on u.id = sp.creator_id
       where sp.status = 'open' and sp.deleted_at is null
       order by sp.created_at desc`,
    );
    for (const row of rows) {
      try {
        row.options = JSON.parse(row.optionsJson as unknown as string);
      } catch {
        row.options = [];
      }
    }
    return rows;
  } catch (error) {
    throw toStakeApiError("Failed to list stake posts.", error);
  }
};

export const getStakeEntriesForPost = async (postId: Uuid): Promise<Array<StakeEntry & { userDisplayName: string }>> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<StakeEntry & { userDisplayName: string }>(
      `select se.id, se.post_id as postId, se.user_id as userId, se.option_index as optionIndex, se.plates_staked as platesStaked,
       se.created_at as createdAt, se.hlc, se.last_modified_by_device_id as lastModifiedByDeviceId,
       u.display_name as userDisplayName
       from stake_entries se join users u on u.id = se.user_id
       where se.post_id = ?`,
      postId,
    );
    return rows;
  } catch (error) {
    throw toStakeApiError("Failed to get stake entries.", error);
  }
};
