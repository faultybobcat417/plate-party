import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { type CharityCategory } from "../../types/charity";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../api/charity";

interface CategoryPillProps {
  category: CharityCategory;
  isActive: boolean;
  onPress: () => void;
}

export function CategoryPill({ category, isActive, onPress }: CategoryPillProps) {
  const activeColor = CATEGORY_COLORS[category];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        isActive && { backgroundColor: activeColor, borderColor: activeColor },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${CATEGORY_LABELS[category]}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.text, isActive && styles.activeText]}>
        {CATEGORY_LABELS[category]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  activeText: {
    color: "#fff",
  },
});
