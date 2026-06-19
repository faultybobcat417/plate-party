import { and, desc, eq, isNull } from "drizzle-orm";

import { getDb, openSQLiteDatabase } from "../db/connection";
import {
  createDefaultHlc,
  createUuid,
  INITIAL_MEMBER_PLATES,
  parties,
  partyMembers,
  type JsonObject,
  type NewParty,
  type Party,
  type PartyMember,
  type PartyMemberRole,
  type Uuid,
} from "../db/schema";
import { enqueueMutation } from "./sync";

export type CreatePartyInput = {
  name: string;
  charityOrgName: string;
  createdByUserId: Uuid;
  deviceId: string;
  charityOrgUrl?: string | null;
  realMoneyEnabled?: boolean;
  defaultStakePlates?: number;
  inviteCode?: string;
};

export type UpdatePartyInput = {
  partyId: Uuid;
  deviceId: string;
  name?: string;
  charityOrgName?: string;
  charityOrgUrl?: string | null;
  realMoneyEnabled?: boolean;
  defaultStakePlates?: number;
  nextWagerPickerUserId?: Uuid | null;
};

export type JoinPartyInput = {
  inviteCode: string;
  userId: Uuid;
  deviceId: string;
};

export type PartyWithMembership = {
  party: Party;
  membership: PartyMember;
};

export type PartyMemberWithUser = PartyMember & {
  displayName: string;
  avatarColor: string;
};

type PartyMemberWithUserRow = {
  party_id: string;
  user_id: string;
  role: PartyMemberRole;
  plate_balance: number;
  reserved_plate_balance: number;
  current_streak: number;
  longest_streak: number;
  total_wins: number;
  total_losses: number;
  total_plates_wagered: number;
  joined_at: string;
  left_at: string | null;
  updated_at: string;
  deleted_at: string | null;
  hlc: string;
  last_modified_by_device_id: string | null;
  display_name: string;
  avatar_color: string;
};

const partySelectColumns = `
  id,
  name,
  invite_code as inviteCode,
  charity_org_name as charityOrgName,
  charity_org_url as charityOrgUrl,
  charity_pool_plates as charityPoolPlates,
  real_money_enabled as realMoneyEnabled,
  default_stake_plates as defaultStakePlates,
  created_by_user_id as createdByUserId,
  next_wager_picker_user_id as nextWagerPickerUserId,
  created_at as createdAt,
  updated_at as updatedAt,
  archived_at as archivedAt,
  deleted_at as deletedAt,
  hlc,
  last_modified_by_device_id as lastModifiedByDeviceId
`;

const memberSelectColumns = `
  party_id as partyId,
  user_id as userId,
  role,
  plate_balance as plateBalance,
  reserved_plate_balance as reservedPlateBalance,
  current_streak as currentStreak,
  longest_streak as longestStreak,
  total_wins as totalWins,
  total_losses as totalLosses,
  total_plates_wagered as totalPlatesWagered,
  joined_at as joinedAt,
  left_at as leftAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  hlc,
  last_modified_by_device_id as lastModifiedByDeviceId
`;

export class PartyApiError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "PartyApiError";
    this.cause = cause;
  }
}

const toPartyApiError = (message: string, error: unknown): PartyApiError => {
  if (error instanceof PartyApiError) {
    return error;
  }

  return new PartyApiError(message, error);
};

const now = (): string => new Date().toISOString();

const sanitizeName = (value: string, label: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new PartyApiError(`${label} is required.`);
  }

  return trimmed;
};

const assertPositiveInteger = (value: number, label: string): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new PartyApiError(`${label} must be a positive integer.`);
  }
};

export const normalizeInviteCode = (inviteCode: string): string =>
  inviteCode.replace(/[^a-z0-9]/gi, "").toUpperCase();

export const generateInviteCode = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
};

