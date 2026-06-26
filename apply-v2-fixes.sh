#!/bin/bash
set -e

echo "🥩 PLATE PARTY v2 FIXES"
echo "========================"
echo ""

PP="/Users/alimehdi/Documents/plate-party"

echo "📂 Target: $PP"
cd "$PP"

# Backup current files
echo "📦 Backing up current files..."
cp src/navigation/types.ts src/navigation/types.ts.bak2 2>/dev/null || true
cp src/navigation/FeedStackNavigator.tsx src/navigation/FeedStackNavigator.tsx.bak 2>/dev/null || true
cp src/components/composite/StakeCard.tsx src/components/composite/StakeCard.tsx.bak 2>/dev/null || true
cp src/screens/market/MarketHome.tsx src/screens/market/MarketHome.tsx.bak 2>/dev/null || true
cp src/screens/market/MarketDetailScreen.tsx src/screens/market/MarketDetailScreen.tsx.bak 2>/dev/null || true
cp src/screens/profile/ProfileScreen.tsx src/screens/profile/ProfileScreen.tsx.bak 2>/dev/null || true

# Apply fixes
echo "🩹 Applying fixes..."

echo "  → navigation/types.ts"
cp plate_party_v2_fixes/src/navigation/types.ts src/navigation/types.ts

echo "  → navigation/FeedStackNavigator.tsx"
cp plate_party_v2_fixes/src/navigation/FeedStackNavigator.tsx src/navigation/FeedStackNavigator.tsx

echo "  → screens/feed/EnterStakeScreen.tsx (NEW)"
cp plate_party_v2_fixes/src/screens/feed/EnterStakeScreen.tsx src/screens/feed/EnterStakeScreen.tsx

echo "  → components/composite/StakeCard.tsx"
cp plate_party_v2_fixes/src/components/composite/StakeCard.tsx src/components/composite/StakeCard.tsx

echo "  → screens/market/MarketHome.tsx"
cp plate_party_v2_fixes/src/screens/market/MarketHome.tsx src/screens/market/MarketHome.tsx

echo "  → screens/market/MarketDetailScreen.tsx"
cp plate_party_v2_fixes/src/screens/market/MarketDetailScreen.tsx src/screens/market/MarketDetailScreen.tsx

echo "  → screens/profile/ProfileScreen.tsx"
cp plate_party_v2_fixes/src/screens/profile/ProfileScreen.tsx src/screens/profile/ProfileScreen.tsx

echo ""
echo "✅ All v2 fixes applied!"
echo ""
echo "Next: run  npx tsc --noEmit  then  npx expo start"
