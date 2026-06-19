import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { colors, spacing, typography } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";

export type SplashScreenProps = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: SplashScreenProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 900 });
    translateY.value = withTiming(0, { duration: 900 });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.logo}>🍽</Text>
        <Text style={styles.title}>Plate Party</Text>
        <Text style={styles.subtitle}>Friendly wagers. Charitable outcomes.</Text>
      </Animated.View>
      <View style={styles.footer}>
        <Button
          title="Get Started"
          size="lg"
          onPress={() => navigation.replace("Onboarding")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  logo: {
    fontSize: typography.sizes["5xl"],
    marginBottom: spacing[4],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  subtitle: {
    color: colors.ash[600],
    fontSize: typography.sizes.md,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
});
