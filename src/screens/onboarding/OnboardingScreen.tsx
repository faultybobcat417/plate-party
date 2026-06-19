import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { colors, spacing, typography } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";

export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const bullets = [
  { icon: "🍽", title: "Bet with plates", description: "Wager virtual plates on predictions with friends." },
  { icon: "🎯", title: "Pick outcomes", description: "Create yes/no or multi-option wagers in seconds." },
  { icon: "🏆", title: "Climb the leaderboard", description: "Track wins, streaks, and bragging rights." },
  { icon: "❤️", title: "Give back", description: "Losing plates can feed a charity pool for good causes." },
];

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome to Plate Party</Text>
        <Text style={styles.tagline}>
          The social betting game where every plate makes a difference.
        </Text>
      </View>
      <View style={styles.bullets}>
        {bullets.map((bullet) => (
          <View key={bullet.title} style={styles.bullet}>
            <Text style={styles.bulletIcon}>{bullet.icon}</Text>
            <View style={styles.bulletText}>
              <Text style={styles.bulletTitle}>{bullet.title}</Text>
              <Text style={styles.bulletDescription}>{bullet.description}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Button
          title="Create Profile"
          size="lg"
          onPress={() => navigation.navigate("CreateProfile")}
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
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
  },
  welcome: {
    color: colors.ink[900],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  tagline: {
    color: colors.ash[600],
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.md,
  },
  bullets: {
    flex: 1,
    gap: spacing[4],
    paddingHorizontal: spacing[6],
  },
  bullet: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4],
  },
  bulletIcon: {
    fontSize: typography.sizes["2xl"],
  },
  bulletText: {
    flex: 1,
  },
  bulletTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  bulletDescription: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
});
