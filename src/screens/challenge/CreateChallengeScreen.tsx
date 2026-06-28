import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Crypto from "expo-crypto";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { z } from "zod";

import {
  ChallengeCategorySchema,
  ChallengeOracleTypeSchema,
  CreateChallengeInputSchema,
  createChallenge,
  type ChallengeCategory,
  type ChallengeOracleType,
} from "../../api/challenges";
import { Button } from "../../components/primitives/Button";
import type { PartyStackParamList } from "../../navigation/types";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<PartyStackParamList, "CreateChallenge">;

type DraftOption = {
  id: string;
  label: string;
};

const ORACLE_OPTIONS: Array<{ label: string; value: ChallengeOracleType }> = [
  { label: "Manual", value: "manual" },
  { label: "Auto", value: "auto" },
  { label: "Game", value: "game_score" },
];

const CATEGORY_OPTIONS: Array<{ label: string; value: ChallengeCategory }> = [
  { label: "Trivia", value: "trivia" },
  { label: "Prediction", value: "prediction" },
  { label: "Skill", value: "skill" },
  { label: "Poll", value: "poll" },
  { label: "Custom", value: "custom" },
];

export function CreateChallengeScreen({ navigation, route }: Props) {
  const { partyId } = route.params;
  const currentParty = usePartyStore((state) => state.currentParty);
  const loadParty = usePartyStore((state) => state.loadParty);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stakeAmount, setStakeAmount] = useState(currentParty?.defaultStakePlates ?? 1);
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [oracleType, setOracleType] = useState<ChallengeOracleType>("manual");
  const [category, setCategory] = useState<ChallengeCategory>("trivia");
  const [proofRequired, setProofRequired] = useState(false);
  const [options, setOptions] = useState<DraftOption[]>(() => [
    createDraftOption("Yes"),
    createDraftOption("No"),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentParty?.id !== partyId) {
      void loadParty(partyId);
    }
  }, [currentParty?.id, loadParty, partyId]);

  useEffect(() => {
    if (currentParty?.id === partyId && currentParty.defaultStakePlates > 0) {
      setStakeAmount((previous) => Math.max(previous, currentParty.defaultStakePlates));
    }
  }, [currentParty?.defaultStakePlates, currentParty?.id, partyId]);

  const draftInput = useMemo(
    () => ({
      partyId,
      title,
      description: description.trim() ? description : undefined,
      stakeAmount,
      expiresAt: deadline.toISOString(),
      oracleType,
      category,
      proofRequired,
      options: options.map((option) => option.label.trim()).filter(Boolean),
    }),
    [category, deadline, description, options, oracleType, partyId, proofRequired, stakeAmount, title],
  );

  const validation = useMemo(() => CreateChallengeInputSchema.safeParse(draftInput), [draftInput]);
  const validationMessage = validation.success ? null : validation.error.issues[0]?.message ?? "Check your challenge details.";

  const setOptionLabel = useCallback((id: string, label: string) => {
    setOptions((previous) => previous.map((option) => (option.id === id ? { ...option, label } : option)));
  }, []);

  const addOption = useCallback(() => {
    setOptions((previous) => (previous.length >= 6 ? previous : [...previous, createDraftOption("")]));
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions((previous) => (previous.length <= 2 ? previous : previous.filter((option) => option.id !== id)));
  }, []);

  const adjustStake = useCallback((delta: number) => {
    setStakeAmount((previous) => Math.max(1, previous + delta));
  }, []);

  const handleDeadlineChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) setDeadline(selectedDate);
  }, []);

  const submit = useCallback(async () => {
    const parsed = CreateChallengeInputSchema.safeParse(draftInput);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your challenge details.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const challengeId = await createChallenge(parsed.data);
      navigation.replace("ChallengeDetail", { challengeId });
    } catch (caught) {
      const message = caught instanceof z.ZodError
        ? caught.issues[0]?.message ?? "Check your challenge details."
        : caught instanceof Error
          ? caught.message
          : "Failed to create challenge.";
      setError(message);
      Alert.alert("Could not create challenge", message);
    } finally {
      setSubmitting(false);
    }
  }, [draftInput, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Challenge</Text>
            <Text style={styles.subtitle}>{currentParty?.name ?? "Party challenge"}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              accessibilityLabel="Challenge title"
              accessibilityHint="Enter a title between 3 and 100 characters."
              maxLength={100}
              onChangeText={setTitle}
              placeholder="Best trivia score tonight"
              placeholderTextColor={colors.ash[500]}
              style={styles.input}
              value={title}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              accessibilityLabel="Challenge description"
              accessibilityHint="Optional rules or context."
              maxLength={500}
              multiline
              onChangeText={setDescription}
              placeholder="Add rules, proof notes, or stakes context."
              placeholderTextColor={colors.ash[500]}
              style={[styles.input, styles.textArea]}
              value={description}
            />
          </View>

          <View style={styles.panel}>
            <Text style={styles.label}>Stake Amount</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityLabel="Decrease stake"
                accessibilityRole="button"
                onPress={() => adjustStake(-1)}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>-</Text>
              </Pressable>
              <Text style={styles.stakeText}>{stakeAmount}</Text>
              <Pressable
                accessibilityLabel="Increase stake"
                accessibilityRole="button"
                onPress={() => adjustStake(1)}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.label}>Deadline</Text>
            <Text style={styles.deadlineText}>{formatDeadline(deadline)}</Text>
            <DateTimePicker
              accentColor={colors.glaze[500]}
              display={Platform.OS === "ios" ? "compact" : "default"}
              minimumDate={new Date(Date.now() + 60 * 1000)}
              mode="datetime"
              onChange={handleDeadlineChange}
              textColor={colors.white}
              value={deadline}
            />
          </View>

          <SegmentedField
            label="Oracle Type"
            options={ORACLE_OPTIONS}
            selected={oracleType}
            onSelect={(value) => setOracleType(ChallengeOracleTypeSchema.parse(value))}
          />

          <SegmentedField
            label="Category"
            options={CATEGORY_OPTIONS}
            selected={category}
            onSelect={(value) => setCategory(ChallengeCategorySchema.parse(value))}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.label}>Proof Required</Text>
              <Text style={styles.helper}>Entrants must attach proof before review.</Text>
            </View>
            <Switch
              accessibilityLabel="Proof required"
              onValueChange={setProofRequired}
              thumbColor={proofRequired ? colors.white : colors.ash[400]}
              trackColor={{ false: colors.ink[700], true: colors.glaze[500] }}
              value={proofRequired}
            />
          </View>

          <View style={styles.panel}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Options</Text>
              <Text style={styles.helper}>{options.length}/6</Text>
            </View>

            {options.map((option, index) => (
              <View key={option.id} style={styles.optionRow}>
                <TextInput
                  accessibilityLabel={`Option ${index + 1}`}
                  maxLength={80}
                  onChangeText={(value) => setOptionLabel(option.id, value)}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={colors.ash[500]}
                  style={[styles.input, styles.optionInput]}
                  value={option.label}
                />
                {options.length > 2 ? (
                  <Pressable
                    accessibilityLabel={`Delete option ${index + 1}`}
                    accessibilityRole="button"
                    onPress={() => removeOption(option.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            {options.length < 6 ? (
              <Button title="Add Option" variant="secondary" onPress={addOption} />
            ) : null}
          </View>

          {error || validationMessage ? (
            <Text style={styles.errorText}>{error ?? validationMessage}</Text>
          ) : null}

          <Button
            title={submitting ? "Creating..." : "Create Challenge"}
            size="lg"
            loading={submitting}
            disabled={!validation.success || submitting}
            onPress={() => void submit()}
          />
        </ScrollView>

        {submitting ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.white} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SegmentedField<TValue extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  selected: TValue;
  onSelect: (value: TValue) => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentedRow}>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="button"
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[styles.segment, active ? styles.segmentActive : null]}
            >
              <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createDraftOption(label: string): DraftOption {
  return {
    id: Crypto.randomUUID(),
    label,
  };
}

function formatDeadline(date: Date): string {
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default CreateChallengeScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink[900],
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    gap: spacing[4],
    padding: spacing[5],
    paddingBottom: spacing[10],
  },
  header: {
    gap: spacing[1],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.base,
  },
  field: {
    gap: spacing[2],
  },
  label: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  helper: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
  input: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: typography.sizes.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: "top",
  },
  panel: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  stepperRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepperButton: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.ink[700],
    borderRadius: 8,
    justifyContent: "center",
    width: 44,
  },
  stepperButtonText: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  stakeText: {
    color: colors.gold,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
  },
  deadlineText: {
    color: colors.ash[300],
    fontSize: typography.sizes.base,
  },
  segmentedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  segment: {
    backgroundColor: colors.ink[700],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  segmentActive: {
    backgroundColor: colors.glaze[600],
    borderColor: colors.glaze[500],
  },
  segmentText: {
    color: colors.ash[300],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  segmentTextActive: {
    color: colors.white,
  },
  switchRow: {
    alignItems: "center",
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[4],
    justifyContent: "space-between",
    padding: spacing[4],
  },
  switchCopy: {
    flex: 1,
    gap: spacing[1],
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  optionInput: {
    flex: 1,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: colors.wine[900],
    borderColor: colors.wine[700],
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  deleteButtonText: {
    color: colors.wine[300],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    color: colors.wine[400],
    fontSize: typography.sizes.sm,
  },
  loadingOverlay: {
    alignItems: "center",
    backgroundColor: colors.ink[900],
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
