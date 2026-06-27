export interface StakePost {
  id: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  amount: number;
  odds: number;
  createdAt: string;
  status: "open" | "closed" | "resolved";
  totalBets: number;
}

export async function getStakePosts(): Promise<StakePost[]> {
  return [];
}
