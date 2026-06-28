import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useOnlineStore } from "../../stores/useOnlineStore";
import { colors, spacing, typography } from "../../theme";

export function OnlineUsersHeader() {
  const onlineCount = useOnlineStore((state) => state.onlineCount);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          { opacity: pulseAnim },
        ]}
      />
      <Text style={styles.text}>Online: {onlineCount.toLocaleString()} players</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 8,
    right: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.success,
    marginRight: spacing[2],
  },
  text: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
