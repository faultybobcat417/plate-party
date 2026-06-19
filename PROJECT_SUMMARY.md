# Plate Party — Project Summary & Context for Kimi Code

## What Exists Now (Built by Codex)

### Database Schema (src/db/schema.ts)
- users: Anonymous profiles, UUID-based
- parties: Groups with invite codes, charity pools
- party_members: Roles (host/member), plate balances, streaks
- wagers: Predictions with questions, options, deadlines, statuses
- wager_options: Individual options for each wager
- bets: User wagers on options
- ledger_entries: Double-entry bookkeeping (debits=credits)
- ledger_accounts: Account types (user_wallet, escrow_pool, charity_pool)
- pool_transactions: Charity pool ledger
- ious: Real-money tracking
- sync_outbox: Offline mutation tracking with HLC timestamps

Key constants:
- INITIAL_MEMBER_PLATES = 10
- DEFAULT_WAGER_STAKE_PLATES = 1
- Party roles: host | member
- Wager statuses: open | locked | resolved | void
- Oracle types: manual | weather | crypto
- Bet statuses: pending | locked | won | lost | void

### Database Connection (src/db/connection.ts)
- Expo SQLite async connection via openDatabaseAsync
- WAL mode enabled, foreign keys ON, busy timeout 5000ms
- Drizzle client with typed schema
- Singleton pattern: getDb(), getDrizzleDatabase(), initializeDatabase()
- Health check and close/reset helpers for tests

### API Layer (Built by Codex)
- ledger.ts: Double-entry bookkeeping, balanced entries, plate transfers
- party.ts: Party creation, join by invite code, member management
- sync.ts: Sync outbox, HLC ordering, push/pull over LAN
- wager.ts: Wager creation, validation, one active per party

## Tech Stack
- React Native / Expo (blank-typescript template)
- expo-sqlite + Drizzle ORM
- Zustand (for client state, not yet implemented)
- TypeScript strict mode
- ESLint v9 flat config
- Jest with jest-expo preset

## Hardware Constraints
- MacBook Air M1 (8GB RAM) — Development
- Ubuntu PC (Ryzen 5 2600, 8GB DDR4) — 7B AI model, test runner
- Zero cloud budget, zero paid APIs
- SQLite only, no Postgres/Redis/Firebase

## What's Missing (You Need to Build)

1. src/api/bet.ts — Bet placement, balance validation
2. src/engine/OracleValidation.ts — Open-Meteo + CoinGecko validation
3. src/engine/ResolutionEngine.ts — Wager resolution, N/A penalty
4. src/stores/usePartyStore.ts — Zustand store
5. src/stores/useWagerStore.ts — Zustand store
6. src/stores/useBetStore.ts — Zustand store
7. src/stores/useLedgerStore.ts — Zustand store
8. src/stores/useSyncStore.ts — Zustand store
9. tests/unit/*.test.ts — Jest tests

## Critical Rules
- Every function fully implemented — no TODOs, no placeholders
- Use existing schema.ts and connection.ts as reference
- Use ledger.ts for ALL plate movements (prevent double-spend)
- Use sync.ts for ALL mutations (offline-first)
- Run npm run lint after every 3 files
- Run npm test after every 5 files
- If lint fails, fix immediately
- If test fails, fix immediately
