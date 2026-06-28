import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, Switch } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../primitives/Button";

interface AgeGateModalProps {
  visible: boolean;
  onConfirm: () => void;
  onDismiss?: () => void;
}

export function AgeGateModal({ visible, onConfirm, onDismiss }: AgeGateModalProps) {
  const [confirmed, setConfirmed] = React.useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
      setConfirmed(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Age Verification Required</Text>
          <Text style={styles.body}>
            Plate Party involves virtual currency wagering. You must be 18 years or older to purchase plates or participate in paid challenges.
          </Text>

          <View style={styles.row}>
            <Switch
              value={confirmed}
              onValueChange={setConfirmed}
              trackColor={{ false: colors.ink[700], true: colors.glaze[500] }}
              thumbColor={colors.white}
            />
            <Text style={styles.confirmText}>
              I am 18 years or older and agree to the Terms of Service.
            </Text>
          </View>

          <Button title="Continue" onPress={handleConfirm} disabled={!confirmed} />

          {onDismiss && (
            <Pressable onPress={onDismiss} style={styles.dismiss}>
              <Text style={styles.dismissText}>Cancel</Text>
            </Pressable>
          )}
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
    marginBottom: spacing[5],
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  confirmText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.ash[300],
    lineHeight: typography.lineHeights.normal,
  },
  dismiss: {
    marginTop: spacing[3],
    alignSelf: "center",
  },
  dismissText: {
    fontSize: typography.sizes.sm,
    color: colors.ash[500],
  },
});
