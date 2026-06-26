import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useOnboardingStore } from "../../stores/useOnboardingStore";
import { INTENTION_OPTIONS } from "../../types/onboarding";
import { createChallenge } from "../../api/challenge";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const STAKE_OPTIONS = [10, 25, 50, 100, 200];

export function OnboardingFirstGoalScreen() {
  const { intention, addPlates, setStep, setFirstGoal, platesEarned } =
    useOnboardingStore();
  const { userId } = useCurrentUser();
  const [customTitle, setCustomTitle] = useState("");
  const [stake, setStake] = useState(50);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const intentionData = INTENTION_OPTIONS.find((i) => i.id === intention);
  const templates = intentionData?.suggestedGoals || [
    "Walk 10k steps daily",
    "Read 20 pages",
    "Meditate 10 min",
  ];

  const handleCreate = async () => {
    if (!userId) return;
    const title = selectedTemplate || customTitle || "My First Goal";
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    await createChallenge({
      creatorId: userId,
      title,
      type: "self",
      rewardPlates: stake,
      deadline: deadline.toISOString(),
    });

    setFirstGoal({ title, stake });
    addPlates(200);
    setStep("complete");
  };

  const remaining = platesEarned - stake;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your First Goal</Text>
        <Text style={styles.sub}>What do you want to achieve this week?</Text>
      </View>

      <FlatList
        data={templates}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.templateCard,
              selectedTemplate === item && styles.templateSelected,
            ]}
            onPress={() => {
              setSelectedTemplate(item);
              setCustomTitle("");
            }}
          >
            <Text style={styles.templateEmoji}>✨</Text>
            <Text style={styles.templateText}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />

      <View style={styles.customRow}>
        <TextInput
          style={styles.input}
          placeholder="Or write your own..."
          value={customTitle}
          onChangeText={(text) => {
            setCustomTitle(text);
            setSelectedTemplate(null);
          }}
        />
      </View>

      <View style={styles.stakeSection}>
        <Text style={styles.stakeLabel}>Stake (plates)</Text>
        <View style={styles.stakeOptions}>
          {STAKE_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.stakePill, stake === s && styles.stakeActive]}
              onPress={() => setStake(s)}
            >
              <Text style={[styles.stakeText, stake === s && { color: "#fff" }]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.remaining}>
          You'll have {remaining} plates left
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, remaining < 0 && styles.disabled]}
        onPress={handleCreate}
        disabled={remaining < 0}
      >
        <Text style={styles.buttonText}>Start My Goal +200</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingHorizontal: 20 },
  header: { marginTop: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A" },
  sub: { fontSize: 14, color: "#888" },
  templateList: { paddingVertical: 8 },
  templateCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 140,
    borderWidth: 2,
    borderColor: "transparent",
  },
  templateSelected: { borderColor: "#34C759", backgroundColor: "#F0FFF0" },
  templateEmoji: { fontSize: 32, marginBottom: 8 },
  templateText: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  customRow: { marginVertical: 16 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  stakeSection: { marginVertical: 8 },
  stakeLabel: { fontWeight: "600", fontSize: 16, marginBottom: 8 },
  stakeOptions: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  stakePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
    marginBottom: 8,
  },
  stakeActive: { backgroundColor: "#34C759" },
  stakeText: { fontWeight: "600", color: "#1A1A1A" },
  remaining: { fontSize: 14, color: "#888", marginTop: 4 },
  button: {
    backgroundColor: "#34C759",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  disabled: { backgroundColor: "#ccc" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 18 },
});
