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
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";
import { loadProfile } from "../../utils/profileStorage";
import type { PartyStackParamList } from "../../navigation/types";

export type JoinPartyScreenProps = NativeStackScreenProps<PartyStackParamList, "JoinParty">;

export function JoinPartyScreen({ navigation, route }: JoinPartyScreenProps) {
  const { joinParty, isLoading, error, clearError } = usePartyStore();
  const [inviteCode, setInviteCode] = useState(route.params?.inviteCode ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.inviteCode) {
      setInviteCode(route.params.inviteCode);
    }
  }, [route.params?.inviteCode]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleJoin = async () => {
    clearError();
    setValidationError(null);

    const code = inviteCode.trim();
    if (!code) {
      setValidationError("Invite code is required.");
      return;
    }

    const profile = await loadProfile();
    if (!profile?.id || !profile.deviceId) {
      setValidationError("Profile not found. Please create a profile first.");
      return;
    }

    try {
      const result = await joinParty({
        inviteCode: code,
        userId: profile.id,
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
        <Text style={styles.title}>Join a party</Text>
        <Text style={styles.subtitle}>
          Enter the 6-character invite code from your host.
        </Text>

        <Input
          label="Invite code"
          placeholder="XXXXXX"
          value={inviteCode}
          onChangeText={(text) => setInviteCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={10}
        />

        {(validationError || error) ? (
          <Text style={styles.error}>{validationError ?? error}</Text>
        ) : null}

        <View style={styles.footer}>
          <Button
            title="Join Party"
            size="lg"
            loading={isLoading}
            onPress={handleJoin}
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
