import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

import { colors, typography } from "../../theme";

interface OnlineBadgeProps {
  count: number;
}

export const OnlineBadge: React.FC<OnlineBadgeProps> = ({ count }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <Animated.View
      style={[
        styles.badge,
        { transform: [{ scale: pulseAnim }] },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${count} users online`}
    >
      <Text style={styles.text}>{count}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 10,
    backgroundColor: colors.wine[500],
  },
  text: {
    textAlign: "center",
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    lineHeight: 18,
  },
});