const partyToPayload = (party: Party): JsonObject => ({
  id: party.id,
  name: party.name,
  inviteCode: party.inviteCode,
  charityOrgName: party.charityOrgName,
  charityOrgUrl: party.charityOrgUrl,
  charityPoolPlates: party.charityPoolPlates,
  realMoneyEnabled: party.realMoneyEnabled,
  defaultStakePlates: party.defaultStakePlates,
  createdByUserId: party.createdByUserId,
  nextWagerPickerUserId: party.nextWagerPickerUserId,
  createdAt: party.createdAt,
  updatedAt: party.updatedAt,
  archivedAt: party.archivedAt,
  deletedAt: party.deletedAt,
  hlc: party.hlc,
  lastModifiedByDeviceId: party.lastModifiedByDeviceId,
});

const memberToPayload = (member: PartyMember): JsonObject => ({
  partyId: member.partyId,
  userId: member.userId,
  role: member.role,
  plateBalance: member.plateBalance,
  reservedPlateBalance: member.reservedPlateBalance,
  currentStreak: member.currentStreak,
  longestStreak: member.longestStreak,
  totalWins: member.totalWins,
  totalLosses: member.totalLosses,
  totalPlatesWagered: member.totalPlatesWagered,
  joinedAt: member.joinedAt,
  leftAt: member.leftAt,
  updatedAt: member.updatedAt,
  deletedAt: member.deletedAt,
  hlc: member.hlc,
  lastModifiedByDeviceId: member.lastModifiedByDeviceId,
});

const rowToMemberWithUser = (
  row: PartyMemberWithUserRow,
): PartyMemberWithUser => ({
  partyId: row.party_id,
  userId: row.user_id,
  role: row.role,
  plateBalance: row.plate_balance,
  reservedPlateBalance: row.reserved_plate_balance,
  currentStreak: row.current_streak,
  longestStreak: row.longest_streak,
  totalWins: row.total_wins,
  totalLosses: row.total_losses,
  totalPlatesWagered: row.total_plates_wagered,
  joinedAt: row.joined_at,
  leftAt: row.left_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
  hlc: row.hlc,
  lastModifiedByDeviceId: row.last_modified_by_device_id,
  displayName: row.display_name,
  avatarColor: row.avatar_color,
});

