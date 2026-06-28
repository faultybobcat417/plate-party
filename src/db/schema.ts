import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  pgPolicy,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import * as Crypto from "expo-crypto";

// Users table (matches auth.users.id)
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().notNull(),
    displayName: text("display_name").notNull().default("Plate Tester"),
    username: text("username").unique(),
    plates: bigint("plates", { mode: "number" }).notNull().default(100),
    lifetimePurchasedPlates: bigint("lifetime_purchased_plates", { mode: "number" }).notNull().default(0),
    deviceId: text("device_id"),
    avatarUrl: text("avatar_url"),
    ageVerified: boolean("age_verified").default(false),
    gdprConsent: boolean("gdpr_consent"),
    pushToken: text("push_token"),
    referredBy: uuid("referred_by"),
    referralCode: text("referral_code").unique(),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_referral_code_idx").on(table.referralCode),
    index("users_referred_by_idx").on(table.referredBy),
    pgPolicy("Users can view their own profile", {
      for: "select",
      to: "authenticated",
      using: sql`${table.id} = auth.uid()`,
    }),
    pgPolicy("Users can update their own profile", {
      for: "update",
      to: "authenticated",
      using: sql`${table.id} = auth.uid()`,
      withCheck: sql`${table.id} = auth.uid()`,
    }),
  ]
);

// Ledger entries (atomic transaction log)
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    amount: bigint("amount", { mode: "number" }).notNull(),
    balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
    type: text("type").notNull(),
    referenceId: text("reference_id"),
    referenceType: text("reference_type"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ledger_user_id_idx").on(table.userId),
    index("ledger_type_idx").on(table.type),
    pgPolicy("Users can view their own ledger", {
      for: "select",
      to: "authenticated",
      using: sql`${table.userId} = auth.uid()`,
    }),
    pgPolicy("No direct inserts to ledger", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`false`,
    }),
  ]
);

// Parties
export const parties = pgTable(
  "parties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    hostId: uuid("host_id").notNull().references(() => users.id),
    inviteCode: text("invite_code").unique(),
    isPrivate: boolean("is_private").notNull().default(false),
    charityPoolPlates: integer("charity_pool_plates").notNull().default(0),
    charityOrgName: text("charity_org_name"),
    charityOrgUrl: text("charity_org_url"),
    defaultStakePlates: integer("default_stake_plates").notNull().default(1),
    realMoneyEnabled: boolean("real_money_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("parties_host_id_idx").on(table.hostId),
    index("parties_invite_code_idx").on(table.inviteCode),
    pgPolicy("Members can view their parties", {
      for: "select",
      to: "authenticated",
      using: sql`
        EXISTS (
          SELECT 1 FROM party_members
          WHERE party_members.party_id = ${table.id}
          AND party_members.user_id = auth.uid()
          AND party_members.deleted_at IS NULL
        ) OR ${table.hostId} = auth.uid()
      `,
    }),
    pgPolicy("Hosts can update their parties", {
      for: "update",
      to: "authenticated",
      using: sql`${table.hostId} = auth.uid()`,
      withCheck: sql`${table.hostId} = auth.uid()`,
    }),
  ]
);

// Party members
export const partyMembers = pgTable(
  "party_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id").notNull().references(() => parties.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    role: text("role").notNull().default("member"),
    plateBalance: integer("plate_balance").notNull().default(0),
    reservedPlateBalance: integer("reserved_plate_balance").notNull().default(0),
    totalPlatesWagered: integer("total_plates_wagered").notNull().default(0),
    totalWins: integer("total_wins").notNull().default(0),
    totalLosses: integer("total_losses").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("party_members_unique_idx").on(table.partyId, table.userId),
    pgPolicy("Users can view their own memberships", {
      for: "select",
      to: "authenticated",
      using: sql`${table.userId} = auth.uid()`,
    }),
    pgPolicy("Users can update their own membership", {
      for: "update",
      to: "authenticated",
      using: sql`${table.userId} = auth.uid()`,
      withCheck: sql`${table.userId} = auth.uid()`,
    }),
  ]
);

