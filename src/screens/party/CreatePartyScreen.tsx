import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { z } from "zod";

import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { usePartyStore } from "../../stores/usePartyStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";
import type { PartyStackParamList } from "../../navigation/types";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

export type CreatePartyScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "CreateParty"
>;

const CreatePartySchema = z.object({
  name: z.string().trim().min(1, "Party name is required.").max(50, "Max 50 characters."),
  description: z.string().trim().max(200, "Max 200 characters.").optional(),
  isPrivate: z.boolean().default(false),
});

export function CreatePartyScreen({ navigation }: CreatePartyScreenProps) {
  const { createParty, isLoading, error, clearError } = usePartyStore();
  const { userId } = useCurrentUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleCreate = useCallback(async () => {
    clearError();
    setValidationError(null);

    if (!userId) {
      setValidationError("You must be signed in to create a party.");
      return;
    }

    const parsed = CreatePartySchema.safeParse({ name, description, isPrivate });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    try {
      const result = await createParty({
        name: parsed.data.name,
        charityOrgName: "General Charity",
        defaultStakePlates: 1,
        createdByUserId: userId,
        deviceId: "mobile",
      });
      navigation.replace("PartyDetail", { partyId: result.party.id });
    } catch {
      // Error surfaced by store
    }
  }, [name, description, isPrivate, userId, createParty, clearError, navigation]);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create Party</Text>
          <Text style={styles.subtitle}>Start a new group and invite your friends.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Party Name *</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g., Weekend Warriors"
              maxLength={50}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="What's this party about?"
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Private Party</Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.ink[700], true: colors.glaze[500] }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.hint}>Private parties require an invite code to join.</Text>

          {(validationError || error) ? (
            <Text style={styles.errorText}>{validationError ?? error}</Text>
          ) : null}

          <Button
            title="Create Party"
            onPress={handleCreate}
            disabled={isLoading || !name.trim()}
            loading={isLoading}
          />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  scroll: { padding: spacing[6], paddingBottom: spacing[10] },
  title: { fontSize: typography.sizes["3xl"], fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[2] },
  subtitle: { fontSize: typography.sizes.base, color: colors.ash[400], marginBottom: spacing[6] },
  field: { marginBottom: spacing[5] },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.ash[300], marginBottom: spacing[2] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[2] },
  hint: { fontSize: typography.sizes.xs, color: colors.ash[500], marginBottom: spacing[5] },
  errorText: { color: colors.wine[400], fontSize: typography.sizes.sm, marginBottom: spacing[4] },
});
