export type PartyVibe = "casual" | "competitive" | "social" | "charity" | "high-stakes";

export interface PartyFilters {
  query?: string;
  vibe?: PartyVibe;
  isPublic?: boolean;
  maxMembers?: number;
  minPlates?: number;
  maxPlates?: number;
  location?: string;
}

export interface PublicParty {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  inviteCode?: string;
  createdAt: string;
  vibe: PartyVibe;
  hostImage?: string;
  hostProfilePic?: string;
  hostName?: string;
  plateStakes?: number;
  location?: string;
}

export async function discoverPublicParties(_filters?: PartyFilters): Promise<PublicParty[]> {
  return [];
}

export async function searchParties(_query: string): Promise<PublicParty[]> {
  return [];
}

export async function listPublicParties(filters?: PartyFilters): Promise<PublicParty[]> {
  return discoverPublicParties(filters);
}

export async function searchPublicParties(
  query: string,
  filters?: PartyFilters,
): Promise<PublicParty[]> {
  return discoverPublicParties({ ...filters, query });
}

export async function joinParty(_partyId: string, _userId: string): Promise<void> {}

export async function superRequestParty(_partyId: string, _userId: string): Promise<void> {}
