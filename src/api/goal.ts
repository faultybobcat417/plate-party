import { supabase } from "../lib/supabase";
import { Goal } from "../db/schema";

export async function createGoal(userId: string, title: string, description: string | null, stakeAmount: number, deadline?: Date): Promise<Goal> {
  const { data, error } = await supabase.from("goals").insert({ user_id: userId, title, description, stake_amount: stakeAmount, deadline: deadline?.toISOString() }).select().single();
  if (error) throw error;
  return data as Goal;
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase.from("goals").select("*").eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: false });
  return (data || []) as Goal[];
}

export async function getActiveGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase.from("goals").select("*").eq("user_id", userId).eq("status", "active").is("deleted_at", null).order("deadline", { ascending: true });
  return (data || []) as Goal[];
}

export async function completeGoal(goalId: string): Promise<Goal> {
  const { data, error } = await supabase.from("goals").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", goalId).select().single();
  if (error) throw error;
  return data as Goal;
}

export async function failGoal(goalId: string): Promise<Goal> {
  const { data, error } = await supabase.from("goals").update({ status: "failed" }).eq("id", goalId).select().single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from("goals").update({ deleted_at: new Date().toISOString() }).eq("id", goalId);
  if (error) throw error;
}
