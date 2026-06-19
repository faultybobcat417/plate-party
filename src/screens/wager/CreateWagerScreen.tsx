import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { NumericStepper } from "../../components/primitives/NumericStepper";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import type { PartyStackParamList } from "../../navigation/types";
import { useWagerStore } from "../../stores/useWagerStore";
import { colors, spacing, typography } from "../../theme";
import { getCurrentUserId, getDeviceId } from "../../utils/identity";

type Props = NativeStackScreenProps<PartyStackParamList, "CreateWager">;

const oracleOptions: Array<{ value: "manual" | "weather" | "crypto"; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "weather", label: "Weather" },
  { value: "crypto", label: "Crypto" },
];

export function CreateWagerScreen({ route, navigation }: Props) {
  const { partyId } = route.params;
  const createWager = useWagerStore((state) => state.createWager);
  const isLoading = useWagerStore((state) => state.isLoading);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [stakePlates, setStakePlates] = useState(1);
  const [deadline, setDeadline] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toISOString();
  });
  const [oracleType, setOracleType] = useState<"manual" | "weather" | "crypto">("manual");
  const [userId, setUserId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [uid, did] = await Promise.all([getCurrentUserId(), getDeviceId()]);
      setUserId(uid);
      setDeviceId(did);
    })();
  }, []);

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const next = [...options];
      next.splice(index, 1);
      setOptions(next);
    }
  };

  const handleCreate = async () => {
    if (!userId || !deviceId) {
      Alert.alert("Missing profile", "Please finish onboarding before creating a wager.");
      return;
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 6) {
      Alert.alert("Invalid question", "Wager question must be at least 6 characters.");
      return;
    }

    const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);
    if (trimmedOptions.length < 2) {
      Alert.alert("Invalid options", "Please provide at least 2 options.");
      return;
    }

    if (new Date(deadline).getTime() <= Date.now()) {
      Alert.alert("Invalid deadline", "Deadline must be in the future.");
      return;
    }

    try {
      const result = await createWager({
        partyId,
        createdByUserId: userId,
        deviceId,
        question: trimmedQuestion,
        options: trimmedOptions.map((label) => ({ label })),
        stakePlates,
        deadline,
        oracleType,
      });

      navigation.replace("WagerDetail", {
        wagerId: result.wager.id,
        partyId,
      });
    } catch (error) {
      Alert.alert(
        "Failed to create wager",
        error instanceof Error ? error.message : "An unexpected error occurred.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Create Wager</Text>

        <Input
          label="Question"
          placeholder="Will it rain on Saturday?"
          value={question}
          onChangeText={setQuestion}
          helper="Ask a question with at least 6 characters."
        />

        <Text style={styles.sectionLabel}>Options</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <Input
              style={styles.optionInput}
              placeholder={`Option ${index + 1}`}
              value={option}
              onChangeText={(value) => updateOption(index, value)}
            />
            {options.length > 2 ? (
              <Button
                title="−"
                variant="ghost"
                size="sm"
                onPress={() => removeOption(index)}
              />
            ) : null}
          </View>
        ))}

        {options.length < 6 ? (
          <Button
            title="Add option"
            variant="secondary"
            size="sm"
            onPress={addOption}
          />
        ) : null}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Stake plates</Text>
          <NumericStepper value={stakePlates} onChange={setStakePlates} min={1} max={100} />
        </View>

        <Input
          label="Deadline"
          value={deadline}
          onChangeText={setDeadline}
          helper="Enter an ISO timestamp (e.g. 2026-06-20T12:00:00.000Z)."
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Oracle</Text>
          <SegmentedControl
            options={oracleOptions}
            value={oracleType}
            onChange={setOracleType}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Create Wager"
            onPress={() => void handleCreate()}
            loading={isLoading}
            disabled={!userId || !deviceId}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  scroll: {
    padding: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[4],
  },
  sectionLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1],
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  optionInput: {
    flex: 1,
  },
  field: {
    marginBottom: spacing[4],
  },
  fieldLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1],
  },
  actions: {
    marginTop: spacing[4],
  },
});
