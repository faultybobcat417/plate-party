export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  plates: number;
  avatar: string;
  streak: number;
  rankChange: number;
};

export type GroupLeaderboardEntry = {
  rank: number;
  groupId: string;
  name: string;
  plates: number;
  memberCount: number;
  rankChange: number;
};

export type LeaderboardMode = "daily" | "monthly";
export type LeaderboardType = "individual" | "group";

const MOCK_LEADERBOARD_INDIVIDUAL_DAILY: LeaderboardEntry[] = [
  { rank: 1, userId: "u-1", name: "Sarah", plates: 2450, avatar: "👩", streak: 5, rankChange: 0 },
  { rank: 2, userId: "u-2", name: "Mike", plates: 1890, avatar: "👨", streak: 3, rankChange: +2 },
  { rank: 3, userId: "u-3", name: "Jessica", plates: 1720, avatar: "👱‍♀️", streak: 7, rankChange: -1 },
  { rank: 4, userId: "u-4", name: "Jordan", plates: 1580, avatar: "🧑", streak: 2, rankChange: +5 },
  { rank: 5, userId: "u-5", name: "Priya", plates: 1450, avatar: "👩‍💼", streak: 4, rankChange: -2 },
  { rank: 6, userId: "u-6", name: "Chris", plates: 1320, avatar: "👨", streak: 1, rankChange: +1 },
  { rank: 7, userId: "u-7", name: "Tara", plates: 1280, avatar: "👩‍🦰", streak: 6, rankChange: 0 },
  { rank: 8, userId: "u-8", name: "Devin", plates: 1150, avatar: "🧑‍💻", streak: 2, rankChange: +3 },
  { rank: 9, userId: "u-9", name: "Riley", plates: 980, avatar: "🧑", streak: 3, rankChange: -1 },
  { rank: 10, userId: "u-10", name: "Sam", plates: 890, avatar: "👨", streak: 1, rankChange: +4 },
  { rank: 11, userId: "u-11", name: "Maya", plates: 840, avatar: "👩", streak: 2, rankChange: 0 },
  { rank: 12, userId: "u-12", name: "Leo", plates: 780, avatar: "👨", streak: 5, rankChange: -3 },
  { rank: 13, userId: "u-13", name: "Zoe", plates: 720, avatar: "👩", streak: 1, rankChange: +1 },
  { rank: 14, userId: "u-14", name: "Noah", plates: 650, avatar: "👨", streak: 4, rankChange: 0 },
  { rank: 15, userId: "u-15", name: "Emma", plates: 610, avatar: "👩", streak: 3, rankChange: -1 },
  { rank: 16, userId: "u-16", name: "Liam", plates: 580, avatar: "👨", streak: 2, rankChange: +2 },
  { rank: 17, userId: "u-17", name: "Ava", plates: 540, avatar: "👩", streak: 1, rankChange: 0 },
  { rank: 18, userId: "u-18", name: "Ethan", plates: 490, avatar: "👨", streak: 6, rankChange: -2 },
  { rank: 19, userId: "u-19", name: "Olivia", plates: 460, avatar: "👩", streak: 2, rankChange: +1 },
  { rank: 20, userId: "u-20", name: "Mason", plates: 420, avatar: "👨", streak: 3, rankChange: 0 },
  { rank: 21, userId: "u-21", name: "Sophia", plates: 390, avatar: "👩", streak: 1, rankChange: +3 },
  { rank: 22, userId: "u-22", name: "Lucas", plates: 350, avatar: "👨", streak: 4, rankChange: -1 },
  { rank: 23, userId: "u-23", name: "Isabella", plates: 310, avatar: "👩", streak: 2, rankChange: 0 },
  { rank: 24, userId: "u-24", name: "Benjamin", plates: 280, avatar: "👨", streak: 1, rankChange: +5 },
  { rank: 25, userId: "u-25", name: "Mia", plates: 250, avatar: "👩", streak: 5, rankChange: -2 },
  { rank: 26, userId: "u-26", name: "James", plates: 220, avatar: "👨", streak: 2, rankChange: 0 },
  { rank: 27, userId: "u-27", name: "Charlotte", plates: 190, avatar: "👩", streak: 3, rankChange: +1 },
  { rank: 28, userId: "u-28", name: "Henry", plates: 160, avatar: "👨", streak: 1, rankChange: -1 },
  { rank: 29, userId: "u-29", name: "Amelia", plates: 130, avatar: "👩", streak: 4, rankChange: 0 },
  { rank: 30, userId: "u-30", name: "Daniel", plates: 100, avatar: "👨", streak: 2, rankChange: +2 },
];

