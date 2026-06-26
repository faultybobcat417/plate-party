import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme";

export type CreateChallengeButtonProps = {
  onPress: () => void;
};

export function CreateChallengeButton({ onPress }: CreateChallengeButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.dashedBox}>
        <Text style={styles.plusIcon}>+</Text>
        <Text style={styles.label}>Create Challenge</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  dashedBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.glaze[400],
    borderRadius: 16,
    padding: spacing[6],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glaze[50],
  },
  plusIcon: {
    fontSize: 32,
    color: colors.glaze[600],
    fontWeight: "300",
    marginBottom: spacing[2],
  },
  label: {
    color: colors.glaze[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
