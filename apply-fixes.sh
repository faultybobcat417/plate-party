#!/bin/bash
set -e

echo "🥩 PLATE PARTY — MASS FIX SCRIPT"
echo "================================="
echo ""

# ── 1. BACKUP ──
echo "📦 Creating backup..."
if [ ! -d "src_backup_$(date +%s)" ]; then
  cp -R src "src_backup_$(date +%s)" 2>/dev/null || true
fi

# ── 2. THEME FILES (safe overwrite) ──
echo "🎨 Installing fixed theme system..."
cp -f src/theme/colors.ts src/theme/colors.ts.bak 2>/dev/null || true
cp -f src/theme/typography.ts src/theme/typography.ts.bak 2>/dev/null || true
cp -f src/theme/spacing.ts src/theme/spacing.ts.bak 2>/dev/null || true
cp -f src/theme/index.ts src/theme/index.ts.bak 2>/dev/null || true

# Copy new theme files (user should have downloaded these)
# If running from the extracted zip:
if [ -f "plate_party_fixes/src/theme/colors.ts" ]; then
  cp -f plate_party_fixes/src/theme/colors.ts src/theme/colors.ts
  cp -f plate_party_fixes/src/theme/typography.ts src/theme/typography.ts
  cp -f plate_party_fixes/src/theme/spacing.ts src/theme/spacing.ts
  cp -f plate_party_fixes/src/theme/index.ts src/theme/index.ts
else
  echo "⚠️  Fix files not found in ./plate_party_fixes/"
  echo "   Make sure you extracted the zip first!"
  exit 1
fi

# ── 3. NAVIGATION TYPES (safe overwrite) ──
echo "🧭 Installing fixed navigation types..."
cp -f src/navigation/types.ts src/navigation/types.ts.bak 2>/dev/null || true
if [ -f "plate_party_fixes/src/navigation/types.ts" ]; then
  cp -f plate_party_fixes/src/navigation/types.ts src/navigation/types.ts
fi

# ── 4. FIX useMarketStore EXPORTS ──
echo "🏪 Fixing useMarketStore exports..."
if [ -f "src/stores/useMarketStore.ts" ]; then
  # Change import type to export type for Market & MarketDetail
  sed -i '' 's/import type { Market, MarketDetail } from "..\/api\/market";/export type { Market, MarketDetail } from "..\/api\/market";
\/\/ Re-exported for component use/' src/stores/useMarketStore.ts 2>/dev/null ||   sed -i 's/import type { Market, MarketDetail } from "..\/api\/market";/export type { Market, MarketDetail } from "..\/api\/market";
\/\/ Re-exported for component use/' src/stores/useMarketStore.ts
fi

# ── 5. FIX NAVIGATOR IMPORTS (named → default) ──
echo "🧭 Fixing navigator screen imports..."

# MainTabNavigator: ProfileScreen
if [ -f "src/navigation/MainTabNavigator.tsx" ]; then
  sed -i '' 's/import { ProfileScreen } from "..\/screens\/profile\/ProfileScreen";/import ProfileScreen from "..\/screens\/profile\/ProfileScreen";/' src/navigation/MainTabNavigator.tsx 2>/dev/null ||   sed -i 's/import { ProfileScreen } from "..\/screens\/profile\/ProfileScreen";/import ProfileScreen from "..\/screens\/profile\/ProfileScreen";/' src/navigation/MainTabNavigator.tsx
fi

# MarketStackNavigator: MarketHomeScreen, TradeScreen
if [ -f "src/navigation/MarketStackNavigator.tsx" ]; then
  sed -i '' 's/import { MarketHomeScreen } from "..\/screens\/market\/MarketHomeScreen";/import MarketHomeScreen from "..\/screens\/market\/MarketHomeScreen";/' src/navigation/MarketStackNavigator.tsx 2>/dev/null ||   sed -i 's/import { MarketHomeScreen } from "..\/screens\/market\/MarketHomeScreen";/import MarketHomeScreen from "..\/screens\/market\/MarketHomeScreen";/' src/navigation/MarketStackNavigator.tsx

  sed -i '' 's/import { TradeScreen } from "..\/screens\/market\/TradeScreen";/import TradeScreen from "..\/screens\/market\/TradeScreen";/' src/navigation/MarketStackNavigator.tsx 2>/dev/null ||   sed -i 's/import { TradeScreen } from "..\/screens\/market\/TradeScreen";/import TradeScreen from "..\/screens\/market\/TradeScreen";/' src/navigation/MarketStackNavigator.tsx
