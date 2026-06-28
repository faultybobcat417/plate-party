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
import { AuthModal } from "../../components/auth/AuthModal";
import type { FeedStackParamList } from "../../navigation/types";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGoalStore } from "../../stores/useGoalStore";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<FeedStackParamList, "CreateGoal">;
type PickerMode = "date" | "time";

export function CreateGoalScreen({ navigation }: Props) {
  const { userId, isAnonymous } = useCurrentUser();
  const { createGoal, isLoading, error, clearError } = useGoalStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selfStakeEnabled, setSelfStakeEnabled] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(5);
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);

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

    if (!userId || isAnonymous) {
      setAuthVisible(true);
      return;
    }

    if (!title.trim()) {
      Alert.alert("Missing title", "Give your goal a clear title.");
      return;
    }

    if (deadlineEnabled && deadline.getTime() <= Date.now()) {
      Alert.alert("Invalid deadline", "Choose a deadline in the future.");
      return;
    }

    try {
      await createGoal({
        userId: userId ?? undefined,
        title: title.trim(),
        description: description.trim() || null,
        stakeAmount: selfStakeEnabled ? stakeAmount : 0,
        deadline: deadlineEnabled ? deadline : null,
      });
      navigation.goBack();
    } catch (caught) {
      Alert.alert("Goal not created", caught instanceof Error ? caught.message : error ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>GROW</Text>
            <Text style={styles.title}>Create Goal</Text>
          </View>
          <Button title="Cancel" size="sm" variant="ghost" onPress={() => navigation.goBack()} />
        </View>

        <Card style={styles.card}>
          <Input
            label="Title"
            placeholder="Meditate every morning"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <Input
            label="Description"
            placeholder="What does success look like?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.label}>Self-Stake</Text>
              <Text style={styles.helper}>Optional plates reserved to keep you accountable.</Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: selfStakeEnabled }}
              onPress={() => setSelfStakeEnabled((value) => !value)}
              style={[styles.switch, selfStakeEnabled && styles.switchOn]}
            >
              <View style={[styles.knob, selfStakeEnabled && styles.knobOn]} />
            </Pressable>
          </View>
          {selfStakeEnabled ? (
            <NumericStepper value={stakeAmount} onChange={setStakeAmount} min={1} max={1000} step={1} />
          ) : null}
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.label}>Deadline</Text>
              <Text style={styles.helper}>Optional target date for this goal.</Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: deadlineEnabled }}
              onPress={() => setDeadlineEnabled((value) => !value)}
              style={[styles.switch, deadlineEnabled && styles.switchOn]}
            >
              <View style={[styles.knob, deadlineEnabled && styles.knobOn]} />
            </Pressable>
          </View>
          {deadlineEnabled ? (
            <>
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
            </>
          ) : null}
        </Card>

        <Button title="Create Goal" size="lg" loading={isLoading} onPress={() => void handleCreate()} />
      </ScrollView>
      <AuthModal
        visible={authVisible}
        reason="Sign in to create goals and save streak progress."
        onClose={() => setAuthVisible(false)}
        onSignedIn={() => setAuthVisible(false)}
      />
    </SafeAreaView>
  );
}

export default CreateGoalScreen;

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
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  card: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderWidth: 1,
    gap: spacing[3],
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: "top",
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
  label: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  helper: {
    color: colors.ash[400],
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: spacing[1],
  },
  switch: {
    backgroundColor: colors.ink[700],
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 56,
  },
  switchOn: {
    backgroundColor: colors.glaze[600],
  },
  knob: {
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 26,
    width: 26,
  },
  knobOn: {
    alignSelf: "flex-end",
  },
  deadline: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  pickerActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
