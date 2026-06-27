import { supabase } from "../lib/supabase";
import { Prediction, PredictionOption, PredictionEntry } from "../db/schema";

export async function createPrediction(creatorId: string, title: string, description: string | null, options: string[], partyId?: string, expiresAt?: Date): Promise<{ prediction: Prediction; options: PredictionOption[] }> {
  const { data: prediction, error: predError } = await supabase.from("predictions").insert({ creator_id: creatorId, party_id: partyId, title, description, expires_at: expiresAt?.toISOString() }).select().single();
  if (predError) throw predError;
  const optionInserts = options.map((label, index) => ({ prediction_id: prediction.id, label, sort_order: index }));
  const { data: predOptions, error: optError } = await supabase.from("prediction_options").insert(optionInserts).select();
  if (optError) throw optError;
  return { prediction: prediction as Prediction, options: (predOptions || []) as PredictionOption[] };
}

export async function getPredictionById(predictionId: string): Promise<Prediction | null> {
  const { data, error } = await supabase.from("predictions").select("*").eq("id", predictionId).is("deleted_at", null).single();
  if (error) return null;
  return data as Prediction;
}

export async function getPredictionOptions(predictionId: string): Promise<PredictionOption[]> {
  const { data, error } = await supabase.from("prediction_options").select("*").eq("prediction_id", predictionId).order("sort_order", { ascending: true });
  return (data || []) as PredictionOption[];
}

export async function getPartyPredictions(partyId: string): Promise<Prediction[]> {
  const { data, error } = await supabase.from("predictions").select("*").eq("party_id", partyId).is("deleted_at", null).order("created_at", { ascending: false });
  return (data || []) as Prediction[];
}

export async function enterPrediction(predictionId: string, optionId: string, userId: string, stakeAmount: number): Promise<PredictionEntry> {
  const { data, error } = await supabase.from("prediction_entries").insert({ prediction_id: predictionId, option_id: optionId, user_id: userId, stake_amount: stakeAmount }).select().single();
  if (error) throw error;
  return data as PredictionEntry;
}

export async function lockPrediction(predictionId: string): Promise<void> {
  const { error } = await supabase.from("predictions").update({ status: "locked", updated_at: new Date().toISOString() }).eq("id", predictionId);
  if (error) throw error;
}

export async function resolvePrediction(predictionId: string, winningOptionId: string): Promise<void> {
  await supabase.from("predictions").update({ status: "resolved", resolved_outcome: winningOptionId, updated_at: new Date().toISOString() }).eq("id", predictionId);
  await supabase.from("prediction_entries").update({ status: "won" }).eq("prediction_id", predictionId).eq("option_id", winningOptionId);
  await supabase.from("prediction_entries").update({ status: "lost" }).eq("prediction_id", predictionId).neq("option_id", winningOptionId);
}

export async function getPredictionEntries(predictionId: string): Promise<PredictionEntry[]> {
  const { data, error } = await supabase.from("prediction_entries").select("*").eq("prediction_id", predictionId).is("deleted_at", null);
  return (data || []) as PredictionEntry[];
}

export async function getUserPredictionEntries(userId: string): Promise<PredictionEntry[]> {
  const { data, error } = await supabase.from("prediction_entries").select("*").eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: false });
  return (data || []) as PredictionEntry[];
}

export async function voidPrediction(predictionId: string): Promise<void> {
  await supabase.from("predictions").update({ status: "void", updated_at: new Date().toISOString() }).eq("id", predictionId);
  await supabase.from("prediction_entries").update({ status: "void" }).eq("prediction_id", predictionId);
}
