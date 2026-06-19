import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme";

export type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              selected && styles.selected,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.ink[900] : colors.ash[600] },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ash[100],
    borderRadius: 10,
    flexDirection: "row",
    padding: 2,
  },
  option: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    paddingVertical: spacing[2],
  },
  selected: {
    backgroundColor: colors.linen[50],
    ...colors.ash[200] ? {} : {},
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
