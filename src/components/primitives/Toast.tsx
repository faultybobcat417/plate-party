import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme";

export type ToastType = "info" | "success" | "error";

export type ToastProps = {
  message: string;
  type?: ToastType;
};

export function Toast({ message, type = "info" }: ToastProps) {
  const backgrounds: Record<ToastType, string> = {
    info: colors.ink[800],
    success: colors.glaze[700],
    error: colors.wine[600],
  };

  return (
    <View style={[styles.container, { backgroundColor: backgrounds[type] }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    borderRadius: 12,
    marginHorizontal: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    position: "absolute",
    top: spacing[12],
    zIndex: 100,
  },
  text: {
    color: colors.linen[50],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