// Challenges (public + private goals)
export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id").notNull().references(() => users.id),
    partyId: uuid("party_id").references(() => parties.id),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull().default("public"),
    stakeAmount: bigint("stake_amount", { mode: "number" }).notNull().default(0),
    rewardAmount: bigint("reward_amount", { mode: "number" }).notNull().default(0),
    status: text("status").notNull().default("open"),
    oracleType: text("oracle_type").notNull().default("manual"),
    winnerUserId: uuid("winner_user_id").references(() => users.id),
    charityAmount: bigint("charity_amount", { mode: "number" }).default(0),
    totalPot: bigint("total_pot", { mode: "number" }).default(0),
    category: text("category").default("trivia"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    proofRequired: boolean("proof_required").notNull().default(true),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("challenges_creator_id_idx").on(table.creatorId),
    index("challenges_status_idx").on(table.status),
    index("challenges_party_id_idx").on(table.partyId),
    index("challenges_party_status_idx").on(table.partyId, table.status),
    index("challenges_winner_idx").on(table.winnerUserId),
    pgPolicy("Party members can view party challenges", {
      for: "select",
      to: "authenticated",
      using: sql`${table.partyId} IS NULL OR EXISTS (
        SELECT 1 FROM party_members
        WHERE party_members.party_id = ${table.partyId}
        AND party_members.user_id = auth.uid()
        AND party_members.deleted_at IS NULL
      ) OR ${table.creatorId} = auth.uid()`,
    }),
    pgPolicy("Authenticated users can create challenges", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`true`,
    }),
    pgPolicy("Creators can update their open challenges", {
      for: "update",
      to: "authenticated",
      using: sql`${table.creatorId} = auth.uid() AND ${table.status} = 'open'`,
      withCheck: sql`${table.creatorId} = auth.uid()`,
    }),
  ]
);

// Challenge options (multiple choice answers)
export const challengeOptions = pgTable(
  "challenge_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isCorrect: boolean("is_correct").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("challenge_options_challenge_id_idx").on(table.challengeId),
    pgPolicy("Anyone can view challenge options", {
      for: "select",
      to: "authenticated",
      using: sql`EXISTS (
        SELECT 1 FROM challenges
        WHERE challenges.id = ${table.challengeId}
        AND (challenges.creatorId = auth.uid() OR
        EXISTS (
          SELECT 1 FROM party_members
          WHERE party_members.party_id = challenges.party_id
          AND party_members.user_id = auth.uid()
          AND party_members.deleted_at IS NULL
        ))
      )`,
    }),
    pgPolicy("Creators can insert challenge options", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`EXISTS (
        SELECT 1 FROM challenges
        WHERE challenges.id = ${table.challengeId}
        AND challenges.creator_id = auth.uid()
      )`,
    }),
  ]
);

// Challenge entries (was bets)
export const challengeEntries = pgTable(
  "challenge_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    stakeAmount: bigint("stake_amount", { mode: "number" }).notNull().default(0),
    chosenOption: uuid("chosen_option").references(() => challengeOptions.id),
    gameScore: integer("game_score"),
    gameSessionId: uuid("game_session_id").references(() => gameSessions.id),
    status: text("status").notNull().default("pending"),
    proofUrl: text("proof_url"),
    proofSubmittedAt: timestamp("proof_submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("challenge_entries_unique_idx").on(table.challengeId, table.userId),
    index("challenge_entries_user_id_idx").on(table.userId),
    index("challenge_entries_option_idx").on(table.chosenOption),
    index("challenge_entries_game_session_idx").on(table.gameSessionId),
    pgPolicy("Users can view challenge entries they participate in", {
      for: "select",
      to: "authenticated",
      using: sql`${table.userId} = auth.uid() OR EXISTS (
        SELECT 1 FROM challenges
        WHERE challenges.id = ${table.challengeId}
        AND challenges.creator_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM challenges c
        JOIN party_members pm ON pm.party_id = c.party_id
        WHERE c.id = ${table.challengeId}
        AND pm.user_id = auth.uid()
        AND pm.deleted_at IS NULL
      )`,
    }),
    pgPolicy("Users can create their own entries", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`${table.userId} = auth.uid()`,
    }),
  ]
);

// Predictions (was wagers)
export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id").notNull().references(() => users.id),
    partyId: uuid("party_id").references(() => parties.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("open"),
    resolvedOutcome: text("resolved_outcome"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("predictions_creator_id_idx").on(table.creatorId),
    index("predictions_party_id_idx").on(table.partyId),
  ]
);

