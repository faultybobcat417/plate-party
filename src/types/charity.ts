export type CharityCategory =
  | "all"
  | "education"
  | "health"
  | "environment"
  | "hunger"
  | "animals"
  | "disaster";

export interface CharityOrg {
  id: string;
  name: string;
  description: string;
  category: Exclude<CharityCategory, "all">;
  emoji: string;
  impactMetric: string;
  totalRaised: number;
  color: string;
}

export interface CharitySelection {
  charityId: string;
  selectedAt: string;
}
