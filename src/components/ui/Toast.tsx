import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  variant: ToastVariant;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, variant, duration = 3000, onDismiss }: ToastProps) {
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
      ]).start(() => onDismiss());
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss, opacity, translateY]);

  const backgroundColor =
    variant === 'success' ? colors.win :
    variant === 'error' ? colors.lose :
    colors.gold;

  const icon =
    variant === 'success' ? '✅' :
    variant === 'error' ? '❌' :
    'ℹ️';

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 40,
        left: spacing[3],
        right: spacing[3],
        opacity,
        transform: [{ translateY }],
        backgroundColor,
        borderRadius: 8,
        padding: spacing[3],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 20, marginRight: spacing[2] }}>{icon}</Text>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: '#FFFFFF', flex: 1 }}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss">
        <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}