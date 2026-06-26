import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

const typeStyles: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: colors.semantic.successBg, border: colors.semantic.success, text: colors.semantic.success },
  error: { bg: colors.semantic.errorBg, border: colors.semantic.error, text: colors.semantic.error },
  info: { bg: colors.semantic.infoBg, border: colors.semantic.info, text: colors.semantic.info },
  warning: { bg: colors.semantic.warningBg, border: colors.semantic.warning, text: colors.semantic.warning },
};

export function Toast({ message, type = "info", duration = 3000, onDismiss }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss?.());
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const styles = typeStyles[type];

  return (
    <Animated.View
      style={[
        containerStyle.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: styles.bg,
          borderColor: styles.border,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Text style={[containerStyle.text, { color: styles.text }]}>{message}</Text>
    </Animated.View>
  );
}

const containerStyle = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    alignItems: "center",
  },
  text: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});
