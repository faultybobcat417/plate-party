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

export interface CreateMeatPostSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    caption: string;
    bioSnippet: string;
    plateCost: number;
  }) => void | Promise<void>;
  isLoading?: boolean;
}

const PLATE_CHIPS = [5, 10, 25, 50, 100];
const MAX_CAPTION = 200;
const MAX_BIO = 80;

export function CreateMeatPostSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateMeatPostSheetProps) {
  const [caption, setCaption] = useState("");
  const [bioSnippet, setBioSnippet] = useState("");
  const [plateCost, setPlateCost] = useState(25);
  const [touched, setTouched] = useState({ caption: false });

  const captionError = useMemo(() => {
    if (!caption.trim()) return "Caption is required.";
    if (caption.trim().length < 3) return "Caption must be at least 3 characters.";
    return null;
  }, [caption]);

  const isValid = !captionError;

  const reset = () => {
    setCaption("");
    setBioSnippet("");
    setPlateCost(25);
    setTouched({ caption: false });
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const handleSubmit = () => {
    setTouched({ caption: true });
    if (!isValid || isLoading) return;
    void onSubmit({ caption: caption.trim(), bioSnippet: bioSnippet.trim(), plateCost });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>New 🥩 Meat Post</Text>
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

          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={[styles.input, touched.caption && captionError ? styles.inputError : null]}
            multiline
            maxLength={MAX_CAPTION}
            placeholder="What's happening?"
            placeholderTextColor={colors.ash[400]}
            value={caption}
            onChangeText={setCaption}
            onBlur={() => setTouched((t) => ({ ...t, caption: true }))}
            editable={!isLoading}
            accessibilityLabel="Caption"
          />
          {touched.caption && captionError ? (
            <Text style={styles.errorText}>{captionError}</Text>
          ) : null}
          <Text style={styles.counter}>{caption.length}/{MAX_CAPTION}</Text>

          <Text style={styles.label}>Bio Snippet</Text>
          <TextInput
            style={styles.input}
            maxLength={MAX_BIO}
            placeholder="6'2 • DJ • Pizza enthusiast"
            placeholderTextColor={colors.ash[400]}
            value={bioSnippet}
            onChangeText={setBioSnippet}
            editable={!isLoading}
            accessibilityLabel="Bio snippet"
          />
          <Text style={styles.counter}>{bioSnippet.length}/{MAX_BIO}</Text>

          <Text style={styles.label}>Plate Cost</Text>
          <View style={styles.chipRow}>
            {PLATE_CHIPS.map((chip) => (
              <Pressable
                key={chip}
                accessibilityRole="radio"
                accessibilityLabel={`${chip} plates`}
                accessibilityState={{ checked: plateCost === chip, disabled: isLoading }}
                style={[
                  styles.chip,
                  plateCost === chip && styles.chipActive,
                  isLoading && styles.disabled,
                ]}
                onPress={() => !isLoading && setPlateCost(chip)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.chipText,
                    plateCost === chip && styles.chipTextActive,
                  ]}
                >
                  {chip}
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
              accessibilityLabel="Post"
              accessibilityState={{ disabled: !isValid || isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.linen[50]} />
              ) : (
                <Text style={styles.submitBtnText}>Post</Text>
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
    minHeight: 48,
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
