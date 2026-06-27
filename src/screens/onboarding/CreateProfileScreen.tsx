import { useEffect, useMemo, useState } from "react";
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

const DISPLAY_NAME_MAX_LENGTH = 30;
const HANDLE_MAX_LENGTH = 50;

export function CreateProfileScreen({ navigation }: CreateProfileScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0].value);
  const [venmoHandle, setVenmoHandle] = useState("");
  const [cashAppHandle, setCashAppHandle] = useState("");
  const [paypalMeHandle, setPaypalMeHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    venmoHandle?: string;
    cashAppHandle?: string;
    paypalMeHandle?: string;
  }>({});

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const existing = await loadProfile();
      if (mounted && existing) {
        setDisplayName(existing.displayName);
        setAvatarColor(existing.avatarColor ?? avatarColor);
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

  const isValid = useMemo(() => {
    const trimmedName = displayName.trim();
    return (
      trimmedName.length > 0 &&
      trimmedName.length <= DISPLAY_NAME_MAX_LENGTH &&
      venmoHandle.trim().length <= HANDLE_MAX_LENGTH &&
      cashAppHandle.trim().length <= HANDLE_MAX_LENGTH &&
      paypalMeHandle.trim().length <= HANDLE_MAX_LENGTH &&
      !venmoHandle.includes(" ") &&
      !cashAppHandle.includes(" ") &&
      !paypalMeHandle.includes(" ")
    );
  }, [displayName, venmoHandle, cashAppHandle, paypalMeHandle]);

  const validateFields = () => {
    const trimmedName = displayName.trim();
    const nextErrors: typeof fieldErrors = {};

    if (!trimmedName) {
      nextErrors.displayName = "Display name is required.";
    } else if (trimmedName.length > DISPLAY_NAME_MAX_LENGTH) {
      nextErrors.displayName = `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or less.`;
    }

    const validateHandle = (value: string, label: string) => {
      if (value.length > HANDLE_MAX_LENGTH) {
        return `${label} must be ${HANDLE_MAX_LENGTH} characters or less.`;
      }
      if (value.includes(" ")) {
        return `${label} cannot contain spaces.`;
      }
      return undefined;
    };

    nextErrors.venmoHandle = validateHandle(venmoHandle.trim(), "Venmo handle");
    nextErrors.cashAppHandle = validateHandle(
      cashAppHandle.trim(),
      "Cash App handle",
    );
    nextErrors.paypalMeHandle = validateHandle(
      paypalMeHandle.trim(),
      "PayPal.Me handle",
    );

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).every((e) => !e);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setError(null);

    if (!validateFields()) {
      return;
    }

    setIsSaving(true);
    try {
      const trimmedName = displayName.trim();
      const existing = await loadProfile();
      const profile: UserProfile = {
        id: existing?.id ?? createUuid(),
        deviceId: existing?.deviceId ?? createUuid(),
        displayName: trimmedName,
        username: existing?.username ?? trimmedName.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30),
        plates: existing?.plates ?? 100,
        avatarColor,
        venmoHandle: venmoHandle.trim() || undefined,
        cashAppHandle: cashAppHandle.trim() || undefined,
        paypalMeHandle: paypalMeHandle.trim() || undefined,
      };

      await saveProfile(profile);
      navigation.replace("Main" as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
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
          onChangeText={(text) => {
            setDisplayName(text);
            setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
            setError(null);
          }}
          error={fieldErrors.displayName}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoCapitalize="words"
          accessibilityLabel="Display name"
        />

        <Text style={styles.sectionLabel}>Avatar color</Text>
        <View style={styles.colorRow}>
          {AVATAR_COLORS.map((color) => (
            <Pressable
              key={color.value}
              accessibilityRole="radio"
              accessibilityLabel={`Select ${color.name} avatar`}
              accessibilityState={{ checked: avatarColor === color.value }}
              onPress={() => setAvatarColor(color.value)}
              style={({ pressed }) => [
                styles.colorButton,
                { backgroundColor: color.value },
                avatarColor === color.value && styles.colorButtonSelected,
                pressed && styles.colorButtonPressed,
              ]}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Input
          label="Venmo handle"
          placeholder="@username"
          value={venmoHandle}
          onChangeText={(text) => {
            setVenmoHandle(text);
            setFieldErrors((prev) => ({ ...prev, venmoHandle: undefined }));
            setError(null);
          }}
          error={fieldErrors.venmoHandle}
          maxLength={HANDLE_MAX_LENGTH}
          autoCapitalize="none"
          accessibilityLabel="Venmo handle"
        />
        <Input
          label="Cash App handle"
          placeholder="$cashtag"
          value={cashAppHandle}
          onChangeText={(text) => {
            setCashAppHandle(text);
            setFieldErrors((prev) => ({ ...prev, cashAppHandle: undefined }));
            setError(null);
          }}
          error={fieldErrors.cashAppHandle}
          maxLength={HANDLE_MAX_LENGTH}
          autoCapitalize="none"
          accessibilityLabel="Cash App handle"
        />
        <Input
          label="PayPal.Me handle"
          placeholder="paypal.me/username"
          value={paypalMeHandle}
          onChangeText={(text) => {
            setPaypalMeHandle(text);
            setFieldErrors((prev) => ({ ...prev, paypalMeHandle: undefined }));
            setError(null);
          }}
          error={fieldErrors.paypalMeHandle}
          maxLength={HANDLE_MAX_LENGTH}
          autoCapitalize="none"
          accessibilityLabel="PayPal.Me handle"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Button
            title="Save & Continue"
            size="lg"
            loading={isSaving}
            disabled={!isValid}
            accessibilityLabel="Save profile and continue"
            onPress={handleSave}
          />
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
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  colorButtonSelected: {
    borderColor: colors.ink[900],
    borderWidth: 3,
  },
  colorButtonPressed: {
    opacity: 0.8,
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
