import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../primitives/Button";

interface GDPRBannerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onPrivacyPolicy: () => void;
}

export function GDPRBanner({ visible, onAccept, onDecline, onPrivacyPolicy }: GDPRBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Privacy Matters</Text>
      <Text style={styles.body}>
        We use analytics and push notifications to improve your experience. You can change these preferences anytime in Settings.
      </Text>
      <View style={styles.buttonRow}>
        <Button title="Accept All" onPress={onAccept} />
        <Pressable onPress={onDecline} style={styles.declineButton}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
      </View>
      <Pressable onPress={onPrivacyPolicy}>
        <Text style={styles.link}>Privacy Policy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink[800],
    borderTopWidth: 1,
    borderTopColor: colors.ink[700],
    padding: spacing[5],
    paddingBottom: spacing[7],
    zIndex: 100,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing[2],
  },
  body: {
    fontSize: typography.sizes.sm,
    color: colors.ash[400],
    lineHeight: typography.lineHeights.relaxed,
    marginBottom: spacing[4],
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  declineButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.ink[600],
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    color: colors.ash[300],
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
  link: {
    color: colors.glaze[500],
    fontSize: typography.sizes.sm,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