export const createParty = async (
  input: CreatePartyInput,
): Promise<PartyWithMembership> => {
  try {
    const name = sanitizeName(input.name, "Party name");
    const charityOrgName = sanitizeName(input.charityOrgName, "Charity name");
    const defaultStakePlates = input.defaultStakePlates ?? 1;
    assertPositiveInteger(defaultStakePlates, "defaultStakePlates");

    const database = await openSQLiteDatabase();
    const partyId = createUuid();
    const inviteCode = normalizeInviteCode(input.inviteCode ?? generateInviteCode());
    const timestamp = now();
    const partyHlc = createDefaultHlc();
    const memberHlc = createDefaultHlc();
    let createdParty: Party | null = null;
    let membership: PartyMember | null = null;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        await transaction.runAsync(
          `insert into parties (
            id,
            name,
            invite_code,
            charity_org_name,
            charity_org_url,
            charity_pool_plates,
            real_money_enabled,
            default_stake_plates,
            created_by_user_id,
            created_at,
            updated_at,
            hlc,
            last_modified_by_device_id
          ) values (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
          [
            partyId,
            name,
            inviteCode,
            charityOrgName,
            input.charityOrgUrl ?? null,
            input.realMoneyEnabled ? 1 : 0,
            defaultStakePlates,
            input.createdByUserId,
            timestamp,
            timestamp,
            partyHlc,
            input.deviceId,
          ],
        );

        await transaction.runAsync(
          `insert into party_members (
            party_id,
            user_id,
            role,
            plate_balance,
            reserved_plate_balance,
            current_streak,
            longest_streak,
            total_wins,
            total_losses,
            total_plates_wagered,
            joined_at,
            updated_at,
            hlc,
            last_modified_by_device_id
          ) values (?, ?, 'host', ?, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?)`,
          [
            partyId,
            input.createdByUserId,
            INITIAL_MEMBER_PLATES,
            timestamp,
            timestamp,
            memberHlc,
            input.deviceId,
          ],
        );

        createdParty = await transaction.getFirstAsync<Party>(
          `select ${partySelectColumns} from parties where id = ?`,
          partyId,
        );
        membership = await transaction.getFirstAsync<PartyMember>(
          `select ${memberSelectColumns}
           from party_members
           where party_id = ? and user_id = ?`,
          [partyId, input.createdByUserId],
        );

        if (!createdParty || !membership) {
          throw new PartyApiError("Party creation failed to return inserted rows.");
        }

        await enqueueMutation(
          {
            tableName: "parties",
            recordId: partyId,
            operation: "insert",
            payload: partyToPayload(createdParty),
            deviceId: input.deviceId,
            hlc: partyHlc,
          },
          transaction,
        );
        await enqueueMutation(
          {
            tableName: "party_members",
            recordId: `${partyId}:${input.createdByUserId}`,
            operation: "insert",
            payload: memberToPayload(membership),
            deviceId: input.deviceId,
            hlc: memberHlc,
          },
          transaction,
        );
      } catch (error) {
        throw toPartyApiError("Failed during party creation transaction.", error);
      }
    });

    if (!createdParty || !membership) {
      throw new PartyApiError("Party creation did not produce a party and membership.");
    }

    return { party: createdParty, membership };
  } catch (error) {
    throw toPartyApiError("Failed to create party.", error);
  }
};

export const getParty = async (partyId: Uuid): Promise<Party | null> => {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(parties)
      .where(and(eq(parties.id, partyId), isNull(parties.deletedAt)))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    throw toPartyApiError("Failed to read party.", error);
  }
};

export const listPartiesForUser = async (
  userId: Uuid,
): Promise<PartyWithMembership[]> => {
  try {
    const db = await getDb();
    const rows = await db
      .select({
        party: parties,
        membership: partyMembers,
      })
      .from(partyMembers)
      .innerJoin(parties, eq(parties.id, partyMembers.partyId))
      .where(
        and(
          eq(partyMembers.userId, userId),
          isNull(partyMembers.deletedAt),
          isNull(partyMembers.leftAt),
          isNull(parties.deletedAt),
          isNull(parties.archivedAt),
        ),
      )
      .orderBy(desc(parties.updatedAt));

    return rows;
  } catch (error) {
    throw toPartyApiError("Failed to list parties for user.", error);
  }
};

export const getPartyMembers = async (
  partyId: Uuid,
): Promise<PartyMemberWithUser[]> => {
  try {
    const database = await openSQLiteDatabase();
    const rows = await database.getAllAsync<PartyMemberWithUserRow>(
      `select
        pm.party_id,
        pm.user_id,
        pm.role,
        pm.plate_balance,
        pm.reserved_plate_balance,
        pm.current_streak,
        pm.longest_streak,
        pm.total_wins,
        pm.total_losses,
        pm.total_plates_wagered,
        pm.joined_at,
        pm.left_at,
        pm.updated_at,
        pm.deleted_at,
        pm.hlc,
        pm.last_modified_by_device_id,
        u.display_name,
        u.avatar_color
       from party_members pm
       join users u on u.id = pm.user_id
       where pm.party_id = ? and pm.deleted_at is null and pm.left_at is null
       order by pm.role desc, u.display_name asc`,
      partyId,
    );

    return rows.map(rowToMemberWithUser);
  } catch (error) {
    throw toPartyApiError("Failed to list party members.", error);
  }
};

export const getMembership = async (
  partyId: Uuid,
  userId: Uuid,
): Promise<PartyMember | null> => {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(partyMembers)
      .where(
        and(
          eq(partyMembers.partyId, partyId),
          eq(partyMembers.userId, userId),
          isNull(partyMembers.deletedAt),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    throw toPartyApiError("Failed to read party membership.", error);
  }
};

export const previewPartyByInviteCode = async (
  inviteCode: string,
): Promise<Party | null> => {
  try {
    const db = await getDb();
    const normalized = normalizeInviteCode(inviteCode);
    const rows = await db
      .select()
      .from(parties)
      .where(and(eq(parties.inviteCode, normalized), isNull(parties.deletedAt)))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    throw toPartyApiError("Failed to preview party by invite code.", error);
  }
};

export const joinPartyByInviteCode = async (
  input: JoinPartyInput,
): Promise<PartyWithMembership> => {
  try {
    const inviteCode = normalizeInviteCode(input.inviteCode);

    if (inviteCode.length === 0) {
      throw new PartyApiError("Invite code is required.");
    }

    const database = await openSQLiteDatabase();
    const timestamp = now();
    const hlc = createDefaultHlc();
    let party: Party | null = null;
    let membership: PartyMember | null = null;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      try {
        party = await transaction.getFirstAsync<Party>(
          `select ${partySelectColumns}
           from parties
           where invite_code = ? and deleted_at is null
           limit 1`,
          inviteCode,
        );

        if (!party) {
          throw new PartyApiError("Party invite code was not found on this device.");
        }

        const existing = await transaction.getFirstAsync<PartyMember>(
          `select ${memberSelectColumns}
           from party_members
           where party_id = ? and user_id = ?
           limit 1`,
          [party.id, input.userId],
        );

        if (existing && !existing.deletedAt && !existing.leftAt) {
          membership = existing;
          return;
        }

        if (existing) {
          await transaction.runAsync(
            `update party_members
             set role = 'member',
                 plate_balance = ?,
                 reserved_plate_balance = 0,
                 left_at = null,
                 deleted_at = null,
                 joined_at = ?,
                 updated_at = ?,
                 hlc = ?,
                 last_modified_by_device_id = ?
             where party_id = ? and user_id = ?`,
            [
              INITIAL_MEMBER_PLATES,
              timestamp,
              timestamp,
              hlc,
              input.deviceId,
              party.id,
              input.userId,
            ],
          );
        } else {
          await transaction.runAsync(
            `insert into party_members (
              party_id,
              user_id,
              role,
              plate_balance,
              reserved_plate_balance,
              current_streak,
              longest_streak,
              total_wins,
              total_losses,
              total_plates_wagered,
              joined_at,
              updated_at,
              hlc,
              last_modified_by_device_id
            ) values (?, ?, 'member', ?, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?)`,
            [
              party.id,
              input.userId,
              INITIAL_MEMBER_PLATES,
              timestamp,
              timestamp,
              hlc,
              input.deviceId,
            ],
          );
        }

        membership = await transaction.getFirstAsync<PartyMember>(
          `select ${memberSelectColumns}
           from party_members
           where party_id = ? and user_id = ?`,
          [party.id, input.userId],
        );

        if (!membership) {
          throw new PartyApiError("Joining party failed to return membership.");
        }

        await enqueueMutation(
          {
            tableName: "party_members",
            recordId: `${party.id}:${input.userId}`,
            operation: existing ? "update" : "insert",
            payload: memberToPayload(membership),
            deviceId: input.deviceId,
            baseHlc: existing?.hlc ?? null,
            hlc,
          },
          transaction,
        );
      } catch (error) {
        throw toPartyApiError("Failed during party join transaction.", error);
      }
    });

    if (!party || !membership) {
      throw new PartyApiError("Joining party did not produce a party and membership.");
    }

    return { party, membership };
  } catch (error) {
    throw toPartyApiError("Failed to join party by invite code.", error);
  }
};

export const updateParty = async (input: UpdatePartyInput): Promise<Party> => {
  try {
    const existing = await getParty(input.partyId);

    if (!existing) {
      throw new PartyApiError("Party not found.");
    }

    const patch: Partial<NewParty> = {
      updatedAt: now(),
      hlc: createDefaultHlc(),
      lastModifiedByDeviceId: input.deviceId,
    };

    if (input.name !== undefined) {
      patch.name = sanitizeName(input.name, "Party name");
    }

    if (input.charityOrgName !== undefined) {
      patch.charityOrgName = sanitizeName(input.charityOrgName, "Charity name");
    }

    if (input.charityOrgUrl !== undefined) {
      patch.charityOrgUrl = input.charityOrgUrl;
    }

    if (input.realMoneyEnabled !== undefined) {
      patch.realMoneyEnabled = input.realMoneyEnabled;
    }

    if (input.defaultStakePlates !== undefined) {
      assertPositiveInteger(input.defaultStakePlates, "defaultStakePlates");
      patch.defaultStakePlates = input.defaultStakePlates;
    }

    if (input.nextWagerPickerUserId !== undefined) {
      patch.nextWagerPickerUserId = input.nextWagerPickerUserId;
    }

    const db = await getDb();
    const updated = await db
      .update(parties)
      .set(patch)
      .where(eq(parties.id, input.partyId))
      .returning();

    const party = updated[0];

    if (!party) {
      throw new PartyApiError("Party update failed.");
    }

    await enqueueMutation({
      tableName: "parties",
      recordId: party.id,
      operation: "update",
      payload: partyToPayload(party),
      deviceId: input.deviceId,
      baseHlc: existing.hlc,
      hlc: party.hlc,
    });

    return party;
  } catch (error) {
    throw toPartyApiError("Failed to update party.", error);
  }
};

export const archiveParty = async (
  partyId: Uuid,
  deviceId: string,
): Promise<Party> => {
  try {
    const timestamp = now();
    return await updateParty({
      partyId,
      deviceId,
      nextWagerPickerUserId: null,
      name: (await getParty(partyId))?.name ?? "Archived Party",
      charityOrgName: (await getParty(partyId))?.charityOrgName ?? "Charity",
    }).then(async (party) => {
      const db = await getDb();
      const archived = await db
        .update(parties)
        .set({ archivedAt: timestamp, updatedAt: timestamp, hlc: createDefaultHlc() })
        .where(eq(parties.id, partyId))
        .returning();

      const archivedParty = archived[0];

      if (!archivedParty) {
        throw new PartyApiError("Party archive failed.");
      }

      await enqueueMutation({
        tableName: "parties",
        recordId: partyId,
        operation: "update",
        payload: partyToPayload(archivedParty),
        deviceId,
        baseHlc: party.hlc,
        hlc: archivedParty.hlc,
      });

      return archivedParty;
    });
  } catch (error) {
    throw toPartyApiError("Failed to archive party.", error);
  }
};

export const leaveParty = async (
  partyId: Uuid,
  userId: Uuid,
  deviceId: string,
): Promise<PartyMember> => {
  try {
    const existing = await getMembership(partyId, userId);

    if (!existing) {
      throw new PartyApiError("Party membership not found.");
    }

    if (existing.role === "host") {
      const members = await getPartyMembers(partyId);
      const activeHosts = members.filter((member) => member.role === "host");

      if (activeHosts.length <= 1) {
        throw new PartyApiError("A party must have at least one host.");
      }
    }

    const timestamp = now();
    const db = await getDb();
    const updated = await db
      .update(partyMembers)
      .set({
        leftAt: timestamp,
        deletedAt: timestamp,
        updatedAt: timestamp,
        hlc: createDefaultHlc(),
        lastModifiedByDeviceId: deviceId,
      })
      .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)))
      .returning();

    const membership = updated[0];

    if (!membership) {
      throw new PartyApiError("Leaving party failed.");
    }

    await enqueueMutation({
      tableName: "party_members",
      recordId: `${partyId}:${userId}`,
      operation: "delete",
      payload: memberToPayload(membership),
      deviceId,
      baseHlc: existing.hlc,
      hlc: membership.hlc,
    });

    return membership;
  } catch (error) {
    throw toPartyApiError("Failed to leave party.", error);
  }
};

export const setMemberRole = async (
  partyId: Uuid,
  userId: Uuid,
  role: PartyMemberRole,
  deviceId: string,
): Promise<PartyMember> => {
  try {
    const existing = await getMembership(partyId, userId);

    if (!existing) {
      throw new PartyApiError("Party membership not found.");
    }

    const db = await getDb();
    const updated = await db
      .update(partyMembers)
      .set({
        role,
        updatedAt: now(),
        hlc: createDefaultHlc(),
        lastModifiedByDeviceId: deviceId,
      })
      .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)))
      .returning();

    const membership = updated[0];

    if (!membership) {
      throw new PartyApiError("Member role update failed.");
    }

    await enqueueMutation({
      tableName: "party_members",
      recordId: `${partyId}:${userId}`,
      operation: "update",
      payload: memberToPayload(membership),
      deviceId,
      baseHlc: existing.hlc,
      hlc: membership.hlc,
    });

    return membership;
  } catch (error) {
    throw toPartyApiError("Failed to set member role.", error);
  }
};
