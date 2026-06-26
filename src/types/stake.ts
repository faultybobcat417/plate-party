export interface StakeEntry {
  id: string;
  userId: string;
  userName: string;
}

export interface StakeCompetition {
  id: string;
  title: string;
  description: string;
  entryFee: number;
  prize: number;
  creatorId: string;
  status: 'open' | 'closed';
  entries: StakeEntry[];
}