import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import type { SortOption } from "../../stores/useChallengeStore";

const SORT_OPTIONS: { value: SortOption; label: string; emoji: string }[] = [
  { value: "relevance", label: "Relevance", emoji: "🔥" },
  { value: "ending-soon", label: "Ending Soon", emoji: "⏰" },
  { value: "biggest-pot", label: "Biggest Pot", emoji: "💰" },
  { value: "just-dropped", label: "Just Dropped", emoji: "🆕" },
];

export type SortDropdownProps = {
  selected: SortOption;
  onSelect: (sort: SortOption) => void;
};

export function SortDropdown({ selected, onSelect }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((s) => s.value === selected);

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} style={styles.button}>
        <Text style={styles.buttonText}>
          {current?.emoji} {current?.label}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                style={[
                  styles.option,
                  selected === option.value && styles.optionSelected,
                ]}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  selected === option.value && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                {selected === option.value && <Text style={styles.check}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.linen[50],
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.ash[200],
  },
  buttonText: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  chevron: {
    marginLeft: spacing[2],
    color: colors.ash[500],
    fontSize: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    paddingTop: 120,
    paddingHorizontal: spacing[4],
  },
  menu: {
    backgroundColor: colors.linen[100],
    borderRadius: 16,
    padding: spacing[2],
    shadowColor: colors.ink[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  optionSelected: {
    backgroundColor: colors.glaze[50],
  },
  optionEmoji: {
    fontSize: 18,
    marginRight: spacing[3],
  },
  optionLabel: {
    flex: 1,
    color: colors.ink[700],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  optionLabelSelected: {
    color: colors.glaze[700],
    fontWeight: typography.weights.bold,
  },
  check: {
    color: colors.glaze[600],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
});
