import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, spacing, theme } from "../../theme";

export type CardVariant = "default" | "outlined" | "elevated";

export type CardProps = ViewProps & {
  variant?: CardVariant;
  padding?: keyof typeof spacing;
};

export function Card({
  variant = "default",
  padding = 4,
  style,
  children,
  ...rest
}: CardProps) {
  const variantStyles: Record<CardVariant, object> = {
    default: {
      backgroundColor: colors.linen[50],
      borderWidth: 1,
      borderColor: colors.ash[200],
    },
    outlined: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.ash[300],
    },
    elevated: {
      backgroundColor: colors.linen[50],
      ...theme.shadows.md,
    },
  };

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { padding: spacing[padding] },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    width: "100%",
  },
});
