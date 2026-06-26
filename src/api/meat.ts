import { and, sql } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  createDefaultHlc,
  createUuid,
  meatInteractions,
  meatPosts,
  type Uuid,
} from "../db/schema";
import { enqueueMutation } from "./sync";

export type CreateMeatPostInput = {
  creatorId: Uuid;
  caption: string;
  bioSnippet?: string | null;
  plateCost: number;
  imageUrl?: string | null;
  deviceId?: string;
  creatorName?: string;
  creatorAvatar?: string;
};

export type MeatPost = {
  id: Uuid;
  creatorId: Uuid;
  caption: string;
  bioSnippet: string | null;
  plateCost: number;
  imageUrl: string | null;
  likes: number;
  comments: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hlc: string;
  lastModifiedByDeviceId: string | null;
  creatorName?: string;
  creatorAvatar?: string;
  isTrending?: boolean;
};

export type InteractWithMeatPostInput = {
  postId: Uuid;
  userId: Uuid;
  interactionType: "like" | "comment" | "dm";
  platesPaid: number;
  commentText?: string | null;
  deviceId?: string;
};

export type MeatInteraction = {
  id: Uuid;
  postId: Uuid;
  userId: Uuid;
  interactionType: string;
  platesPaid: number;
  commentText: string | null;
  createdAt: string;
  hlc: string;
  lastModifiedByDeviceId: string | null;
};

export class MeatApiError extends Error {
  public readonly cause: unknown;
  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MeatApiError";
    this.cause = cause;
  }
}

const toMeatApiError = (message: string, error: unknown): MeatApiError => {
  if (error instanceof MeatApiError) return error;
  return new MeatApiError(message, error);
};

const now = (): string => new Date().toISOString();

export const createMeatPost = async (input: CreateMeatPostInput): Promise<MeatPost> => {
  try {
    if (input.plateCost <= 0) throw new MeatApiError("plateCost must be greater than 0.");

    const database = await openSQLiteDatabase();
    const postId = createUuid();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const deviceId = input.deviceId ?? "unknown";

    await database.runAsync(
      `insert into meat_posts (
        id, creator_id, caption, bio_snippet, plate_cost, image_url,
        likes, comments, status, created_at, updated_at, hlc, last_modified_by_device_id
      ) values (?, ?, ?, ?, ?, ?, 0, 0, 'active', ?, ?, ?, ?)`,
      [postId, input.creatorId, input.caption, input.bioSnippet ?? null, input.plateCost,
       input.imageUrl ?? null, timestamp, timestamp, hlc, deviceId],
    );

    const row = await database.getFirstAsync<MeatPost>(
      `select id, creator_id as creatorId, caption, bio_snippet as bioSnippet, plate_cost as plateCost,
       image_url as imageUrl, likes, comments, status, created_at as createdAt, updated_at as updatedAt,
       deleted_at as deletedAt, hlc, last_modified_by_device_id as lastModifiedByDeviceId
       from meat_posts where id = ?`,
      postId,
    );

    if (!row) throw new MeatApiError("Meat post insert failed.");

    await enqueueMutation({
      tableName: "meat_posts",
      recordId: postId,
      operation: "insert",
      payload: { id: postId, creatorId: input.creatorId, caption: input.caption, plateCost: input.plateCost, status: "active" },
      deviceId,
      hlc,
    });

    return row;
  } catch (error) {
    throw toMeatApiError("Failed to create meat post.", error);
  }
};

