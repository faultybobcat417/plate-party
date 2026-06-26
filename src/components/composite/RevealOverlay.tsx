import { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "../primitives/Button";
import { colors, spacing, typography } from "../../theme";

export type RevealOverlayProps = {
  visible: boolean;
  won: boolean;
  amount: number;
  onClose: () => void;
};

export function RevealOverlay({
  visible,
  won,
  amount,
  onClose,
}: RevealOverlayProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={[
          styles.backdrop,
          { backgroundColor: won ? colors.glaze[900] : colors.wine[900] },
        ]}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity, transform: [{ scale }] },
          ]}
        >
          <Text style={styles.emoji}>{won ? "🎉" : "😢"}</Text>
          <Text style={styles.title}>{won ? "You Won!" : "You Lost"}</Text>
          <Text style={styles.amount}>
            {won ? `+${amount}` : `-${amount}`} 🍽
          </Text>
          <Button title="Done" onPress={onClose} variant="secondary" />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
  },
  content: {
    alignItems: "center",
    backgroundColor: colors.linen[50],
    borderRadius: 24,
    padding: spacing[8],
    width: "100%",
  },
  emoji: {
    fontSize: typography.sizes["5xl"],
    marginBottom: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  amount: {
    color: colors.ink[700],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[6],
  },
});
