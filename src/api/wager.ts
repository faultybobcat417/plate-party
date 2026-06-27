import * as Crypto from "expo-crypto";

export interface Wager {
  id: string;
  creatorId?: string;
  createdByUserId: string;
  partyId: string;
  title?: string;
  question: string;
  description?: string;
  stakeAmount: number;
  stakePlates: number;
  status: "open" | "closed" | "locked" | "resolved" | "void";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deadline: Date | null;
  winningOptionId: string | null;
  oracleType: string;
  oracleStatus: string;
  naPolicy: string;
  naPenaltyPlates: number;
  resolutionKind: string | null;
  resolutionNote: string | null;
  hlc: string | null;
  lastModifiedByDeviceId: string | null;
  resolvedAt: Date | null;
  winnerId?: string;
}

export type WagerOption = {
  id: string;
  wagerId: string;
  label: string;
  sortOrder: number;
  createdAt: Date;
};

export type CreateWagerInput = {
  partyId: string;
  createdByUserId: string;
  deviceId: string;
  question: string;
  options: Array<{ label: string }>;
  stakePlates: number;
  deadline: string;
  oracleType: "manual" | "weather" | "crypto";
};

export type WagerWithOptions = {
  wager: Wager;
  options: WagerOption[];
};

export async function createWager(input: CreateWagerInput): Promise<WagerWithOptions> {
  const wagerId = Crypto.randomUUID();
  const wager: Wager = {
    id: wagerId,
    creatorId: input.createdByUserId,
    createdByUserId: input.createdByUserId,
    partyId: input.partyId,
    title: input.question,
    question: input.question,
    stakeAmount: input.stakePlates,
    stakePlates: input.stakePlates,
    status: "open",
    deadline: new Date(input.deadline),
    winningOptionId: null,
    oracleType: input.oracleType,
    oracleStatus: "not_required",
    naPolicy: "refund",
    naPenaltyPlates: 0,
    resolutionKind: null,
    resolutionNote: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    hlc: null,
    lastModifiedByDeviceId: input.deviceId,
  };

  return {
    wager,
    options: input.options.map((option, index) => ({
      id: Crypto.randomUUID(),
      wagerId,
      label: option.label,
      sortOrder: index,
      createdAt: new Date(),
    })),
  };
}

export type ResolveWagerInput = {
  wagerId: string;
  winningOptionId?: string;
  resolvedByUserId?: string;
  deviceId?: string;
};

export async function resolveWager(input: ResolveWagerInput): Promise<void>;
export async function resolveWager(wagerId: string, winnerId: string): Promise<void>;
export async function resolveWager(_inputOrWagerId: ResolveWagerInput | string, _winnerId?: string): Promise<void> {}

export async function getWagerById(_wagerId: string): Promise<Wager | null> {
  return null;
}

export async function getUserWagers(_userId: string): Promise<Wager[]> {
  return [];
}

export async function getWagerWithOptions(wagerId: string): Promise<WagerWithOptions | null> {
  const wager = await getWagerById(wagerId);
  return wager ? { wager, options: [] } : null;
}

export async function getActiveWagerForParty(_partyId: string): Promise<WagerWithOptions | null> {
  return null;
}
