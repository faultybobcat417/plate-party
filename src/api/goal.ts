import * as Crypto from "expo-crypto";

import type { Goal } from "../db/schema";

export type CreateGoalInput = {
  userId: string;
  title: string;
  description?: string | null;
  stakeAmount?: number;
  deadline?: string | Date | null;
};

function buildGoal(input: CreateGoalInput): Goal {
  return {
    id: Crypto.randomUUID(),
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    stakeAmount: input.stakeAmount ?? 0,
    deadline: input.deadline ? new Date(input.deadline) : null,
    status: "active",
    streakWeeks: 0,
    createdAt: new Date(),
    completedAt: null,
    deletedAt: null,
  };
}

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
      ? { userId: inputOrUserId, title: title ?? "Untitled goal", description, stakeAmount, deadline }
      : inputOrUserId;

  return buildGoal(input);
}

export async function getUserGoals(_userId: string): Promise<Goal[]> {
  return [];
}

export async function getActiveGoals(_userId: string): Promise<Goal[]> {
  return [];
}

export async function completeGoal(_goalId: string): Promise<void> {}

export async function failGoal(_goalId: string): Promise<void> {}
