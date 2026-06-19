import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../../theme";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = {
  name: string;
  colorSeed?: string;
  size?: AvatarSize;
};

const avatarColors = [
  colors.glaze[500],
  colors.mustard[500],
  colors.wine[500],
  colors.clay[500],
  colors.iron[500],
];

function seedToIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % avatarColors.length;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const sizes: Record<AvatarSize, { dimension: number; fontSize: number }> = {
  sm: { dimension: 28, fontSize: 10 },
  md: { dimension: 40, fontSize: 14 },
  lg: { dimension: 56, fontSize: 18 },
  xl: { dimension: 80, fontSize: 28 },
};

export function Avatar({ name, colorSeed = name, size = "md" }: AvatarProps) {
  const { dimension, fontSize } = sizes[size];
  const backgroundColor = avatarColors[seedToIndex(colorSeed)];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.linen[50],
    fontWeight: typography.weights.bold,
  },
});