const MOCK_LEADERBOARD_INDIVIDUAL_MONTHLY: LeaderboardEntry[] =
  MOCK_LEADERBOARD_INDIVIDUAL_DAILY.map((entry, index) => ({
    ...entry,
    plates: entry.plates * 6 + index * 50,
    rankChange: index % 3 === 0 ? +3 : index % 3 === 1 ? -1 : 0,
  }));

const MOCK_LEADERBOARD_GROUP_DAILY: GroupLeaderboardEntry[] = [
  { rank: 1, groupId: "g-1", name: "The Sharks", plates: 12000, memberCount: 8, rankChange: 0 },
  { rank: 2, groupId: "g-2", name: "Weekend Warriors", plates: 9800, memberCount: 12, rankChange: +1 },
  { rank: 3, groupId: "g-3", name: "Bet Squad", plates: 8500, memberCount: 6, rankChange: -1 },
  { rank: 4, groupId: "g-4", name: "Risk Takers", plates: 7200, memberCount: 10, rankChange: +2 },
  { rank: 5, groupId: "g-5", name: "High Rollers", plates: 6400, memberCount: 15, rankChange: 0 },
  { rank: 6, groupId: "g-6", name: "The Underdogs", plates: 5600, memberCount: 7, rankChange: -2 },
  { rank: 7, groupId: "g-7", name: "Wager Warriors", plates: 4800, memberCount: 9, rankChange: +1 },
  { rank: 8, groupId: "g-8", name: "Lucky Charms", plates: 4200, memberCount: 5, rankChange: 0 },
  { rank: 9, groupId: "g-9", name: "The Prophets", plates: 3800, memberCount: 11, rankChange: +3 },
  { rank: 10, groupId: "g-10", name: "All In", plates: 3200, memberCount: 8, rankChange: -1 },
];

const MOCK_LEADERBOARD_GROUP_MONTHLY: GroupLeaderboardEntry[] =
  MOCK_LEADERBOARD_GROUP_DAILY.map((entry, index) => ({
    ...entry,
    plates: entry.plates * 5 + index * 100,
    rankChange: index % 2 === 0 ? +2 : -1,
  }));

export async function getLeaderboard(
  mode: LeaderboardMode,
  type: LeaderboardType,
): Promise<LeaderboardEntry[] | GroupLeaderboardEntry[]> {
  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  if (type === "individual") {
    return mode === "daily"
      ? [...MOCK_LEADERBOARD_INDIVIDUAL_DAILY]
      : [...MOCK_LEADERBOARD_INDIVIDUAL_MONTHLY];
  }

  return mode === "daily"
    ? [...MOCK_LEADERBOARD_GROUP_DAILY]
    : [...MOCK_LEADERBOARD_GROUP_MONTHLY];
}

export function findUserRank(
  entries: LeaderboardEntry[],
  userId: string | null,
): number | null {
  if (!userId) return null;
  const entry = entries.find((e) => e.userId === userId);
  return entry?.rank ?? null;
}

export function findGroupRank(
  entries: GroupLeaderboardEntry[],
  groupId: string | null,
): number | null {
  if (!groupId) return null;
  const entry = entries.find((e) => e.groupId === groupId);
  return entry?.rank ?? null;
}

export function getGapToNextRank(
  entries: LeaderboardEntry[] | GroupLeaderboardEntry[],
  rank: number,
): number | null {
  const current = entries.find((entry) => entry.rank === rank);
  const next = entries.find((entry) => entry.rank === rank - 1);

  if (!current || !next) return null;
  return next.plates - current.plates;
}
