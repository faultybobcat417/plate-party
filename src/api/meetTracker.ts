import { openSQLiteDatabase } from "../db/connection";
import { type Uuid } from "../db/schema";

export type DatingStats = {
  totalLikesGiven: number;
  totalLikesReceived: number;
  totalMatches: number;
  totalMessagesSent: number;
  totalPlatesSpent: number;
  totalComments: number;
  totalDms: number;
  matchRate: number; // percentage
};

export type Match = {
  userId: Uuid;
  displayName: string;
  avatarColor: string;
  matchedAt: string;
  lastInteractionAt: string;
};

export type DatingHistoryEntry = {
  id: Uuid;
  postId: Uuid;
  postCaption: string;
  interactionType: string;
  platesPaid: number;
  commentText: string | null;
  createdAt: string;
  otherUserId: Uuid;
  otherUserName: string;
};

export class MeetTrackerError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "MeetTrackerError";
  }
}

export const getMyDatingStats = async (userId: Uuid): Promise<DatingStats> => {
  const db = await openSQLiteDatabase();

  const likesGiven = await db.getFirstAsync<{ count: number }>(
    "select count(*) as count from meat_interactions where user_id = ? and interaction_type = 'like'",
    userId,
  );

  const likesReceived = await db.getFirstAsync<{ count: number }>(
    "select count(*) as count from meat_interactions mi join meat_posts mp on mp.id = mi.post_id where mp.creator_id = ? and mi.interaction_type = 'like'",
    userId,
  );

  const messagesSent = await db.getFirstAsync<{ count: number }>(
    "select count(*) as count from meat_interactions where user_id = ? and interaction_type = 'dm'",
    userId,
  );

  const commentsSent = await db.getFirstAsync<{ count: number }>(
    "select count(*) as count from meat_interactions where user_id = ? and interaction_type = 'comment'",
    userId,
  );

  const platesSpent = await db.getFirstAsync<{ total: number | null }>(
    "select coalesce(sum(plates_paid), 0) as total from meat_interactions where user_id = ?",
    userId,
  );

  // Matches = mutual likes
  const matches = await db.getAllAsync<{ matched_user_id: string; matched_at: string }>(
    `select distinct mi2.user_id as matched_user_id, mi2.created_at as matched_at
     from meat_interactions mi1
     join meat_posts mp1 on mp1.id = mi1.post_id
     join meat_interactions mi2 on mi2.post_id = mp1.id and mi2.user_id = mp1.creator_id
     join meat_posts mp2 on mp2.id = mi2.post_id and mp2.creator_id = mi1.user_id
     where mi1.user_id = ? and mi1.interaction_type = 'like' and mi2.interaction_type = 'like'
     order by mi2.created_at desc`,
    userId,
  );

  const totalLikesGiven = likesGiven?.count ?? 0;
  const totalLikesReceived = likesReceived?.count ?? 0;
  const totalMatches = matches.length;
  const matchRate = totalLikesGiven > 0 ? Math.round((totalMatches / totalLikesGiven) * 100) : 0;

  return {
    totalLikesGiven,
    totalLikesReceived,
    totalMatches,
    totalMessagesSent: messagesSent?.count ?? 0,
    totalDms: messagesSent?.count ?? 0,
    totalComments: commentsSent?.count ?? 0,
    totalPlatesSpent: Number(platesSpent?.total ?? 0),
    matchRate,
  };
};

export const getMyMatches = async (userId: Uuid): Promise<Match[]> => {
  const db = await openSQLiteDatabase();

  const rows = await db.getAllAsync<Match>(
    `select distinct
      u.id as userId,
      u.display_name as displayName,
      u.avatar_color as avatarColor,
      mi2.created_at as matchedAt,
      mi2.created_at as lastInteractionAt
     from meat_interactions mi1
     join meat_posts mp1 on mp1.id = mi1.post_id
     join meat_interactions mi2 on mi2.post_id = mp1.id and mi2.user_id = mp1.creator_id
     join meat_posts mp2 on mp2.id = mi2.post_id and mp2.creator_id = mi1.user_id
     join users u on u.id = mp1.creator_id
     where mi1.user_id = ? and mi1.interaction_type = 'like' and mi2.interaction_type = 'like'
     order by mi2.created_at desc`,
    userId,
  );

  return rows;
};

export const getDatingHistory = async (userId: Uuid, limit = 50): Promise<DatingHistoryEntry[]> => {
  const db = await openSQLiteDatabase();

  const rows = await db.getAllAsync<DatingHistoryEntry>(
    `select
      mi.id, mi.post_id as postId, mp.caption as postCaption,
      mi.interaction_type as interactionType, mi.plates_paid as platesPaid,
      mi.comment_text as commentText, mi.created_at as createdAt,
      mp.creator_id as otherUserId, u.display_name as otherUserName
     from meat_interactions mi
     join meat_posts mp on mp.id = mi.post_id
     join users u on u.id = mp.creator_id
     where mi.user_id = ?
     order by mi.created_at desc
     limit ?`,
    [userId, limit],
  );

  return rows;
};
