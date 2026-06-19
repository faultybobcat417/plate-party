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
import { Card } from "../../components/primitives/Card";
import { Avatar } from "../../components/primitives/Avatar";
import { Badge } from "../../components/primitives/Badge";
import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";
import { loadProfile } from "../../utils/profileStorage";
import type { PartyMemberRole } from "../../db/schema";
import type { PartyStackParamList } from "../../navigation/types";

export type MemberProfileScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "MemberProfile"
>;

export function MemberProfileScreen({ navigation, route }: MemberProfileScreenProps) {
  const { partyId, userId } = route.params;
  const {
    currentPartyMembers,
    isLoading,
    error,
    loadPartyMembers,
    setMemberRole,
    clearError,
  } = usePartyStore();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const profile = await loadProfile();
      if (!mounted) return;
      setCurrentUserId(profile?.id ?? null);
      setDeviceId(profile?.deviceId ?? null);
      await loadPartyMembers(partyId);
    }

    void bootstrap();
    return () => {
      mounted = false;
      clearError();
    };
  }, [partyId, loadPartyMembers, clearError]);

  const member = currentPartyMembers.find((m) => m.userId === userId);
  const currentMember = currentPartyMembers.find((m) => m.userId === currentUserId);
  const isCurrentUserHost = currentMember?.role === "host";
  const canManageRole = isCurrentUserHost && userId !== currentUserId;

  const handleSetRole = async (role: PartyMemberRole) => {
    if (!deviceId || !member) return;
    Alert.alert(
      `Set role to ${role}`,
      `Are you sure you want to make ${member.displayName || "this member"} a ${role}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setIsUpdatingRole(true);
            try {
              await setMemberRole(partyId, userId, role, deviceId);
            } catch {
              // Error surfaced by store.
            } finally {
              setIsUpdatingRole(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading && !member) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.glaze[600]} />
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Member not found.</Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Avatar
            name={member.displayName || "Unknown"}
            colorSeed={member.avatarColor || member.displayName}
            size="xl"
          />
          <Text style={styles.name}>{member.displayName || "Unknown"}</Text>
          <Badge
            label={member.role}
            variant={member.role === "host" ? "warning" : "default"}
          />
        </View>

        <View style={styles.statsGrid}>
          <Card variant="default" padding={3} style={styles.statCard}>
            <Text style={styles.statValue}>🍽 {member.plateBalance}</Text>
            <Text style={styles.statLabel}>Plates</Text>
          </Card>
          <Card variant="default" padding={3} style={styles.statCard}>
            <Text style={styles.statValue}>{member.totalWins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </Card>
          <Card variant="default" padding={3} style={styles.statCard}>
            <Text style={styles.statValue}>{member.totalLosses}</Text>
            <Text style={styles.statLabel}>Losses</Text>
          </Card>
          <Card variant="default" padding={3} style={styles.statCard}>
            <Text style={styles.statValue}>{member.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </Card>
        </View>

        <Card variant="elevated" padding={4} style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Longest streak</Text>
            <Text style={styles.detailValue}>{member.longestStreak}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total plates wagered</Text>
            <Text style={styles.detailValue}>{member.totalPlatesWagered}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Joined</Text>
            <Text style={styles.detailValue}>
              {new Date(member.joinedAt).toLocaleDateString()}
            </Text>
          </View>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {canManageRole ? (
          <View style={styles.actions}>
            <Text style={styles.actionsTitle}>Role management</Text>
            {member.role === "member" ? (
              <Button
                title="Promote to Host"
                loading={isUpdatingRole}
                onPress={() => handleSetRole("host")}
              />
            ) : (
              <Button
                title="Demote to Member"
                variant="secondary"
                loading={isUpdatingRole}
                onPress={() => handleSetRole("member")}
              />
            )}
          </View>
        ) : null}
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
  header: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  name: {
    color: colors.ink[900],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
  },
  statValue: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  detailCard: {
    gap: spacing[3],
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
  },
  detailValue: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
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
  actions: {
    gap: spacing[3],
    marginTop: spacing[6],
  },
  actionsTitle: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
