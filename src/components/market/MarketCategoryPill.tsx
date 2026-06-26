import React from "react";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";

interface MarketCategoryPillProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function MarketCategoryPill({ categories, selected, onSelect }: MarketCategoryPillProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isSelected = cat === selected;
        return (
          <Pressable
            key={cat}
            style={[
              styles.pill,
              isSelected && styles.pillSelected,
            ]}
            onPress={() => onSelect(cat)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${cat}`}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pillSelected: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  text: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "500",
  },
  textSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
