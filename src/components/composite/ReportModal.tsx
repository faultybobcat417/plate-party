import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TextInput, Pressable } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../primitives/Button";

export type ReportReason = "spam" | "inappropriate" | "cheating" | "other";

interface ReportModalProps {
  visible: boolean;
  targetType: "challenge" | "profile" | "party";
  targetId: string;
  onSubmit: (reason: ReportReason, description: string) => void;
  onDismiss: () => void;
}

const REASONS: { label: string; value: ReportReason }[] = [
  { label: "Spam or misleading", value: "spam" },
  { label: "Inappropriate content", value: "inappropriate" },
  { label: "Cheating or fraud", value: "cheating" },
  { label: "Other", value: "other" },
];

export function ReportModal({ visible, targetType, targetId, onSubmit, onDismiss }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await onSubmit(selectedReason, description.trim());
    } finally {
      setSubmitting(false);
      setSelectedReason(null);
      setDescription("");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Report {targetType}</Text>
          <Text style={styles.subtitle}>ID: {targetId}</Text>

          <Text style={styles.sectionLabel}>Reason</Text>
          {REASONS.map((reason) => (
            <Pressable
              key={reason.value}
              onPress={() => setSelectedReason(reason.value)}
              style={styles.reasonRow}
            >
              <View
                style={[
                  styles.radio,
                  selectedReason === reason.value && styles.radioActive,
                ]}
              />
              <Text style={styles.reasonText}>{reason.label}</Text>
            </Pressable>
          ))}

          <Text style={styles.sectionLabel}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholderTextColor={colors.ash[500]}
            placeholder="Provide additional details..."
          />

          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onDismiss} variant="ghost" />
            <Button
              title="Submit Report"
              onPress={handleSubmit}
              disabled={!selectedReason || submitting}
              loading={submitting}
            />
          </View>
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
    padding: spacing[5],
  },
  card: {
    backgroundColor: colors.ink[900],
    borderRadius: 16,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.ash[500],
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.ash[300],
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ash[500],
  },
  radioActive: {
    borderColor: colors.glaze[500],
    backgroundColor: colors.glaze[500],
  },
  reasonText: {
    fontSize: typography.sizes.base,
    color: colors.ash[200],
  },
  input: {
    backgroundColor: colors.ink[800],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
    padding: spacing[3],
    color: colors.white,
    fontSize: typography.sizes.base,
    textAlignVertical: "top",
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[5],
  },
});
