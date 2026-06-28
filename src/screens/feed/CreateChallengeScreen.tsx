import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Input } from "../../components/primitives/Input";
import { NumericStepper } from "../../components/primitives/NumericStepper";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import type { ChallengeType } from "../../api/challenge";
import type { FeedStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useChallengeStore } from "../../stores/useChallengeStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<FeedStackParamList, "CreateChallenge">;
type PickerMode = "date" | "time";
type ProofRequirement = "photo" | "video" | "text" | "file";

const CHALLENGE_TYPES: { label: string; value: ChallengeType }[] = [
  { label: "Public", value: "public" },
  { label: "Bounty", value: "bounty" },
  { label: "Group", value: "group" },
];

const PROOF_REQUIREMENTS: { value: ProofRequirement; label: string }[] = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "text", label: "Text" },
  { value: "file", label: "File" },
];

export function CreateChallengeScreen({ navigation }: Props) {
  const { userId, isAuthenticated } = useCurrentUser();
  const { createChallenge, isLoading, error, clearError } = useChallengeStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("public");
  const [rewardPlates, setRewardPlates] = useState(25);
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [proofRequirements, setProofRequirements] = useState<ProofRequirement[]>(["photo", "text"]);

  const toggleRequirement = (requirement: ProofRequirement) => {
    setProofRequirements((current) =>
      current.includes(requirement)
        ? current.filter((item) => item !== requirement)
        : [...current, requirement],
    );
  };

  const openPicker = (mode: PickerMode) => {
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const handleDeadlineChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setPickerVisible(false);
    if (!selectedDate) return;
    setDeadline(selectedDate);
  };

  const handleCreate = async () => {
    clearError();

    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in before creating a challenge.");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Missing title", "Add a short challenge title.");
      return;
    }

    if (deadline.getTime() <= Date.now()) {
      Alert.alert("Invalid deadline", "Choose a deadline in the future.");
      return;
    }

    if (proofRequirements.length === 0) {
      Alert.alert("Proof required", "Choose at least one proof requirement.");
      return;
    }

    try {
      await createChallenge({
        creatorId: userId ?? undefined,
        title: title.trim(),
        description: description.trim() || null,
        type,
        rewardPlates,
        stakeAmount: rewardPlates,
        deadline: deadline.toISOString(),
        proofRequirements,
      });
      navigation.goBack();
    } catch (caught) {
      Alert.alert("Challenge not created", caught instanceof Error ? caught.message : error ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>STEAK</Text>
            <Text style={styles.title}>Create Challenge</Text>
          </View>
          <Button title="Cancel" variant="ghost" size="sm" onPress={() => navigation.goBack()} />
        </View>

        <Card style={styles.card}>
          <Input
            label="Title"
            placeholder="Run 5K before Friday"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <Input
            label="Description"
            placeholder="What counts as completed proof?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Text style={styles.label}>Challenge Type</Text>
          <SegmentedControl options={CHALLENGE_TYPES} value={type} onChange={setType} />
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.label}>Plate Reward</Text>
              <Text style={styles.helper}>Deducted immediately when the Edge Function creates it.</Text>
            </View>
            <NumericStepper value={rewardPlates} onChange={setRewardPlates} min={1} max={10000} step={5} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Deadline</Text>
          <Text style={styles.deadline}>{deadline.toLocaleString()}</Text>
          <View style={styles.pickerActions}>
            <Button title="Pick Date" size="sm" variant="secondary" onPress={() => openPicker("date")} />
            <Button title="Pick Time" size="sm" variant="secondary" onPress={() => openPicker("time")} />
          </View>
          {pickerVisible ? (
            <DateTimePicker
              value={deadline}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={handleDeadlineChange}
            />
          ) : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Proof Requirements</Text>
          <View style={styles.requirements}>
            {PROOF_REQUIREMENTS.map((requirement) => {
              const selected = proofRequirements.includes(requirement.value);
              return (
                <Pressable
                  key={requirement.value}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleRequirement(requirement.value)}
                  style={[styles.requirement, selected && styles.requirementSelected]}
                >
                  <Text style={[styles.requirementText, selected && styles.requirementTextSelected]}>
                    {requirement.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Button
          title="Create Challenge"
          size="lg"
          loading={isLoading}
          onPress={() => void handleCreate()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  scroll: {
    gap: spacing[4],
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.glaze[300],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  card: {
    gap: spacing[3],
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: "top",
  },
  label: {
    color: colors.ink[800],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  helper: {
    color: colors.ash[600],
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: spacing[1],
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  flex: {
    flex: 1,
  },
  deadline: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  pickerActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  requirements: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  requirement: {
    borderColor: colors.ash[300],
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  requirementSelected: {
    backgroundColor: colors.glaze[100],
    borderColor: colors.glaze[500],
  },
  requirementText: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  requirementTextSelected: {
    color: colors.glaze[800],
  },
});
