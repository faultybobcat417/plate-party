import { StyleSheet, View } from "react-native";

import { Avatar } from "./Avatar";
import { colors } from "../../theme";

export type AvatarStackProps = {
  names: string[];
  max?: number;
  size?: "sm" | "md" | "lg";
};

const overlap = 10;
const borderWidth = 2;

const sizes = {
  sm: 28,
  md: 40,
  lg: 56,
};

export function AvatarStack({ names, max = 4, size = "md" }: AvatarStackProps) {
  const visible = names.slice(0, max);
  const remaining = names.length - max;
  const dimension = sizes[size];

  return (
    <View style={styles.container}>
      {visible.map((name, index) => (
        <View
          key={`${name}-${index}`}
          style={[
            styles.avatarWrapper,
            {
              marginLeft: index === 0 ? 0 : -overlap,
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          <Avatar name={name} size={size} />
        </View>
      ))}
      {remaining > 0 ? (
        <View
          style={[
            styles.overflow,
            {
              marginLeft: -overlap,
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          <Avatar name={`+${remaining}`} colorSeed="overflow" size={size} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
  },
  avatarWrapper: {
    borderColor: colors.linen[50],
    borderWidth,
    overflow: "hidden",
  },
  overflow: {
    borderColor: colors.linen[50],
    borderWidth,
    overflow: "hidden",
  },
});