// Prediction options
export const predictionOptions = pgTable(
  "prediction_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    predictionId: uuid("prediction_id").notNull().references(() => predictions.id),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("prediction_options_prediction_id_idx").on(table.predictionId),
  ]
);

// Prediction entries (was bets)
export const predictionEntries = pgTable(
  "prediction_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    predictionId: uuid("prediction_id").notNull().references(() => predictions.id),
    optionId: uuid("option_id").notNull().references(() => predictionOptions.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    stakeAmount: bigint("stake_amount", { mode: "number" }).notNull().default(0),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("prediction_entries_unique_idx").on(table.predictionId, table.userId),
    index("prediction_entries_user_id_idx").on(table.userId),
  ]
);

// Legacy local wager tables kept for compatibility with the SQLite-era screens.
export const wagers = pgTable(
  "wagers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id").notNull().references(() => parties.id),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
    question: text("question").notNull(),
    stakePlates: integer("stake_plates").notNull().default(1),
    status: text("status").notNull().default("open"),
    winningOptionId: uuid("winning_option_id"),
    deadline: timestamp("deadline", { withTimezone: true }),
    oracleType: text("oracle_type").notNull().default("manual"),
    oracleStatus: text("oracle_status").notNull().default("not_required"),
    naPolicy: text("na_policy").notNull().default("refund"),
    naPenaltyPlates: integer("na_penalty_plates").notNull().default(0),
    resolutionKind: text("resolution_kind"),
    resolutionNote: text("resolution_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    hlc: text("hlc"),
    lastModifiedByDeviceId: text("last_modified_by_device_id"),
  },
  (table) => [
    index("wagers_party_status_deadline_idx").on(table.partyId, table.status, table.deadline),
    index("wagers_created_by_user_id_idx").on(table.createdByUserId),
  ]
);

export const wagerOptions = pgTable(
  "wager_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wagerId: uuid("wager_id").notNull().references(() => wagers.id),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("wager_options_wager_id_idx").on(table.wagerId),
  ]
);

export const bets = pgTable(
  "bets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wagerId: uuid("wager_id").notNull().references(() => wagers.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    optionId: uuid("option_id").notNull(),
    platesWagered: integer("plates_wagered").notNull(),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    hlc: text("hlc"),
    lastModifiedByDeviceId: text("last_modified_by_device_id"),
  },
  (table) => [
    uniqueIndex("bets_wager_user_unique").on(table.wagerId, table.userId),
    index("bets_wager_status_idx").on(table.wagerId, table.status),
    index("bets_user_id_idx").on(table.userId),
  ]
);

export const poolTransactions = pgTable(
  "pool_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id").notNull().references(() => parties.id),
    wagerId: uuid("wager_id").references(() => wagers.id),
    fromUserId: uuid("from_user_id").references(() => users.id),
    plateAmount: integer("plate_amount").notNull(),
    reason: text("reason").notNull(),
    note: text("note"),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    hlc: text("hlc"),
    lastModifiedByDeviceId: text("last_modified_by_device_id"),
  },
  (table) => [
    index("pool_transactions_party_timestamp_idx").on(table.partyId, table.timestamp),
    index("pool_transactions_wager_id_idx").on(table.wagerId),
  ]
);

// Game sessions (anti-cheat)
export const gameSessions = pgTable(
  "game_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    challengeId: uuid("challenge_id").references(() => challenges.id),
    gameType: text("game_type").notNull(),
    score: integer("score").notNull().default(0),
    answers: jsonb("answers").default([]),
    timeTakenMs: integer("time_taken_ms"),
    status: text("status").notNull().default("playing"),
    flaggedReason: text("flagged_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("game_sessions_user_id_idx").on(table.userId),
    index("game_sessions_status_idx").on(table.status),
    index("game_sessions_challenge_idx").on(table.challengeId),
  ]
);

// Sync outbox (deprecated but kept for compatibility)
export const syncOutbox = pgTable(
  "sync_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    tableName: text("table_name").notNull(),
    operation: text("operation").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("sync_outbox_user_id_idx").on(table.userId),
    index("sync_outbox_created_at_idx").on(table.createdAt),
  ]
);

