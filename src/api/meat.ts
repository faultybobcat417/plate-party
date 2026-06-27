import * as Crypto from "expo-crypto";

export interface MeatPost {
  id: string;
  userId: string;
  creatorId?: string;
  username: string;
  creatorName?: string;
  creatorAvatar?: string;
  bioSnippet?: string;
  content: string;
  caption?: string;
  imageUrl?: string;
  plateCost?: number;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isTrending?: boolean;
  status?: "draft" | "active" | "archived";
}

export type CreateMeatPostInput = {
  userId?: string;
  creatorId?: string;
  username?: string;
  creatorName?: string;
  creatorAvatar?: string;
  content?: string;
  caption?: string;
  bioSnippet?: string;
  imageUrl?: string;
  plateCost?: number;
};

export type InteractWithMeatPostInput = {
  postId: string;
  userId: string;
  type?: "like" | "comment" | "dm";
  interactionType?: "like" | "comment" | "dm";
  platesPaid?: number;
};

export type MeatInteraction = InteractWithMeatPostInput & {
  id: string;
  createdAt: string;
};

export async function getFeedPosts(): Promise<MeatPost[]> {
  return [];
}

export async function listMeatPosts(_userId?: string): Promise<MeatPost[]> {
  return getFeedPosts();
}

export async function createMeatPost(input: CreateMeatPostInput): Promise<MeatPost> {
  const content = input.content ?? input.caption ?? "";
  return {
    id: Crypto.randomUUID(),
    userId: input.userId ?? input.creatorId ?? "",
    creatorId: input.creatorId ?? input.userId,
    username: input.username ?? input.creatorName ?? "You",
    creatorName: input.creatorName ?? input.username ?? "You",
    creatorAvatar: input.creatorAvatar,
    bioSnippet: input.bioSnippet,
    content,
    caption: input.caption ?? content,
    imageUrl: input.imageUrl,
    plateCost: input.plateCost ?? 25,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function interactWithMeatPost(
  input: InteractWithMeatPostInput,
): Promise<MeatInteraction> {
  const type = input.type ?? input.interactionType ?? "like";
  return {
    id: Crypto.randomUUID(),
    ...input,
    type,
    createdAt: new Date().toISOString(),
  };
}

export async function getMyMeatInteractions(_userId: string): Promise<MeatInteraction[]> {
  return [];
}

export async function updateMeatPostStatus(
  _postId: string,
  _status: NonNullable<MeatPost["status"]>,
): Promise<void> {}
