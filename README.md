# Plate Party v2 Fixes

## What's Fixed

### 1. Feed → "Attempt" Button Now Works
- **NEW:** `src/screens/feed/EnterStakeScreen.tsx` — submission form with proof text + plates wagered
- **UPDATED:** `src/components/composite/StakeCard.tsx` — taps navigate to entry screen
- **UPDATED:** `src/navigation/FeedStackNavigator.tsx` + `types.ts` — added `EnterStake` route

### 2. Market Category Filter — Fixed Stretched Pills
- **UPDATED:** `src/screens/market/MarketHome.tsx` — category pills now properly sized with `alignSelf: "flex-start"`, no vertical stretch on active state

### 3. Market Detail — No More "Not Found" Crash
- **UPDATED:** `src/screens/market/MarketDetailScreen.tsx` — gracefully handles missing detail data by falling back to list data. Shows proper "Market not found" screen instead of white screen + console error.

### 4. Profile — Charity Orgs Widget
- **UPDATED:** `src/screens/profile/ProfileScreen.tsx` — added "Support a Cause" section with 5 fake orgs (Red Cross, UNICEF, WWF, Feeding America, St. Jude). Tap to select. Shows plates raised + supporter count.

## How to Apply

```bash
cd /Users/alimehdi/Documents/plate-party
bash apply-v2-fixes.sh
```

Or manually copy each file from `plate_party_v2_fixes/src/` to your `src/`.

## After Applying

```bash
npx tsc --noEmit
npx expo start
```
