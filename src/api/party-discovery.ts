import { createDefaultHlc, createUuid } from "../db/schema";
import type { JsonObject } from "../db/schema";
import { enqueueMutation } from "./sync";
import { loadProfile } from "../utils/profileStorage";

export type PartyVibe = "competitive" | "casual" | "charity" | "high-stakes";

export type PublicParty = {
  id: string;
  name: string;
  description: string;
  hostName: string;
  hostImage: string;
  hostProfilePic: string;
  plateStakes: number;
  memberCount: number;
  maxMembers: number;
  vibe: PartyVibe;
  location: string;
  isPublic: boolean;
};

export type PartyFilters = {
  vibe?: PartyVibe;
  location?: string;
  minPlates?: number;
  maxPlates?: number;
};

const MOCK_PUBLIC_PARTIES: PublicParty[] = [
  {
    id: "pub-1",
    name: "Friday Night Poker",
    description:
      "High stakes Texas Hold'em. Bring your A-game and your best poker face.",
    hostName: "Alex",
    hostImage: "🎰",
    hostProfilePic: "🧔",
    plateStakes: 500,
    memberCount: 12,
    maxMembers: 20,
    vibe: "competitive",
    location: "Toronto",
    isPublic: true,
  },
  {
    id: "pub-2",
    name: "Sunday Brunch Bets",
    description:
      "Casual wagers on who can eat the most pancakes. Loser buys coffee!",
    hostName: "Maya",
    hostImage: "🥞",
    hostProfilePic: "👩",
    plateStakes: 50,
    memberCount: 8,
    maxMembers: 15,
    vibe: "casual",
    location: "Montreal",
    isPublic: true,
  },
  {
    id: "pub-3",
    name: "Charity Basketball Showdown",
    description:
      "Pickup game with all plate stakes going to the winning team's charity.",
    hostName: "Jordan",
    hostImage: "🏀",
    hostProfilePic: "🤝",
    plateStakes: 100,
    memberCount: 10,
    maxMembers: 24,
    vibe: "charity",
    location: "Vancouver",
    isPublic: true,
  },
  {
    id: "pub-4",
    name: "VIP Crypto Watch Party",
    description:
      "High-stakes predictions on BTC, ETH, and SOL price action. Whales welcome.",
    hostName: "Devin",
    hostImage: "📈",
    hostProfilePic: "🕶️",
    plateStakes: 2500,
    memberCount: 18,
    maxMembers: 25,
    vibe: "high-stakes",
    location: "Global",
    isPublic: true,
  },
  {
    id: "pub-5",
    name: "Trivia Thunderdome",
    description:
      "General knowledge battles. 3 rounds, 10 questions each. Winner takes the pot.",
    hostName: "Priya",
    hostImage: "🧠",
    hostProfilePic: "📚",
    plateStakes: 200,
    memberCount: 24,
    maxMembers: 30,
    vibe: "competitive",
    location: "Ottawa",
    isPublic: true,
  },
  {
    id: "pub-6",
    name: "Backyard BBQ Predictions",
    description:
      "Casual guesses on grill times, weather, and who burns the burgers.",
    hostName: "Chris",
    hostImage: "🍔",
    hostProfilePic: "🧢",
    plateStakes: 25,
    memberCount: 6,
    maxMembers: 12,
    vibe: "casual",
    location: "Calgary",
    isPublic: true,
  },
  {
    id: "pub-7",
    name: "Marathon Charity Pool",
    description:
      "Bet on race finishers while raising plates for local food banks.",
    hostName: "Sarah",
    hostImage: "🏃",
    hostProfilePic: "❤️",
    plateStakes: 150,
    memberCount: 32,
    maxMembers: 50,
    vibe: "charity",
    location: "Halifax",
    isPublic: true,
  },
  {
    id: "pub-8",
    name: "Presidential Debate Duel",
    description:
      "High-stakes political predictions. Fact-checks and friendly fire included.",
    hostName: "Riley",
    hostImage: "🏛️",
    hostProfilePic: "🎩",
    plateStakes: 1000,
    memberCount: 45,
    maxMembers: 60,
    vibe: "high-stakes",
    location: "Washington",
    isPublic: true,
  },
];

function matchesFilters(party: PublicParty, filters: PartyFilters): boolean {
  if (filters.vibe && party.vibe !== filters.vibe) return false;
  if (
    filters.location &&
    !party.location.toLowerCase().includes(filters.location.toLowerCase())
  )
    return false;
  if (filters.minPlates !== undefined && party.plateStakes < filters.minPlates)
    return false;
  if (filters.maxPlates !== undefined && party.plateStakes > filters.maxPlates)
    return false;
  return true;
}

function matchesQuery(party: PublicParty, query: string): boolean {
  const normalized = query.toLowerCase().trim();
  if (normalized.length === 0) return true;

  return (
    party.name.toLowerCase().includes(normalized) ||
    party.description.toLowerCase().includes(normalized) ||
    party.location.toLowerCase().includes(normalized) ||
    party.hostName.toLowerCase().includes(normalized)
  );
}

export async function listPublicParties(
  filters?: PartyFilters,
): Promise<PublicParty[]> {
  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  let results = [...MOCK_PUBLIC_PARTIES];

  if (filters) {
    results = results.filter((party) => matchesFilters(party, filters));
  }

  return results;
}

export async function searchPublicParties(
  query: string,
  filters?: PartyFilters,
): Promise<PublicParty[]> {
  const parties = await listPublicParties(filters);
  return parties.filter((party) => matchesQuery(party, query));
}

export async function joinParty(
  partyId: string,
  deviceId?: string,
): Promise<{ success: boolean; platesDeducted?: number }> {
  await new Promise((resolve) => {
    setTimeout(resolve, 400);
  });

  const resolvedDeviceId = deviceId ?? (await loadProfile())?.deviceId ?? createUuid();
  const hlc = createDefaultHlc();

  await enqueueMutation({
    tableName: "party_members",
    recordId: createUuid(),
    operation: "insert",
    payload: { partyId, joinedAt: new Date().toISOString() } as JsonObject,
    deviceId: resolvedDeviceId,
    baseHlc: null,
    hlc,
  });

  return { success: true };
}

export async function superRequestParty(
  partyId: string,
  deviceId?: string,
): Promise<{ success: boolean; platesDeducted: number }> {
  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });

  const resolvedDeviceId = deviceId ?? (await loadProfile())?.deviceId ?? createUuid();
  const hlc = createDefaultHlc();
  const platesDeducted = 5;

  await enqueueMutation({
    tableName: "party_members",
    recordId: createUuid(),
    operation: "insert",
    payload: {
      partyId,
      type: "super-request",
      platesDeducted,
      joinedAt: new Date().toISOString(),
    } as JsonObject,
    deviceId: resolvedDeviceId,
    baseHlc: null,
    hlc,
  });

  return { success: true, platesDeducted };
}
