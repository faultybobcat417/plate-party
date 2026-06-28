import { z } from "zod";

import type { Goal } from "../db/schema";
import { supabase } from "../lib/supabase";
import {
  DescriptionSchema,
  PaginationSchema,
  PlateAmountSchema,
  TitleSchema,
  UUIDSchema,
} from "../lib/validation";
import {
  assertOwnUser,
  getRequiredSession,
  isRecord,
  readDateValue,
  readNullableString,
  readNumber,
  readString,
} from "./_shared";

export type CreateGoalInput = {
  userId?: string;
  title: string;
  description?: string | null;
  stakeAmount?: number;
  deadline?: string | Date | null;
};

export type GetGoalsInput = z.infer<typeof GetGoalsSchema>;

const GoalStatusSchema = z.enum(["active", "completed", "failed", "deleted"]);
const GoalRowSchema = z.record(z.string(), z.unknown());
const GoalRowsSchema = z.array(GoalRowSchema);

const CreateGoalSchema = z.object({
  userId: UUIDSchema.optional(),
  title: TitleSchema,
  description: DescriptionSchema.nullish(),
  stakeAmount: z.number().int().min(0).default(0),
  deadline: z.union([z.string().datetime(), z.date()]).nullish(),
});

const GetGoalsSchema = PaginationSchema.extend({
  userId: UUIDSchema.optional(),
  status: GoalStatusSchema.optional(),
});

const GoalIdSchema = z.object({
  goalId: UUIDSchema,
});

export async function createGoal(input: CreateGoalInput): Promise<Goal>;
export async function createGoal(
  userId: string,
  title: string,
  description?: string | null,
  stakeAmount?: number,
  deadline?: string | Date | null,
): Promise<Goal>;
export async function createGoal(
  inputOrUserId: CreateGoalInput | string,
  title?: string,
  description?: string | null,
  stakeAmount?: number,
  deadline?: string | Date | null,
): Promise<Goal> {
  const input =
    typeof inputOrUserId === "string"
      ? { userId: inputOrUserId, title: title ?? "", description, stakeAmount, deadline }
      : inputOrUserId;
  const parsed = CreateGoalSchema.parse(input);
  const session = await getRequiredSession();
  const scopedUserId = assertOwnUser(session, parsed.userId);
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: scopedUserId,
      title: parsed.title,
      description: parsed.description ?? null,
      stake_amount: parsed.stakeAmount,
      deadline: parsed.deadline ? toIsoString(parsed.deadline) : null,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;
  return normalizeGoal(GoalRowSchema.parse(data));
}

export async function getGoals(input: Partial<GetGoalsInput> = {}): Promise<Goal[]> {
  const session = await getRequiredSession();
  const parsed = GetGoalsSchema.parse(input);
  const scopedUserId = assertOwnUser(session, parsed.userId);
  let query = supabase
    .from("goals")
    .select("*")
    .eq("user_id", scopedUserId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(parsed.limit);

  if (parsed.status) query = query.eq("status", parsed.status);
  if (parsed.cursor) query = query.lt("created_at", parsed.cursor);

  const { data, error } = await query;
  if (error) throw error;
  return GoalRowsSchema.parse(data ?? []).map(normalizeGoal);
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  return getGoals({ userId, limit: 100 });
}

export async function getActiveGoals(userId: string): Promise<Goal[]> {
  return getGoals({ userId, status: "active", limit: 100 });
}

export async function completeGoal(goalId: string): Promise<void> {
  const { goalId: id } = GoalIdSchema.parse({ goalId });
  await getRequiredSession();
  const { error } = await supabase
    .from("goals")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function failGoal(goalId: string): Promise<void> {
  const { goalId: id } = GoalIdSchema.parse({ goalId });
  await getRequiredSession();
  const { error } = await supabase
    .from("goals")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { goalId: id } = GoalIdSchema.parse({ goalId });
  await getRequiredSession();
  const { error } = await supabase
    .from("goals")
    .update({
      status: "deleted",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

function normalizeGoal(row: Record<string, unknown>): Goal {
  return {
    id: readString(row, "id") ?? "",
    userId: readString(row, "userId", "user_id") ?? "",
    title: readString(row, "title") ?? "Untitled goal",
    description: readNullableString(row, "description"),
    stakeAmount: readNumber(row, "stakeAmount", "stake_amount") ?? 0,
    deadline: toNullableDate(readDateValue(row, "deadline")),
    status: readString(row, "status") ?? "active",
    streakWeeks: readNumber(row, "streakWeeks", "streak_weeks") ?? 0,
    createdAt: toDate(readDateValue(row, "createdAt", "created_at")),
    completedAt: toNullableDate(readDateValue(row, "completedAt", "completed_at")),
    deletedAt: toNullableDate(readDateValue(row, "deletedAt", "deleted_at")),
  };
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toDate(value: string | Date | null): Date {
  if (value instanceof Date) return value;
  return value ? new Date(value) : new Date();
}

function toNullableDate(value: string | Date | null): Date | null {
  if (value instanceof Date) return value;
  return value ? new Date(value) : null;
}
