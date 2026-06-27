import { supabase } from "../lib/supabase";
import type { ChallengeEntry as DbChallengeEntry } from "../db/schema";
import * as Crypto from "expo-crypto";

export type ChallengeStatus = "open" | "claimed" | "completed" | "expired" | "locked" | "void";
export type ChallengeType = "public" | "private" | "personal" | "self" | "bounty" | "group";

export interface Challenge {
  id: string;
  creatorId?: string;
  title: string;
  description?: string | null;
  type: ChallengeType;
  stakeAmount?: number;
  rewardAmount?: number;
  rewardPlates?: number;
  status: ChallengeStatus;
  expiresAt: Date | string;
  deadline: string;
  proofNote?: string | null;
  proofRequired?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  participantCount?: number;
}

export type ChallengeEntry = DbChallengeEntry;

export type ProofSubmission = {
  id: string;
  challengeId: string;
  submitterId: string;
  proofType: "camera" | "photo" | "file" | "text";
  proofData?: string;
  submittedAt?: string;
};

export type CreateChallengeInput = {
  creatorId: string;
  title: string;
  description?: string | null;
  stakeAmount?: number;
  rewardAmount?: number;
  rewardPlates?: number;
  type?: ChallengeType;
  deadline?: string;
  expiresAt?: Date | string;
};

export async function createChallenge(input: CreateChallengeInput): Promise<Challenge>;
export async function createChallenge(creatorId: string, title: string, description: string | null, stakeAmount: number, rewardAmount: number, type?: "public" | "private" | "personal", expiresAt?: Date): Promise<Challenge>;
export async function createChallenge(inputOrCreatorId: CreateChallengeInput | string, title?: string, description?: string | null, stakeAmount = 0, rewardAmount = 0, type: "public" | "private" | "personal" = "public", expiresAt?: Date): Promise<Challenge> {
  if (typeof inputOrCreatorId !== "string") {
    const input = inputOrCreatorId;
    return {
      id: Crypto.randomUUID(),
      creatorId: input.creatorId,
      title: input.title,
      description: input.description ?? null,
      type: input.type ?? "public",
      stakeAmount: input.stakeAmount ?? 0,
      rewardAmount: input.rewardAmount ?? input.rewardPlates ?? 0,
      rewardPlates: input.rewardPlates ?? input.rewardAmount ?? 0,
      status: "open",
      deadline: input.deadline ?? input.expiresAt?.toString() ?? new Date(Date.now() + 86400000).toISOString(),
      expiresAt: input.expiresAt ?? input.deadline ?? new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      proofRequired: true,
      participantCount: 0,
    };
  }

  const creatorId = inputOrCreatorId;
  const { data, error } = await supabase.from("challenges").insert({ creator_id: creatorId, title, description, stake_amount: stakeAmount, reward_amount: rewardAmount, type, expires_at: expiresAt?.toISOString() }).select().single();
  if (error) throw error;
  return data as Challenge;
}

export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  const { data, error } = await supabase.from("challenges").select("*").eq("id", challengeId).is("deleted_at", null).single();
  if (error) return null;
  return data as Challenge;
}

export async function getOpenChallenges(limit: number = 50): Promise<Challenge[]> {
  const { data, error } = await supabase.from("challenges").select("*").eq("status", "open").is("deleted_at", null).order("created_at", { ascending: false }).limit(limit);
  return (data || []) as Challenge[];
}

export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  const { data, error } = await supabase.from("challenges").select("*").eq("creator_id", userId).is("deleted_at", null).order("created_at", { ascending: false });
  return (data || []) as Challenge[];
}

export async function enterChallenge(challengeId: string, userId: string, stakeAmount: number): Promise<ChallengeEntry> {
  const { data, error } = await supabase.from("challenge_entries").insert({ challenge_id: challengeId, user_id: userId, stake_amount: stakeAmount }).select().single();
  if (error) throw error;
  return data as ChallengeEntry;
}

export async function submitProof(entryId: string, proofUrl: string): Promise<ChallengeEntry> {
  const { data, error } = await supabase.from("challenge_entries").update({ proof_url: proofUrl, proof_submitted_at: new Date().toISOString() }).eq("id", entryId).select().single();
  if (error) throw error;
  return data as ChallengeEntry;
}

export async function resolveChallenge(challengeId: string, winnerUserId: string): Promise<void> {
  await supabase.from("challenges").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", challengeId);
  await supabase.from("challenge_entries").update({ status: "won" }).eq("challenge_id", challengeId).eq("user_id", winnerUserId);
  await supabase.from("challenge_entries").update({ status: "lost" }).eq("challenge_id", challengeId).neq("user_id", winnerUserId);
}

export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
  const { data, error } = await supabase.from("challenge_entries").select("*").eq("challenge_id", challengeId).is("deleted_at", null);
  return (data || []) as ChallengeEntry[];
}

export async function getUserChallengeEntries(userId: string): Promise<ChallengeEntry[]> {
  const { data, error } = await supabase.from("challenge_entries").select("*").eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: false });
  return (data || []) as ChallengeEntry[];
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.from("challenges").update({ deleted_at: new Date().toISOString() }).eq("id", challengeId);
  if (error) throw error;
}
