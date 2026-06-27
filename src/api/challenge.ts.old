import { supabase } from "../lib/supabase";
import { Challenge, ChallengeEntry } from "../db/schema";

export async function createChallenge(
  creatorId: string,
  title: string,
  description: string | null,
  stakeAmount: number,
  rewardAmount: number,
  type: "public" | "private" | "personal" = "public",
  expiresAt?: Date
): Promise<Challenge> {
  const { data, error } = await supabase
    .from("challenges")
    .insert({
      creator_id: creatorId,
      title,
      description,
      stake_amount: stakeAmount,
      reward_amount: rewardAmount,
      type,
      expires_at: expiresAt?.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Challenge;
}

export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data as Challenge;
}

export async function getOpenChallenges(limit: number = 50): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "open")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as Challenge[];
}

export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("creator_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Challenge[];
}

export async function enterChallenge(
  challengeId: string,
  userId: string,
  stakeAmount: number
): Promise<ChallengeEntry> {
  const { data, error } = await supabase
    .from("challenge_entries")
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      stake_amount: stakeAmount,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChallengeEntry;
}

export async function submitProof(
  entryId: string,
  proofUrl: string
): Promise<ChallengeEntry> {
  const { data, error } = await supabase
    .from("challenge_entries")
    .update({
      proof_url: proofUrl,
      proof_submitted_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .select()
    .single();

  if (error) throw error;
  return data as ChallengeEntry;
}

export async function resolveChallenge(
  challengeId: string,
  winnerUserId: string
): Promise<void> {
  // Update challenge status
  const { error: challengeError } = await supabase
    .from("challenges")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", challengeId);

  if (challengeError) throw challengeError;

  // Update winner entry
  const { error: entryError } = await supabase
    .from("challenge_entries")
    .update({ status: "won" })
    .eq("challenge_id", challengeId)
    .eq("user_id", winnerUserId);

  if (entryError) throw entryError;

  // Mark others as lost
  const { error: losersError } = await supabase
    .from("challenge_entries")
    .update({ status: "lost" })
    .eq("challenge_id", challengeId)
    .neq("user_id", winnerUserId);

  if (losersError) throw losersError;
}

export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
  const { data, error } = await supabase
    .from("challenge_entries")
    .select("*")
    .eq("challenge_id", challengeId)
    .is("deleted_at", null);

  if (error) return [];
  return (data || []) as ChallengeEntry[];
}

export async function getUserChallengeEntries(userId: string): Promise<ChallengeEntry[]> {
  const { data, error } = await supabase
    .from("challenge_entries")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as ChallengeEntry[];
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase
    .from("challenges")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", challengeId);

  if (error) throw error;
}
