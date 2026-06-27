# PLATE PARTY — AGENT ORCHESTRATION CONTEXT
# For: Google Antigravity 2.0
# Repo: https://github.com/faultybobcat417/plate-party

## PROJECT OVERVIEW
Plate Party is a social betting/prediction market mobile app with a MySpace-style social layer.
Users buy "Plates" (in-app currency, $1 = 1 Plate), wager them on challenges/games,
and donate winnings to nonprofits.

## TECH STACK (DO NOT CHANGE)
- Expo SDK 56 + React Native 0.85.3
- React Navigation v7
- Zustand v5 (state) + TanStack Query v5 (server state)
- Supabase PostgreSQL + Drizzle ORM
- Supabase Auth + Edge Functions
- RevenueCat (IAP)
- TypeScript v6.0.3 strict mode

## COMPLETED WORK
### Phase 0: Foundation
- TypeScript: zero errors
- Lint: zero errors
- Tests: 22 passing
- App boots to main tabs (Feed, Play, Party, Profile)

### Phase 1: Data Layer (Partial)
- Supabase Edge Functions created:
  - create-challenge (atomic: deduct plates + create challenge)
  - create-game-session (atomic: escrow plates for both players)
  - donate-plates (atomic: deduct + record donation)
  - purchase-plates (atomic: validate IAP + credit plates)
  - resolve-challenge (atomic: transfer plates to winner)
  - resolve-game (atomic: transfer plates to winner)
- NEEDS: RLS policies, database triggers, API wiring

## REMAINING WORK

### Phase 1 Completion (Data Layer)
- [ ] Deploy Supabase Edge Functions
- [ ] Add RLS policies to all tables
- [ ] Add database triggers (updated_at, ledger auto-log)
- [ ] Wire src/api/* modules to use RPC functions
- [ ] Add Zod validation to all API functions

### Phase 2: Feed Tab (STEAK + GROW)
- [ ] STEAK: Create/view/join/resolve public challenges
- [ ] GROW: Personal goals with optional self-stake
- [ ] Proof submission (photo/video/text/file)
- [ ] Creator review flow

### Phase 3: Play Tab (6 Games)
- [ ] Matchmaking (random or invite)
- [ ] Wager flow (equal stakes, escrow)
- [ ] Real-time game state (polling)
- [ ] Anti-cheat server-side validation
- [ ] Winner resolution

### Phase 4: Party Tab (Private Groups)
- [ ] Create party with invite code
- [ ] Join via invite code
- [ ] Party-only challenges
- [ ] Party leaderboard

### Phase 5: Profile Tab
- [ ] Edit profile, avatar upload
- [ ] Activity history (ledger)
- [ ] Settings (notifications, privacy, limits)
- [ ] Delete account (soft delete)

### Phase 6: IAP & Plate Store
- [ ] RevenueCat product config
- [ ] PlateStoreScreen
- [ ] Purchase flow + restore
- [ ] Spending limits

### Phase 7: Final Hardening
- [ ] Rate limiting
- [ ] Sentry integration
- [ ] App store compliance (age gate, ToS, privacy)
- [ ] Final tests + polish

## CRITICAL RULES
1. NEVER use Math.random() for IDs — use crypto.randomUUID()
2. NEVER trust client-side plate balance — verify server-side
3. NEVER expose Supabase service role key in client code
4. NEVER skip RLS on new tables
5. NEVER use 'any' type — define interfaces
6. ALL plate transfers must be atomic via RPC
7. ALL user inputs must be Zod validated
8. ALL errors must be handled gracefully (no red screens)

## FILE STRUCTURE
src/
  api/           → API modules (must use RPC)
  components/    → Reusable components
  screens/       → Screen components
  stores/        → Zustand stores
  db/            → Drizzle schema + migrations
  lib/           → Utilities (supabase, validation, errors)
  theme/         → Color/typography/spacing tokens
  types/         → TypeScript types
  navigation/    → Navigators
supabase/
  functions/     → Edge Functions (atomic operations)
