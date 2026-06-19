import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { archiveParty } from "../../api/party";
import { colors, spacing, typography } from "../../theme";
import { loadProfile } from "../../utils/profileStorage";
import type { PartyStackParamList } from "../../navigation/types";

export type PartySettingsScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "PartySettings"
>;

export function PartySettingsScreen({ navigation, route }: PartySettingsScreenProps) {
  const { partyId } = route.params;
  const {
    currentParty,
    currentPartyMembers,
    isLoading,
    error,
    loadParty,
    loadPartyMembers,
    updateParty,
    leaveParty,
    clearError,
  } = usePartyStore();

  const [name, setName] = useState("");
  const [charityOrgName, setCharityOrgName] = useState("");
  const [charityOrgUrl, setCharityOrgUrl] = useState("");
  const [defaultStakePlates, setDefaultStakePlates] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const profile = await loadProfile();
      if (!mounted) return;
      setCurrentUserId(profile?.id ?? null);
      setDeviceId(profile?.deviceId ?? null);

      await loadParty(partyId);
      await loadPartyMembers(partyId);
    }

    void bootstrap();
    return () => {
      mounted = false;
      clearError();
    };
  }, [partyId, loadParty, loadPartyMembers, clearError]);

  useEffect(() => {
    if (currentParty) {
      setName(currentParty.name);
      setCharityOrgName(currentParty.charityOrgName);
      setCharityOrgUrl(currentParty.charityOrgUrl ?? "");
      setDefaultStakePlates(currentParty.defaultStakePlates);
    }
  }, [currentParty]);

  const currentMember = currentPartyMembers.find(
    (member) => member.userId === currentUserId,
  );
  const isHost = currentMember?.role === "host";

  const handleSave = async () => {
    if (!deviceId) return;
    setIsSaving(true);
    clearError();

    try {
      await updateParty({
        partyId,
        deviceId,
        name: name.trim(),
        charityOrgName: charityOrgName.trim(),
        charityOrgUrl: charityOrgUrl.trim() || null,
        defaultStakePlates,
      });
      navigation.goBack();
    } catch {
      // Error surfaced by store.
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!deviceId) return;
    Alert.alert(
      "Archive Party",
      "Archiving will end all current activity. Members will no longer see this party in their list. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            setIsArchiving(true);
            try {
              await archiveParty(partyId, deviceId);
              navigation.navigate("PartyList");
            } catch (archiveError) {
              Alert.alert(
                "Archive failed",
                archiveError instanceof Error ? archiveError.message : "Could not archive party.",
              );
            } finally {
              setIsArchiving(false);
            }
          },
        },
      ],
    );
  };

  const handleLeave = async () => {
    if (!currentUserId || !deviceId) return;
    Alert.alert(
      "Leave Party",
      "You will lose access to this party unless you are re-invited. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setIsLeaving(true);
            try {
              await leaveParty(partyId, currentUserId, deviceId);
              navigation.navigate("PartyList");
            } catch {
              // Error surfaced by store.
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading && !currentParty) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.glaze[600]} />
      </SafeAreaView>
    );
  }

  if (!currentParty) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Party not found.</Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Party Settings</Text>

        <Input
          label="Party name"
          value={name}
          onChangeText={setName}
          editable={isHost}
        />
        <Input
          label="Charity organization"
          value={charityOrgName}
          onChangeText={setCharityOrgName}
          editable={isHost}
        />
        <Input
          label="Charity URL"
          value={charityOrgUrl}
          onChangeText={setCharityOrgUrl}
          editable={isHost}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.sectionLabel}>Default stake plates</Text>
        <NumericStepper
          value={defaultStakePlates}
          onChange={isHost ? setDefaultStakePlates : () => {}}
          min={1}
          max={20}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isHost ? (
          <View style={styles.footer}>
            <Button
              title="Save Changes"
              loading={isSaving}
              onPress={handleSave}
            />
          </View>
        ) : (
          <Text style={styles.readOnly}>
            Only hosts can edit party details.
          </Text>
        )}

        <View style={styles.dangerZone}>
          {isHost ? (
            <Button
              title="Archive Party"
              variant="danger"
              loading={isArchiving}
              onPress={handleArchive}
            />
          ) : null}
          <Button
            title="Leave Party"
            variant="danger"
            loading={isLeaving}
            onPress={handleLeave}
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
  errorText: {
    color: colors.wine[500],
    marginBottom: spacing[4],
  },
  footer: {
    marginTop: spacing[6],
  },
  readOnly: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    fontStyle: "italic",
    marginTop: spacing[4],
  },
  dangerZone: {
    gap: spacing[3],
    marginTop: spacing[8],
  },
});