export const interactWithMeatPost = async (input: InteractWithMeatPostInput): Promise<{ interactionId: Uuid; match: boolean }> => {
  try {
    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();
    const deviceId = input.deviceId ?? "unknown";
    let result = { interactionId: "" as Uuid, match: false };

    await database.withExclusiveTransactionAsync(async (transaction) => {
      const post = await transaction.getFirstAsync<{
        id: string; creator_id: string; plate_cost: number; status: string;
      }>(
        "select id, creator_id, plate_cost, status from meat_posts where id = ? and deleted_at is null",
        input.postId,
      );
      if (!post) throw new MeatApiError("Meat post not found.");
      if (post.status !== "active") throw new MeatApiError(`Post status is ${post.status}.`);
      if (post.creator_id === input.userId) throw new MeatApiError("Cannot interact with own post.");
      if (input.platesPaid < post.plate_cost) throw new MeatApiError(`Minimum ${post.plate_cost} plates required.`);
      if ((input.interactionType === "comment" || input.interactionType === "dm") && (!input.commentText || input.commentText.trim().length === 0)) {
        throw new MeatApiError("Comment/DM text cannot be empty.");
      }

      if (input.interactionType === "like") {
        const existing = await transaction.getFirstAsync<{ id: string }>(
          "select id from meat_interactions where post_id = ? and user_id = ? and interaction_type = 'like'",
          [input.postId, input.userId],
        );
        if (existing) throw new MeatApiError("Already liked this post.");
      }

      let match = false;
      if (input.interactionType === "like") {
        const mutual = await transaction.getFirstAsync<{ id: string }>(
          "select mi.id from meat_interactions mi join meat_posts mp on mp.id = mi.post_id where mp.creator_id = ? and mi.user_id = ? and mi.interaction_type = 'like' limit 1",
          [input.userId, post.creator_id],
        );
        match = !!mutual;
      }

      const interactionId = createUuid();
      await transaction.runAsync(
        `insert into meat_interactions (id, post_id, user_id, interaction_type, plates_paid, comment_text, created_at, hlc, last_modified_by_device_id)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [interactionId, input.postId, input.userId, input.interactionType, input.platesPaid,
         input.commentText ?? null, timestamp, hlc, deviceId],
      );

      if (input.interactionType === "like") {
        await transaction.runAsync(
          "update meat_posts set likes = likes + 1, updated_at = ?, hlc = ? where id = ?",
          [timestamp, hlc, input.postId],
        );
      } else if (input.interactionType === "comment") {
        await transaction.runAsync(
          "update meat_posts set comments = comments + 1, updated_at = ?, hlc = ? where id = ?",
          [timestamp, hlc, input.postId],
        );
      }

      await enqueueMutation({
        tableName: "meat_interactions",
        recordId: interactionId,
        operation: "insert",
        payload: { id: interactionId, postId: input.postId, userId: input.userId, interactionType: input.interactionType, platesPaid: input.platesPaid },
        deviceId,
        hlc,
      }, transaction);

      result = { interactionId, match };
    });

    return result;
  } catch (error) {
    throw toMeatApiError("Failed to interact with meat post.", error);
  }
};

export const listMeatPosts = async (userId?: Uuid): Promise<Array<MeatPost & { creatorDisplayName: string; creatorAvatarColor: string }>> => {
  try {
    const database = await openSQLiteDatabase();
    const targetUserId = userId ?? "none";
    const interacted = await database.getAllAsync<{ post_id: string }>(
      "select post_id from meat_interactions where user_id = ?",
      targetUserId,
    );
    const interactedIds = interacted.map((r) => r.post_id);

    let sql = `select mp.id, mp.creator_id as creatorId, mp.caption, mp.bio_snippet as bioSnippet, mp.plate_cost as plateCost,
      mp.image_url as imageUrl, mp.likes, mp.comments, mp.status, mp.created_at as createdAt, mp.updated_at as updatedAt,
      mp.deleted_at as deletedAt, mp.hlc, mp.last_modified_by_device_id as lastModifiedByDeviceId,
      u.display_name as creatorDisplayName, u.avatar_color as creatorAvatarColor
      from meat_posts mp join users u on u.id = mp.creator_id
      where mp.status = 'active' and mp.creator_id != ? and mp.deleted_at is null`;
    const params: string[] = [targetUserId];

    if (interactedIds.length > 0) {
      const placeholders = interactedIds.map(() => "?").join(",");
      sql += ` and mp.id not in (${placeholders})`;
      params.push(...interactedIds);
    }

    sql += " order by mp.created_at desc";

    const rows = await database.getAllAsync<MeatPost & { creatorDisplayName: string; creatorAvatarColor: string }>(sql, params);
    return rows;
  } catch (error) {
    throw toMeatApiError("Failed to list meat posts.", error);
  }
};

export const getMyMeatInteractions = async (userId: Uuid): Promise<Array<MeatInteraction & { postCaption: string; userDisplayName: string }>> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<MeatInteraction & { postCaption: string; userDisplayName: string }>(
      `select mi.id, mi.post_id as postId, mi.user_id as userId, mi.interaction_type as interactionType,
       mi.plates_paid as platesPaid, mi.comment_text as commentText, mi.created_at as createdAt, mi.hlc,
       mi.last_modified_by_device_id as lastModifiedByDeviceId,
       mp.caption as postCaption, u.display_name as userDisplayName
       from meat_interactions mi
       join meat_posts mp on mp.id = mi.post_id
       join users u on u.id = mi.user_id
       where mp.creator_id = ?
       order by mi.created_at desc`,
      userId,
    );
    return rows;
  } catch (error) {
    throw toMeatApiError("Failed to get meat interactions.", error);
  }
};

export const updateMeatPostStatus = async (postId: Uuid, creatorId: Uuid, status: "active" | "paused" | "expired", deviceId?: string): Promise<void> => {
  try {
    const database = await openSQLiteDatabase();
    const post = await database.getFirstAsync<{ creator_id: string }>(
      "select creator_id from meat_posts where id = ? and deleted_at is null",
      postId,
    );
    if (!post) throw new MeatApiError("Meat post not found.");
    if (post.creator_id !== creatorId) throw new MeatApiError("Only creator can update post status.");

    const hlc = createDefaultHlc();
    await database.runAsync(
      "update meat_posts set status = ?, updated_at = ?, hlc = ? where id = ?",
      [status, now(), hlc, postId],
    );

    await enqueueMutation({
      tableName: "meat_posts",
      recordId: postId,
      operation: "update",
      payload: { status },
      deviceId: deviceId ?? "unknown",
      hlc,
    });
  } catch (error) {
    throw toMeatApiError("Failed to update meat post status.", error);
  }
};
