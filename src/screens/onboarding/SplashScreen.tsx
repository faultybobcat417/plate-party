import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { colors, spacing, typography } from "../../theme";
import { loadProfile } from "../../utils/profileStorage";
import type { RootStackParamList } from "../../navigation/types";

export type SplashScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Splash"
>;

export function SplashScreen({ navigation }: SplashScreenProps) {
  const [isReady, setIsReady] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const profile = await loadProfile();
      if (!mounted) return;

      if (profile && profile.displayName.trim()) {
        navigation.replace("Main" as any);
        return;
      }

      setIsReady(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();
    }

    void bootstrap();

    return () => {
      mounted = false;
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [navigation, opacity, translateY]);

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.glaze[600]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.logo}>🍽</Text>
        <Text style={styles.title}>Plate Party</Text>
        <Text style={styles.subtitle}>
          Friendly wagers. Charitable outcomes.
        </Text>
      </Animated.View>
      <View style={styles.footer}>
        <Button
          title="Get Started"
          size="lg"
          accessibilityLabel="Get started"
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
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
