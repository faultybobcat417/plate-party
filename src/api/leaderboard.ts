export type LeaderboardMode = "daily" | "weekly" | "monthly" | "allTime";
export type LeaderboardType = "individual" | "group";

export interface LeaderboardEntry {
  id: string;
  userId: string;
  name: string;
  displayName: string;
  plates: number;
  rank: number;
  rankChange?: number;
  avatar?: string;
  avatarUrl?: string;
  streak?: number;
}

export interface GroupLeaderboardEntry {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  displayName: string;
  plates: number;
  score: number;
  rank: number;
  rankChange?: number;
  avatarUrl?: string;
  memberCount: number;
}

export async function getLeaderboard(
  _mode: LeaderboardMode = "daily",
  type: LeaderboardType = "individual",
): Promise<LeaderboardEntry[] | GroupLeaderboardEntry[]> {
  if (type === "group") return [];
  return [];
}

export async function getGroupLeaderboard(_partyId: string): Promise<GroupLeaderboardEntry[]> {
  return [];
}
