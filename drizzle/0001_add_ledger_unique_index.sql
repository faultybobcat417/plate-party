-- Migration: Add unique index for ledger idempotency
-- Run this if you can't use drizzle-kit generate

CREATE UNIQUE INDEX IF NOT EXISTS uniq_wager_resolution_idx
ON ledger_entries (wager_id, entry_type, user_id);
