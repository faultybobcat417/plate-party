export type DatingStats = {
  likesSent: number;
  likesReceived: number;
  matches: number;
  profileViews: number;
};

export type Match = {
  id: string;
  userId: string;
  displayName: string;
  matchedAt: string;
};

export type DatingHistoryEntry = {
  id: string;
  postId: string;
  action: "like" | "comment" | "dm";
  createdAt: string;
};

export type MeatAnalytics = {
  views: number;
  interactions: number;
};

export async function trackMeatView(_meatId: string): Promise<void> {}

export async function getMeatAnalytics(_meatId: string): Promise<MeatAnalytics> {
  return { views: 0, interactions: 0 };
}

export async function getMyDatingStats(_userId: string): Promise<DatingStats> {
  return { likesSent: 0, likesReceived: 0, matches: 0, profileViews: 0 };
}

export async function getMyMatches(_userId: string): Promise<Match[]> {
  return [];
}

export async function getDatingHistory(_userId: string): Promise<DatingHistoryEntry[]> {
  return [];
}
