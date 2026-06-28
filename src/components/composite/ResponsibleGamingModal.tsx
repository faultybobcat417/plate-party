import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../primitives/Button";

interface ResponsibleGamingModalProps {
  visible: boolean;
  onAcknowledge: () => void;
  onGoToSettings: () => void;
}

export function ResponsibleGamingModal({ visible, onAcknowledge, onGoToSettings }: ResponsibleGamingModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Play Responsibly</Text>
          <Text style={styles.body}>
            Plates are virtual currency with no real-world monetary value. Set personal limits, take breaks, and never wager more than you can afford to lose.
          </Text>
          <Text style={styles.body}>
            If you feel your play is becoming problematic, you can self-exclude or set spending limits in Settings at any time.
          </Text>

          <Button title="I Understand" onPress={onAcknowledge} />

          <Pressable onPress={onGoToSettings} style={styles.link}>
            <Text style={styles.linkText}>Go to Responsible Gaming Settings</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  card: {
    backgroundColor: colors.ink[900],
    borderRadius: 16,
    padding: spacing[6],
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  body: {
    fontSize: typography.sizes.base,
    color: colors.ash[400],
    lineHeight: typography.lineHeights.relaxed,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  link: {
    marginTop: spacing[3],
    alignSelf: "center",
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.glaze[500],
    textDecorationLine: "underline",
  },
});
