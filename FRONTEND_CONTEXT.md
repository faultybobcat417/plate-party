# PLATE PARTY — FRONTEND BUILD TASK

## WHAT EXISTS (Backend is complete)
- src/db/schema.ts — Drizzle ORM schema
- src/db/connection.ts — SQLite connection
- src/api/ledger.ts, party.ts, sync.ts, wager.ts, bet.ts — API layer
- src/engine/OracleValidation.ts, ResolutionEngine.ts — Business logic
- src/stores/usePartyStore.ts, useWagerStore.ts, useBetStore.ts, useLedgerStore.ts, useSyncStore.ts — Zustand stores
- Tests passing (44 tests)

## WHAT YOU MUST BUILD (Frontend)

### 1. Theme System
Create src/theme/ with:
- colors.ts — Export color tokens (ink, linen, glaze, mustard, ash, wine, clay, iron)
- typography.ts — Font sizes, weights, line heights
- spacing.ts — Spacing scale (4pt grid)
- index.ts — Theme provider and hooks

### 2. Component Primitives
Create src/components/primitives/ with:
- Button.tsx — Primary, secondary, ghost, danger variants
- Input.tsx — Text input with focus states
- Card.tsx — Container with padding and radius
- Avatar.tsx — Initials-based avatar with color seed
- AvatarStack.tsx — Multiple avatars overlapping
- Badge.tsx — Status badges, role tags
- BottomSheet.tsx — Modal sheet wrapper
- Toast.tsx — Notification toast
- Skeleton.tsx — Loading skeleton
- NumericStepper.tsx — Increment/decrement with haptics
- SegmentedControl.tsx — Tab switcher

### 3. Component Composites
Create src/components/composite/ with:
- PlateChip.tsx — Plate amount display
- WagerCard.tsx — Wager preview card
- BetOptionCard.tsx — Bet option with selection
- ActivityFeedItem.tsx — Feed item component
- CountdownTimer.tsx — Deadline countdown
- SyncStatusBadge.tsx — Sync state indicator
- EmptyState.tsx — Empty list placeholder
- RevealOverlay.tsx — Win/loss reveal animation

### 4. Screens
Create all screens from ui.md:

src/screens/onboarding/:
- SplashScreen.tsx
- OnboardingScreen.tsx
- CreateProfileScreen.tsx

src/screens/home/:
- PartyListScreen.tsx

src/screens/party/:
- CreatePartyScreen.tsx
- JoinPartyScreen.tsx
- PartyDetailScreen.tsx
- PartySettingsScreen.tsx
- MemberProfileScreen.tsx

src/screens/wager/:
- CreateWagerScreen.tsx
- WagerDetailScreen.tsx
- PlaceBetSheet.tsx
- BetConfirmedSheet.tsx
- RevealScreen.tsx

src/screens/leaderboard/:
- LeaderboardScreen.tsx

src/screens/charity/:
- CharityPoolScreen.tsx
- RealMoneySettleScreen.tsx

src/screens/activity/:
- ActivityScreen.tsx

src/screens/profile/:
- ProfileScreen.tsx
- SettingsScreen.tsx

### 5. Navigation
Create src/navigation/ with:
- RootNavigator.tsx — Stack navigator (onboarding vs main)
- MainTabNavigator.tsx — Bottom tabs (Home, Activity, Profile)
- PartyStackNavigator.tsx — Party detail stack
- types.ts — Route param types

### 6. App.tsx
Replace default App.tsx with:
- SafeAreaProvider
- NavigationContainer
- ThemeProvider
- GestureHandlerRootView

## RULES
- Use React Navigation v7 (native-stack)
- Use React Native Paper for base components (optional)
- Use Reanimated 3 for animations
- Use expo-haptics for haptics
- Every screen must use the Zustand stores
- Every screen must follow the ui.md specs
- Run npm run lint after every 5 files
- Run npm test after every 10 files
- Fix errors immediately

## ANTI-REQUIREMENTS
- No placeholder text ("Lorem ipsum", "Coming soon")
- No empty screens — every screen must have real UI
- No unimplemented navigation — every screen must be reachable
- No missing error handling

Go. Build all frontend files without stopping.
