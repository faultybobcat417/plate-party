import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { z } from "zod";

import { useAuth } from "../../context/AuthContext";
import { getPartyByInviteCode, joinPartyByInviteCode } from "../../api/party";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";
import type { PartyStackParamList } from "../../navigation/types";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

export type JoinPartyScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "JoinParty"
>;

const InviteCodeSchema = z.string().trim().regex(/^[A-Z0-9]{6}$/, "Invalid code format.");

export function JoinPartyScreen({ navigation, route }: JoinPartyScreenProps) {
  const { user } = useAuth();
  const { parties } = usePartyStore();
  const [code, setCode] = useState((route.params?.inviteCode ?? "").toUpperCase());
  const [loading, setLoading] = useState(false);
  const [party, setParty] = useState<Awaited<ReturnType<typeof getPartyByInviteCode>>>(null);
  const [error, setError] = useState<string | null>(null);

  const lookupParty = useCallback(async () => {
    if (!code.trim()) return;
    setError(null);
    setParty(null);
    setLoading(true);
    try {
      const parsed = InviteCodeSchema.parse(code.trim());
      const found = await getPartyByInviteCode(parsed);
      if (!found) {
        setError("Invalid code. Check the code and try again.");
      } else {
        setParty(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleJoin = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in first.");
      return;
    }
    if (!party) return;

    const alreadyMember = parties.some((p) => p.party.id === party.id);
    if (alreadyMember) {
      Alert.alert("Already a Member", "You are already in this party.");
      navigation.navigate("PartyDetail", { partyId: party.id });
      return;
    }

    setLoading(true);
    try {
      await joinPartyByInviteCode(code.trim().toUpperCase());
      Alert.alert("Success", `You joined ${party.name}!`);
      navigation.navigate("PartyDetail", { partyId: party.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join party.";
      if (msg.includes("private")) {
        setError("This is a private party. You need an invite.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [user, party, code, parties, navigation]);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Join a Party</Text>
        <Text style={styles.subtitle}>Enter an invite code to join a private group.</Text>

        <TextInput
          style={styles.input}
          placeholder="XXXXXX"
          placeholderTextColor={colors.ash[500]}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
          textAlign="center"
        />

        <Pressable onPress={lookupParty} style={styles.lookupBtn} disabled={loading || code.length < 6}>
          {loading && !party ? (
            <ActivityIndicator color={colors.linen[50]} />
          ) : (
            <Text style={styles.lookupBtnText}>Look Up Party</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {party && (
          <View style={styles.partyCard}>
            <Text style={styles.partyName}>{party.name}</Text>
            {party.description ? (
              <Text style={styles.partyDesc}>{party.description}</Text>
            ) : null}
            <Pressable onPress={handleJoin} style={styles.joinBtn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.linen[50]} />
              ) : (
                <Text style={styles.joinBtnText}>Join Party</Text>
              )}
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900], padding: spacing[6] },
  title: { fontSize: typography.sizes["3xl"], fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[2] },
  subtitle: { fontSize: typography.sizes.base, color: colors.ash[400], marginBottom: spacing[6] },
  input: {
    backgroundColor: colors.ink[800],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
    padding: spacing[4],
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    marginBottom: spacing[4],
  },
  lookupBtn: {
    backgroundColor: colors.glaze[600],
    paddingVertical: spacing[4],
    borderRadius: 12,
    alignItems: "center",
    marginBottom: spacing[4],
  },
  lookupBtnText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  errorText: { color: colors.wine[400], textAlign: "center", marginTop: spacing[2], fontSize: typography.sizes.base },
  partyCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    padding: spacing[5],
    marginTop: spacing[4],
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  partyName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing[2] },
  partyDesc: { fontSize: typography.sizes.sm, color: colors.ash[400], marginBottom: spacing[4] },
  joinBtn: {
    backgroundColor: colors.glaze[600],
    paddingVertical: spacing[3],
    borderRadius: 12,
    alignItems: "center",
  },
  joinBtnText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
});
