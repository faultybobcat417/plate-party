import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { Card } from "../../components/primitives/Card";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { useChallengeStore } from "../../stores/useChallengeStore";
import type { ChallengeType } from "../../api/challenge";

const CHALLENGE_TYPES: { label: string; value: ChallengeType }[] = [
  { label: "Self", value: "self" },
  { label: "Bounty", value: "bounty" },
  { label: "Group", value: "group" },
];

export function CreateChallengeScreen() {
  const navigation = useNavigation();
  const { addChallenge, isLoading, error } = useChallengeStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("self");
  const [rewardPlates, setRewardPlates] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !rewardPlates.trim() || !deadline.trim()) {
      Alert.alert("Missing Info", "Please fill in title, plates, and deadline.");
      return;
    }

    const plates = parseInt(rewardPlates, 10);
    if (isNaN(plates) || plates <= 0) {
      Alert.alert("Invalid Reward", "Reward plates must be a positive number.");
      return;
    }

    try {
      await addChallenge({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        rewardPlates: plates,
        deadline: new Date(deadline).toISOString(),
        creatorId: "user-1",
      });
      navigation.goBack();
    } catch {
      Alert.alert("Error", error || "Failed to create challenge.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New Challenge</Text>

        <Card style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Gym 5 times this week"
            placeholderTextColor={colors.ash[400]}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.ash[400]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Type</Text>
          <SegmentedControl
            options={CHALLENGE_TYPES}
            value={type}
            onChange={(value) => setType(value)}
          />

          <Text style={styles.label}>Reward Plates</Text>
          <TextInput
            style={styles.input}
            placeholder="50"
            placeholderTextColor={colors.ash[400]}
            value={rewardPlates}
            onChangeText={setRewardPlates}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Deadline</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.ash[400]}
            value={deadline}
            onChangeText={setDeadline}
          />
        </Card>

        <View style={styles.actions}>
          <Pressable
            onPress={handleCreate}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.glaze[700] : colors.glaze[600],
              padding: spacing[4],
              borderRadius: 12,
              alignItems: "center",
              opacity: isLoading ? 0.6 : 1,
            })}
          >
            <Text style={{ color: colors.linen[100], fontWeight: typography.weights.bold }}>
              {isLoading ? "Creating..." : "Create Challenge"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              padding: spacing[4],
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: pressed ? colors.ash[200] : "transparent",
            })}
          >
            <Text style={{ color: colors.ash[600] }}>Cancel</Text>
          </Pressable>
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
  card: {
    marginBottom: spacing[4],
  },
  label: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ash[300],
    borderRadius: 8,
    padding: spacing[3],
    fontSize: typography.sizes.base,
    color: colors.ink[900],
    backgroundColor: colors.linen[100],
    marginBottom: spacing[3],
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  actions: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
});
