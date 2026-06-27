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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("users_username_idx").on(table.username),
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
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
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
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull().default("public"), // public, private, personal
    stakeAmount: bigint("stake_amount", { mode: "number" }).notNull().default(0),
    rewardAmount: bigint("reward_amount", { mode: "number" }).notNull().default(0),
    status: text("status").notNull().default("open"), // open, locked, completed, void
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    proofRequired: boolean("proof_required").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("challenges_creator_id_idx").on(table.creatorId),
    index("challenges_status_idx").on(table.status),
    pgPolicy("Anyone can view open challenges", {
      for: "select",
      to: "authenticated",
      using: sql`${table.status} = 'open' AND ${table.deletedAt} IS NULL`,
    }),
    pgPolicy("Creators can view their own challenges", {
      for: "select",
      to: "authenticated",
      using: sql`${table.creatorId} = auth.uid() AND ${table.deletedAt} IS NULL`,
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

// Challenge entries (was bets)
export const challengeEntries = pgTable(
  "challenge_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    stakeAmount: bigint("stake_amount", { mode: "number" }).notNull().default(0),
    status: text("status").notNull().default("pending"), // pending, won, lost, void
    proofUrl: text("proof_url"),
    proofSubmittedAt: timestamp("proof_submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("challenge_entries_unique_idx").on(table.challengeId, table.userId),
    index("challenge_entries_user_id_idx").on(table.userId),
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
    status: text("status").notNull().default("open"), // open, locked, resolved, void
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
    status: text("status").notNull().default("active"), // active, won, lost, void
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("prediction_entries_unique_idx").on(table.predictionId, table.userId),
    index("prediction_entries_user_id_idx").on(table.userId),
  ]
);

// Game sessions (anti-cheat)
export const gameSessions = pgTable(
  "game_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    gameType: text("game_type").notNull(),
    score: integer("score").notNull().default(0),
    answers: jsonb("answers").default([]),
    timeTakenMs: integer("time_taken_ms"),
    status: text("status").notNull().default("playing"), // playing, completed, flagged
    flaggedReason: text("flagged_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("game_sessions_user_id_idx").on(table.userId),
    index("game_sessions_status_idx").on(table.status),
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
    status: text("status").notNull().default("pending"), // pending, validated, failed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
  },
  (table) => [
    index("iap_receipts_user_id_idx").on(table.userId),
    index("iap_receipts_transaction_id_idx").on(table.transactionId),
  ]
);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type Party = typeof parties.$inferSelect;
export type PartyMember = typeof partyMembers.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeEntry = typeof challengeEntries.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type PredictionOption = typeof predictionOptions.$inferSelect;
export type PredictionEntry = typeof predictionEntries.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type IAPReceipt = typeof iapReceipts.$inferSelect;
