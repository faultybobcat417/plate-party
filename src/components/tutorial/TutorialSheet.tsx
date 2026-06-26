import React from "react";
import { View, Text, Pressable, FlatList, StyleSheet, Modal } from "react-native";
import { useTutorialStore, type TutorialTab, type TutorialStep } from "../../stores/useTutorialStore";

interface TutorialSheetProps {
  visible: boolean;
  tab: TutorialTab;
  onClose: () => void;
  onNavigate: (stepId: string) => void;
}

export function TutorialSheet({ visible, tab, onClose, onNavigate }: TutorialSheetProps) {
  const { steps, completeStep, skipStep, getProgress } = useTutorialStore();
  const pendingSteps = steps.filter((s) => s.tab === tab && !s.completed && !s.skipped);
  const progress = getProgress();

  const handleDoIt = (step: TutorialStep) => {
    if (step.action === "visit") {
      completeStep(step.id);
      onClose();
    } else {
      onNavigate(step.id);
      onClose();
    }
  };

  const handleSkip = (stepId: string) => {
    skipStep(stepId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>🎁 Free Plates Available</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close tutorial sheet">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.completed} / {progress.total} completed ({progress.percentage}%)
          </Text>

          <FlatList
            data={pendingSteps}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepEmoji}>🍽️</Text>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepDesc}>{item.description}</Text>
                  </View>
                  <Text style={styles.stepReward}>+{item.plateReward}</Text>
                </View>
                <View style={styles.stepActions}>
                  <Pressable
                    onPress={() => handleSkip(item.id)}
                    style={[styles.actionBtn, styles.skipBtn]}
                    accessibilityRole="button"
                    accessibilityLabel={`Skip ${item.title}`}
                  >
                    <Text style={styles.skipText}>Skip</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDoIt(item)}
                    style={[styles.actionBtn, styles.doBtn]}
                    accessibilityRole="button"
                    accessibilityLabel={`Complete ${item.title}`}
                  >
                    <Text style={styles.doText}>Do It</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1A1A1A" },
  close: { fontSize: 20, color: "#888", padding: 4 },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    backgroundColor: "#34C759",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
    textAlign: "center",
  },
  list: { paddingBottom: 20 },
  stepCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepEmoji: { fontSize: 24, marginRight: 12 },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginBottom: 4 },
  stepDesc: { fontSize: 13, color: "#888", lineHeight: 18 },
  stepReward: { fontSize: 16, fontWeight: "800", color: "#34C759" },
  stepActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  skipBtn: { backgroundColor: "#F0F0F0" },
  skipText: { color: "#888", fontWeight: "600" },
  doBtn: { backgroundColor: "#34C759" },
  doText: { color: "#fff", fontWeight: "700" },
});
