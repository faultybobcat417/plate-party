import React, { useEffect, useRef, useMemo } from "react";
import { Pressable, Text, View, Animated, StyleSheet } from "react-native";
import { useTutorialStore, type TutorialTab } from "../../stores/useTutorialStore";

interface FreePlateButtonProps {
  tab: TutorialTab;
  onPress: () => void;
}

export function FreePlateButton({ tab, onPress }: FreePlateButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const steps = useTutorialStore((state) => state.steps);
  
  const pendingSteps = useMemo(
    () => steps.filter((s) => s.tab === tab && !s.completed && !s.skipped),
    [steps, tab]
  );
  const hasPending = pendingSteps.length > 0;

  useEffect(() => {
    if (!hasPending) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [hasPending, scale]);

  if (!hasPending) return null;

  const totalReward = pendingSteps.reduce((sum, s) => sum + (s.plateReward ?? 0), 0);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={`Free plate button. ${pendingSteps.length} pending steps worth ${totalReward} plates`}
      >
        <Text style={styles.emoji}>🎁</Text>
        <Text style={styles.text}>Free Plate</Text>
        {pendingSteps.length > 1 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingSteps.length}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    right: 16,
    zIndex: 100,
    elevation: 5,
  },
  button: {
    backgroundColor: "#FF6B35",
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emoji: { fontSize: 20, marginRight: 6 },
  text: { color: "#fff", fontWeight: "700", fontSize: 14 },
  badge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: { color: "#FF6B35", fontSize: 12, fontWeight: "800" },
});
