import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, spacing, typography } from "../../theme";

export interface CreateStakePostSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    content: string;
    targetPlates: number;
    deadline: string;
    options: { label: string; staked: number }[];
  }) => void | Promise<void>;
  isLoading?: boolean;
}

const TARGET_CHIPS = [50, 100, 250, 500, 1000];
const DEADLINE_CHIPS = [
  { label: "1h", ms: 3600000 },
  { label: "6h", ms: 21600000 },
  { label: "24h", ms: 86400000 },
  { label: "3d", ms: 259200000 },
  { label: "7d", ms: 604800000 },
];
const MAX_CONTENT = 280;

export function CreateStakePostSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateStakePostSheetProps) {
  const [content, setContent] = useState("");
  const [targetPlates, setTargetPlates] = useState(100);
  const [deadlineMs, setDeadlineMs] = useState(86400000);
  const [touched, setTouched] = useState({ content: false });

  const contentError = useMemo(() => {
    if (!content.trim()) return "Proposition is required.";
    if (content.trim().length < 5) return "Proposition must be at least 5 characters.";
    return null;
  }, [content]);

  const isValid = !contentError;

  const reset = () => {
    setContent("");
    setTargetPlates(100);
    setDeadlineMs(86400000);
    setTouched({ content: false });
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const handleSubmit = () => {
    setTouched({ content: true });
    if (!isValid || isLoading) return;
    const deadline = new Date(Date.now() + deadlineMs).toISOString();
    void onSubmit({
      content: content.trim(),
      targetPlates,
      deadline,
      options: [
        { label: "Yes", staked: 0 },
        { label: "No", staked: 0 },
      ],
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>New 🥩 Stake</Text>
            <Pressable
              onPress={handleClose}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Proposition</Text>
          <TextInput
            style={[
              styles.input,
              { minHeight: 80 },
              touched.content && contentError ? styles.inputError : null,
            ]}
            multiline
            maxLength={MAX_CONTENT}
            placeholder="I'll do X if Y plates are staked by Z time..."
            placeholderTextColor={colors.ash[400]}
            value={content}
            onChangeText={setContent}
            onBlur={() => setTouched((t) => ({ ...t, content: true }))}
            editable={!isLoading}
            accessibilityLabel="Proposition"
          />
          {touched.content && contentError ? (
            <Text style={styles.errorText}>{contentError}</Text>
          ) : null}
          <Text style={styles.counter}>{content.length}/{MAX_CONTENT}</Text>

          <Text style={styles.label}>Target Plates</Text>
          <View style={styles.chipRow}>
            {TARGET_CHIPS.map((chip) => (
              <Pressable
                key={chip}
                accessibilityRole="radio"
                accessibilityLabel={`${chip} plates`}
                accessibilityState={{ checked: targetPlates === chip, disabled: isLoading }}
                style={[
                  styles.chip,
                  targetPlates === chip && styles.chipActive,
                  isLoading && styles.disabled,
                ]}
                onPress={() => !isLoading && setTargetPlates(chip)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.chipText,
                    targetPlates === chip && styles.chipTextActive,
                  ]}
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Deadline</Text>
          <View style={styles.chipRow}>
            {DEADLINE_CHIPS.map((chip) => (
              <Pressable
                key={chip.label}
                accessibilityRole="radio"
                accessibilityLabel={`${chip.label}`}
                accessibilityState={{ checked: deadlineMs === chip.ms, disabled: isLoading }}
                style={[
                  styles.chip,
                  deadlineMs === chip.ms && styles.chipActive,
                  isLoading && styles.disabled,
                ]}
                onPress={() => !isLoading && setDeadlineMs(chip.ms)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.chipText,
                    deadlineMs === chip.ms && styles.chipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, (pressed || isLoading) && styles.pressed]}
              onPress={handleClose}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                (!isValid || isLoading) && styles.submitBtnDisabled,
                pressed && isValid && !isLoading && styles.submitBtnPressed,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
              accessibilityRole="button"
              accessibilityLabel="Post stake"
              accessibilityState={{ disabled: !isValid || isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.linen[50]} />
              ) : (
                <Text style={styles.submitBtnText}>Post Stake</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.linen[50],
    borderTopLeftRadius: spacing[4],
    borderTopRightRadius: spacing[4],
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.ink[900],
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  closeBtnPressed: {
    backgroundColor: colors.ash[100],
  },
  closeText: {
    fontSize: 20,
    color: colors.ash[500],
    fontWeight: typography.weights.bold,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.ink[700],
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ash[300],
    borderRadius: spacing[2],
    padding: spacing[3],
    fontSize: typography.sizes.base,
    color: colors.ink[900],
    backgroundColor: colors.linen[50],
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: colors.wine[500],
  },
  errorText: {
    color: colors.wine[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  counter: {
    fontSize: typography.sizes.xs,
    color: colors.ash[400],
    textAlign: "right",
    marginTop: spacing[1],
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing[2],
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: spacing[2],
    borderWidth: 1,
    borderColor: colors.ash[300],
    backgroundColor: colors.linen[50],
    minHeight: 44,
    justifyContent: "center",
  },
  chipActive: {
    borderColor: colors.glaze[600],
    backgroundColor: colors.glaze[100],
  },
  disabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.ink[700],
    fontWeight: typography.weights.medium,
  },
  chipTextActive: {
    color: colors.glaze[700],
    fontWeight: typography.weights.bold,
  },
  btnRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[6],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: spacing[2],
    borderWidth: 1,
    borderColor: colors.ash[300],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: spacing[2],
    backgroundColor: colors.glaze[600],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitBtnDisabled: {
    backgroundColor: colors.glaze[300],
  },
  submitBtnPressed: {
    backgroundColor: colors.glaze[700],
  },
  pressed: {
    opacity: 0.7,
  },
  cancelBtnText: {
    fontSize: typography.sizes.base,
    color: colors.ink[700],
    fontWeight: typography.weights.semibold,
  },
  submitBtnText: {
    fontSize: typography.sizes.base,
    color: colors.linen[50],
    fontWeight: typography.weights.bold,
  },
});
