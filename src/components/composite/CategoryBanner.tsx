import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { type MarketCategory, getCategoryEmoji, getCategoryLabel } from "../../api/market";

export type CategoryBannerProps = {
  categories: MarketCategory[];
  selected: MarketCategory | null;
  onSelect: (category: MarketCategory | null) => void;
};

export function CategoryBanner({ categories, selected, onSelect }: CategoryBannerProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selected === null }}
          accessibilityLabel="All categories"
          onPress={() => onSelect(null)}
          style={({ pressed }) => [
            styles.chip,
            selected === null && styles.chipActive,
            pressed && styles.chipPressed,
          ]}
        >
          <Text style={[styles.chipText, selected === null && styles.chipTextActive]}>
            🔥 All
          </Text>
        </Pressable>

        {categories.map((cat) => {
          const isActive = selected === cat;
          return (
            <Pressable
              key={cat}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={getCategoryLabel(cat)}
              onPress={() => onSelect(isActive ? null : cat)}
              style={({ pressed }) => [
                styles.chip,
                isActive && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {getCategoryEmoji(cat)} {getCategoryLabel(cat)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[2],
  },
  scroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  chip: {
    backgroundColor: colors.ash[100],
    borderRadius: 9999,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.ash[200],
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: colors.glaze[600],
    borderColor: colors.glaze[600],
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  chipTextActive: {
    color: colors.linen[100],
  },
});
