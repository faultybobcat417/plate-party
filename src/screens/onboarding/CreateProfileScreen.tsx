import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { colors, spacing, typography } from "../../theme";
import { createUuid } from "../../db/schema";
import {
  AVATAR_COLORS,
  loadProfile,
  saveProfile,
  type UserProfile,
} from "../../utils/profileStorage";
import type { RootStackParamList } from "../../navigation/types";

export type CreateProfileScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CreateProfile"
>;

export function CreateProfileScreen({ navigation }: CreateProfileScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0].value);
  const [venmoHandle, setVenmoHandle] = useState("");
  const [cashAppHandle, setCashAppHandle] = useState("");
  const [paypalMeHandle, setPaypalMeHandle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const existing = await loadProfile();
      if (mounted && existing) {
        setDisplayName(existing.displayName);
        setAvatarColor(existing.avatarColor);
        setVenmoHandle(existing.venmoHandle ?? "");
        setCashAppHandle(existing.cashAppHandle ?? "");
        setPaypalMeHandle(existing.paypalMeHandle ?? "");
      }
      if (mounted) setIsLoading(false);
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Display name is required.");
      return;
    }

    const existing = await loadProfile();
    const profile: UserProfile = {
      id: existing?.id ?? createUuid(),
      deviceId: existing?.deviceId ?? createUuid(),
      displayName: trimmedName,
      avatarColor,
      venmoHandle: venmoHandle.trim() || undefined,
      cashAppHandle: cashAppHandle.trim() || undefined,
      paypalMeHandle: paypalMeHandle.trim() || undefined,
    };

    await saveProfile(profile);
    setError(null);
    navigation.replace("Main");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.glaze[600]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create your profile</Text>
        <Text style={styles.subtitle}>
          This is how friends will see you in parties.
        </Text>

        <Input
          label="Display name"
          placeholder="e.g. Plate King"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

        <Text style={styles.sectionLabel}>Avatar color</Text>
        <View style={styles.colorRow}>
          {AVATAR_COLORS.map((color) => (
            <Pressable
              key={color.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: avatarColor === color.value }}
              onPress={() => setAvatarColor(color.value)}
              style={[
                styles.colorButton,
                { backgroundColor: color.value },
                avatarColor === color.value && styles.colorButtonSelected,
              ]}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Input
          label="Venmo handle"
          placeholder="@username"
          value={venmoHandle}
          onChangeText={setVenmoHandle}
          autoCapitalize="none"
        />
        <Input
          label="Cash App handle"
          placeholder="$cashtag"
          value={cashAppHandle}
          onChangeText={setCashAppHandle}
          autoCapitalize="none"
        />
        <Input
          label="PayPal.Me handle"
          placeholder="paypal.me/username"
          value={paypalMeHandle}
          onChangeText={setPaypalMeHandle}
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Button title="Save & Continue" size="lg" onPress={handleSave} />
        </View>
      </ScrollView>
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
  scroll: {
    padding: spacing[6],
  },
  title: {
    color: colors.ink[900],
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  subtitle: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginBottom: spacing[6],
  },
  sectionLabel: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[2],
  },
  colorRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  colorButton: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  colorButtonSelected: {
    borderColor: colors.ink[900],
    borderWidth: 3,
  },
  divider: {
    backgroundColor: colors.ash[200],
    height: 1,
    marginBottom: spacing[4],
  },
  error: {
    color: colors.wine[500],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[4],
  },
  footer: {
    marginTop: spacing[4],
  },
});
