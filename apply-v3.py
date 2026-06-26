#!/usr/bin/env python3
import shutil

print("🥩 PLATE PARTY v3 PATCH")
print("=" * 40)

# ── FIX 1: FeedHomeScreen ──
print("\n📝 Patching FeedHomeScreen...")
with open("src/screens/feed/FeedHomeScreen.tsx", "r") as f:
    content = f.read()

old_line = 'renderItem={({ item }) => <StakeCard post={item} onStake={(index: number) => void handleStake(item, index)} />}'
new_line = """renderItem={({ item }) => (
            <StakeCard
              post={item}
              onPress={() => (navigation as any).navigate("EnterStake", {
                stakeId: item.id,
                title: item.title || item.question || "Untitled",
                creator: item.creatorName || item.creator || "Anonymous",
              })}
            />
          )}"""

if old_line in content:
    content = content.replace(old_line, new_line)
    print("  ✅ StakeCard renderItem patched")
else:
    print("  ⚠️  Could not find StakeCard renderItem line")

with open("src/screens/feed/FeedHomeScreen.tsx", "w") as f:
    f.write(content)

# ── FIX 2: MarketHome ──
print("\n📝 Patching MarketHome...")
with open("src/screens/market/MarketHome.tsx", "r") as f:
    content = f.read()

if 'contentContainerStyle={{ alignItems: "center" }}' in content:
    content = content.replace(
        'contentContainerStyle={{ alignItems: "center" }}',
        'contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}'
    )
    print("  ✅ ScrollView patched")
else:
    print("  ⚠️  ScrollView pattern not found")

with open("src/screens/market/MarketHome.tsx", "w") as f:
    f.write(content)

# ── FIX 3: Copy StakeCard ──
print("\n📝 Copying StakeCard...")
shutil.copy("plate_party_v3_clean/src/components/composite/StakeCard.tsx", "src/components/composite/StakeCard.tsx")
print("  ✅ StakeCard copied")

print("\n✅ ALL PATCHES APPLIED!")
print("Run: npx tsc --noEmit")