fi

# ProfileStackNavigator: ProfileScreen
if [ -f "src/navigation/ProfileStackNavigator.tsx" ]; then
  sed -i '' 's/import { ProfileScreen } from "..\/screens\/profile\/ProfileScreen";/import ProfileScreen from "..\/screens\/profile\/ProfileScreen";/' src/navigation/ProfileStackNavigator.tsx 2>/dev/null ||   sed -i 's/import { ProfileScreen } from "..\/screens\/profile\/ProfileScreen";/import ProfileScreen from "..\/screens\/profile\/ProfileScreen";/' src/navigation/ProfileStackNavigator.tsx
fi

# ── 6. FIX SettingsScreen to use ProfileStackParamList ──
echo "⚙️  Fixing SettingsScreen stack type..."
if [ -f "src/screens/profile/SettingsScreen.tsx" ]; then
  sed -i '' 's/PartyStackParamList/ProfileStackParamList/g' src/screens/profile/SettingsScreen.tsx 2>/dev/null ||   sed -i 's/PartyStackParamList/ProfileStackParamList/g' src/screens/profile/SettingsScreen.tsx
fi

# ── 7. FIX MarketDetailScreen implicit any ──
echo "📈 Fixing MarketDetailScreen implicit any..."
if [ -f "src/screens/market/MarketDetailScreen.tsx" ]; then
  sed -i '' 's/{detail.relatedMarkets.map((m) =>/{detail.relatedMarkets.map((m: Market) =>/' src/screens/market/MarketDetailScreen.tsx 2>/dev/null ||   sed -i 's/{detail.relatedMarkets.map((m) =>/{detail.relatedMarkets.map((m: Market) =>/' src/screens/market/MarketDetailScreen.tsx
fi

# ── 8. REMOVE 'as any' from market navigation calls ──
echo "🧹 Cleaning market navigation casts..."
if [ -f "src/screens/market/MarketDetail.tsx" ]; then
  sed -i '' "s/'PlaceBetSheet' as any/'PlaceBetSheet'/g" src/screens/market/MarketDetail.tsx 2>/dev/null ||   sed -i "s/'PlaceBetSheet' as any/'PlaceBetSheet'/g" src/screens/market/MarketDetail.tsx
fi
if [ -f "src/screens/market/MarketHome.tsx" ]; then
  sed -i '' "s/'MarketDetail' as any/'MarketDetail'/g" src/screens/market/MarketHome.tsx 2>/dev/null ||   sed -i "s/'MarketDetail' as any/'MarketDetail'/g" src/screens/market/MarketHome.tsx
  sed -i '' "s/'PlaceBetSheet' as any/'PlaceBetSheet'/g" src/screens/market/MarketHome.tsx 2>/dev/null ||   sed -i "s/'PlaceBetSheet' as any/'PlaceBetSheet'/g" src/screens/market/MarketHome.tsx
fi
if [ -f "src/screens/play/PlayHome.tsx" ]; then
  sed -i '' "s/'GameScreen' as any/'GameScreen'/g" src/screens/play/PlayHome.tsx 2>/dev/null ||   sed -i "s/'GameScreen' as any/'GameScreen'/g" src/screens/play/PlayHome.tsx
fi

# ── 9. FIX api/market.ts undefined category ──
echo "🛠️  Fixing api/market.ts category..."
if [ -f "src/api/market.ts" ]; then
  sed -i '' 's/return category?.charAt(0).toUpperCase() + category?.slice(1) || "General";/return (category ? category.charAt(0).toUpperCase() + category.slice(1) : "General");/' src/api/market.ts 2>/dev/null ||   sed -i 's/return category?.charAt(0).toUpperCase() + category?.slice(1) || "General";/return (category ? category.charAt(0).toUpperCase() + category.slice(1) : "General");/' src/api/market.ts
fi

echo ""
echo "✅ All fixes applied!"
echo ""
echo "Next step: run  npx tsc --noEmit  to check remaining errors."
