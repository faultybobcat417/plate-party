import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export type ProofType = "camera" | "photo" | "file" | "text";

export type ProofSubmissionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (type: ProofType, data: string) => void;
  challengeTitle: string;
};

export function ProofSubmissionSheet({ visible, onClose, onSubmit, challengeTitle }: ProofSubmissionSheetProps) {
  const [selectedType, setSelectedType] = useState<ProofType | null>(null);
  const [textInput, setTextInput] = useState("");

  const PROOF_OPTIONS: { type: ProofType; emoji: string; label: string; desc: string }[] = [
    { type: "camera", emoji: "📷", label: "Camera", desc: "Take a photo now" },
    { type: "photo", emoji: "🖼️", label: "Photo Library", desc: "Choose from gallery" },
    { type: "file", emoji: "📁", label: "Files", desc: "Upload a document" },
    { type: "text", emoji: "📝", label: "Text Note", desc: "Write your proof" },
  ];

  const handleSubmit = () => {
    if (!selectedType) return;
    const data = selectedType === "text" ? textInput : `[${selectedType}] proof placeholder`;
    if (selectedType === "text" && !textInput.trim()) {
      Alert.alert("Empty Note", "Please write something first.");
      return;
    }
    onSubmit(selectedType, data);
    setSelectedType(null);
    setTextInput("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Submit Proof</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{challengeTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {!selectedType ? (
            <View style={styles.options}>
              {PROOF_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.type}
                  onPress={() => setSelectedType(opt.type)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    pressed && styles.optionCardPressed,
                  ]}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.inputArea}>
              {selectedType === "text" ? (
                <TextInput
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe your proof..."
                  placeholderTextColor={colors.ash[400]}
                  value={textInput}
                  onChangeText={setTextInput}
                  textAlignVertical="top"
                />
              ) : (
                <View style={styles.placeholderBox}>
                  <Text style={styles.placeholderEmoji}>
                    {PROOF_OPTIONS.find((o) => o.type === selectedType)?.emoji}
                  </Text>
                  <Text style={styles.placeholderText}>
                    {selectedType === "camera" && "Camera would open here"}
                    {selectedType === "photo" && "Photo picker would open here"}
                    {selectedType === "file" && "File picker would open here"}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                ]}
              >
                <Text style={styles.submitText}>Submit for Review</Text>
              </Pressable>

              <Pressable onPress={() => setSelectedType(null)} style={styles.backButton}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.linen[100],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing[4],
    paddingBottom: spacing[8],
    minHeight: 400,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing[4],
    position: "relative",
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: colors.ash[500],
    fontSize: 20,
    fontWeight: typography.weights.bold,
  },
  options: {
    gap: spacing[2],
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.linen[50],
    borderRadius: 12,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.ash[200],
  },
  optionCardPressed: {
    backgroundColor: colors.ash[100],
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: spacing[3],
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  optionDesc: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  optionArrow: {
    color: colors.ash[400],
    fontSize: 20,
    fontWeight: typography.weights.bold,
  },
  inputArea: {
    gap: spacing[3],
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.ash[300],
    borderRadius: 12,
    padding: spacing[3],
    fontSize: typography.sizes.base,
    color: colors.ink[900],
    backgroundColor: colors.linen[100],
    height: 120,
  },
  placeholderBox: {
    height: 200,
    backgroundColor: colors.ash[100],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.ash[300],
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: spacing[2],
  },
  placeholderText: {
    color: colors.ash[500],
    fontSize: typography.sizes.base,
  },
  submitButton: {
    backgroundColor: colors.glaze[600],
    paddingVertical: spacing[3],
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitText: {
    color: colors.linen[100],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  backText: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
  },
});
