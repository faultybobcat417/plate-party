import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { NumericStepper } from "../../components/primitives/NumericStepper";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";
import { loadProfile } from "../../utils/profileStorage";
import type { PartyStackParamList } from "../../navigation/types";

export type CreatePartyScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "CreateParty"
>;

export function CreatePartyScreen({ navigation }: CreatePartyScreenProps) {
  const { createParty, isLoading, error, clearError } = usePartyStore();
  const [name, setName] = useState("");
  const [charityOrgName, setCharityOrgName] = useState("");
  const [charityOrgUrl, setCharityOrgUrl] = useState("");
  const [defaultStakePlates, setDefaultStakePlates] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleCreate = async () => {
    clearError();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Party name is required.");
      return;
    }
    if (!charityOrgName.trim()) {
      setValidationError("Charity name is required.");
      return;
    }

    const profile = await loadProfile();
    if (!profile?.id || !profile.deviceId) {
      setValidationError("Profile not found. Please create a profile first.");
      return;
    }

    try {
      const result = await createParty({
        name: name.trim(),
        charityOrgName: charityOrgName.trim(),
        charityOrgUrl: charityOrgUrl.trim() || null,
        defaultStakePlates,
        createdByUserId: profile.id,
        deviceId: profile.deviceId,
      });

      navigation.replace("PartyDetail", { partyId: result.party.id });
    } catch {
      // Error is handled by the store and surfaced below.
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create a party</Text>
        <Text style={styles.subtitle}>
          Start a new group, pick a charity, and invite your friends.
        </Text>

        <Input
          label="Party name"
          placeholder="e.g. Sunday Football Crew"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Charity organization"
          placeholder="e.g. Feeding America"
          value={charityOrgName}
          onChangeText={setCharityOrgName}
        />
        <Input
          label="Charity URL (optional)"
          placeholder="https://..."
          value={charityOrgUrl}
          onChangeText={setCharityOrgUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.sectionLabel}>Default stake plates</Text>
        <NumericStepper
          value={defaultStakePlates}
          onChange={setDefaultStakePlates}
          min={1}
          max={20}
        />

        {(validationError || error) ? (
          <Text style={styles.error}>{validationError ?? error}</Text>
        ) : null}

        <View style={styles.footer}>
          <Button
            title="Create Party"
            size="lg"
            loading={isLoading}
            onPress={handleCreate}
          />
        </View>
      </ScrollView>
      {isLoading ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.glaze[600]} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
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
    marginTop: spacing[2],
  },
  error: {
    color: colors.wine[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[4],
  },
  footer: {
    marginTop: spacing[6],
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