// IAP receipts
export const iapReceipts = pgTable(
  "iap_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    productId: text("product_id").notNull(),
    transactionId: text("transaction_id").notNull().unique(),
    receiptData: text("receipt_data"),
    platesAdded: bigint("plates_added", { mode: "number" }).notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
  },
  (table) => [
    index("iap_receipts_user_id_idx").on(table.userId),
    index("iap_receipts_transaction_id_idx").on(table.transactionId),
  ]
);

// Goals (user personal challenges)
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    stakeAmount: bigint("stake_amount", { mode: "number" }).notNull().default(0),
    deadline: timestamp("deadline", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    streakWeeks: integer("streak_weeks").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("goals_user_id_idx").on(table.userId),
    index("goals_status_idx").on(table.status),
  ]
);

// Donations (charity donations)
export const donations = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    charityName: text("charity_name").notNull(),
    charityEin: text("charity_ein"),
    platesAmount: bigint("plates_amount", { mode: "number" }).notNull(),
    usdValue: integer("usd_value").notNull(),
    status: text("status").notNull().default("pending"),
    receiptUrl: text("receipt_url"),
    challengeId: uuid("challenge_id").references(() => challenges.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("donations_user_id_idx").on(table.userId),
    index("donations_challenge_idx").on(table.challengeId),
  ]
);

// Reports (user reports for spam/inappropriate/cheating)
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id").notNull().references(() => users.id),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    description: text("description"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => users.id),
  },
  (table) => [
    index("reports_target_idx").on(table.targetType, table.targetId),
    index("reports_reporter_idx").on(table.reporterId),
    index("reports_status_idx").on(table.status),
    pgPolicy("Users can create reports", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`${table.reporterId} = auth.uid()`,
    }),
    pgPolicy("Users can view their own reports", {
      for: "select",
      to: "authenticated",
      using: sql`${table.reporterId} = auth.uid()`,
    }),
  ]
);

export type Uuid = string;
export type User = typeof users.$inferSelect & {
  name?: string;
  totalGiven?: number;
  avatarColor?: string;
};
export type LedgerSourceTable = "bets" | "pool_transactions" | "ious" | "manual_adjustments" | string;
export type PartyMemberRole = "host" | "admin" | "member";
export type PaymentProvider = "venmo" | "cash_app" | "paypal" | "manual";
export type LedgerEntry = Omit<typeof ledgerEntries.$inferSelect, "createdAt"> & {
  createdAt: string;
  sourceTable: LedgerSourceTable;
  accountType: string;
  accountId: string;
  memo?: string;
  plateDelta: number;
};
export type Party = Omit<typeof parties.$inferSelect, "inviteCode" | "charityOrgName" | "charityOrgUrl"> & {
  inviteCode: string;
  charityOrgName: string;
  charityOrgUrl: string | null;
};
export type PartyMember = typeof partyMembers.$inferSelect & {
  displayName?: string;
  avatarColor?: string;
};
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeOption = typeof challengeOptions.$inferSelect;
export type ChallengeEntry = typeof challengeEntries.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type PredictionOption = typeof predictionOptions.$inferSelect;
export type PredictionEntry = typeof predictionEntries.$inferSelect;
export type Wager = typeof wagers.$inferSelect;
export type WagerOption = typeof wagerOptions.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type PoolTransaction = typeof poolTransactions.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type SyncOutboxEntry = typeof syncOutbox.$inferSelect;
export type IapReceipt = typeof iapReceipts.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type Report = typeof reports.$inferSelect;

export const schema = {
  users,
  ledgerEntries,
  parties,
  partyMembers,
  challenges,
  challengeEntries,
  challengeOptions,
  predictions,
  predictionOptions,
  predictionEntries,
  wagers,
  wagerOptions,
  bets,
  poolTransactions,
  gameSessions,
  syncOutbox,
  iapReceipts,
  goals,
  donations,
  reports,
};

// Auto-generated helpers
export function createUuid(): string {
  return Crypto.randomUUID();
}

let hlcCounter = 0;

export function createDefaultHlc(): string {
  const now = Date.now();
  hlcCounter = (hlcCounter + 1) % 1000;
  const counter = hlcCounter.toString().padStart(3, "0");
  return `${now}-${counter}-local`;
}
