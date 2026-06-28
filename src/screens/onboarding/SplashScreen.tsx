import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { colors, spacing, typography } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";

export type SplashScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Splash"
>;

export function SplashScreen({ navigation }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace("Main", { screen: "PartyTab" });
    }, 700);

    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [navigation, opacity, translateY]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.logo}>Plate Party</Text>
        <Text style={styles.subtitle}>Friendly wagers. Charitable outcomes.</Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.glaze[500]} />
          <Text style={styles.loadingText}>Opening party mode...</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink[900],
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    gap: spacing[3],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  logo: {
    color: colors.white,
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.md,
    textAlign: "center",
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[4],
  },
  loadingText: {
    color: colors.ash[400],
    fontSize: typography.sizes.sm,
  },
});
