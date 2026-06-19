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
import { Card } from "../../components/primitives/Card";
import { Avatar } from "../../components/primitives/Avatar";
import { AvatarStack } from "../../components/primitives/AvatarStack";
import { Badge } from "../../components/primitives/Badge";
import { WagerCard } from "../../components/composite/WagerCard";
import { EmptyState } from "../../components/composite/EmptyState";
import { usePartyStore } from "../../stores/usePartyStore";
import { useWagerStore } from "../../stores/useWagerStore";
import { colors, spacing, typography } from "../../theme";
import { loadProfile } from "../../utils/profileStorage";
import type { PartyStackParamList } from "../../navigation/types";

export type PartyDetailScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "PartyDetail"
>;

export function PartyDetailScreen({ navigation, route }: PartyDetailScreenProps) {
  const { partyId } = route.params;
  const {
    currentParty,
    currentPartyMembers,
    isLoading: partyLoading,
    loadParty,
    loadPartyMembers,
  } = usePartyStore();
  const {
    activeWager,
    isLoading: wagerLoading,
    loadActiveWagerForParty,
  } = useWagerStore();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const profile = await loadProfile();
      if (!mounted) return;
      setCurrentUserId(profile?.id ?? null);

      await loadParty(partyId);
      await loadPartyMembers(partyId);
      await loadActiveWagerForParty(partyId);
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [partyId, loadParty, loadPartyMembers, loadActiveWagerForParty]);

  const isHost = currentPartyMembers.some(
    (member) => member.userId === currentUserId && member.role === "host",
  );

  const memberNames = currentPartyMembers.map((member) => member.displayName || "Unknown");

  const roleBadge = isHost ? <Badge label="Host" variant="warning" /> : null;

  if (partyLoading && !currentParty) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.glaze[600]} />
      </SafeAreaView>
    );
  }

  if (!currentParty) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="🔍"
          title="Party not found"
          message="This party may have been deleted or archived."
          actionLabel="Back to Parties"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentParty.name}</Text>
          <View style={styles.headerBadges}>
            {roleBadge}
            <Badge label={currentParty.inviteCode} variant="info" />
          </View>
        </View>
        <Text style={styles.charity}>❤️ {currentParty.charityOrgName}</Text>

        <View style={styles.statsRow}>
          <Card variant="default" padding={3} style={styles.statCard}>
            <Text style={styles.statValue}>{currentPartyMembers.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </Card>
          <Card variant="default" padding={3} style={styles.statCard}>
            <Text style={styles.statValue}>🍽 {currentParty.defaultStakePlates}</Text>
            <Text style={styles.statLabel}>Default stake</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members</Text>
          <AvatarStack names={memberNames} max={4} size="sm" />
        </View>
        <Card variant="default" padding={3} style={styles.membersCard}>
          {currentPartyMembers.map((member) => (
            <Pressable
              key={member.userId}
              onPress={() =>
                navigation.navigate("MemberProfile", {
                  partyId,
                  userId: member.userId,
                })
              }
              style={styles.memberRow}
            >
              <Avatar
                name={member.displayName || "Unknown"}
                colorSeed={member.avatarColor || member.displayName}
                size="md"
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.displayName || "Unknown"}
                  {member.userId === currentUserId ? " (You)" : ""}
                </Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <Text style={styles.memberBalance}>🍽 {member.plateBalance}</Text>
            </Pressable>
          ))}
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Wager</Text>
        </View>
        {wagerLoading && !activeWager ? (
          <ActivityIndicator color={colors.glaze[600]} />
        ) : activeWager ? (
          <WagerCard
            wager={activeWager.wager}
            participantNames={memberNames}
            onPress={() =>
              navigation.navigate("WagerDetail", {
                wagerId: activeWager.wager.id,
                partyId,
              })
            }
          />
        ) : (
          <Card variant="outlined" padding={4} style={styles.emptyWager}>
            <Text style={styles.emptyWagerText}>No active wager right now.</Text>
            <Button
              title="Create Wager"
              onPress={() => navigation.navigate("CreateWager", { partyId })}
            />
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="Create Wager"
            onPress={() => navigation.navigate("CreateWager", { partyId })}
          />
          <Button
            title="Leaderboard"
            variant="secondary"
            onPress={() => navigation.navigate("Leaderboard", { partyId })}
          />
          <Button
            title="Charity Pool"
            variant="secondary"
            onPress={() => navigation.navigate("CharityPool", { partyId })}
          />
          <Button
            title="Party Settings"
            variant="ghost"
            onPress={() => navigation.navigate("PartySettings", { partyId })}
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  headerBadges: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  title: {
    color: colors.ink[900],
    flex: 1,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginRight: spacing[3],
  },
  charity: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[4],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  statCard: {
    alignItems: "center",
    flex: 1,
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
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  sectionTitle: {
    color: colors.ink[900],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  membersCard: {
    gap: spacing[3],
  },
  memberRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  memberRole: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    textTransform: "capitalize",
  },
  memberBalance: {
    color: colors.ink[800],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  emptyWager: {
    alignItems: "center",
  },
  emptyWagerText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  actions: {
    gap: spacing[3],
    marginTop: spacing[6],
  },
});
