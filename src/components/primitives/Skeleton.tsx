import { StyleSheet, View } from "react-native";

import { colors } from "../../theme";

export type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
};

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.ash[200],
    overflow: "hidden",
  },
});
