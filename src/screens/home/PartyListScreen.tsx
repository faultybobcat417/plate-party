import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { EmptyState } from "../../components/composite/EmptyState";
import { AuthModal } from "../../components/auth/AuthModal";
import { usePartyStore } from "../../stores/usePartyStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { colors, spacing, typography } from "../../theme";
import type { PartyStackParamList } from "../../navigation/types";

export type PartyListScreenProps = NativeStackScreenProps<PartyStackParamList, "PartyList">;

export function PartyListScreen({ navigation }: PartyListScreenProps) {
  const { parties, isLoading, error, loadPartiesForUser } = usePartyStore();
  const { userId, isAnonymous } = useCurrentUser();
  const [authVisible, setAuthVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId && !isAnonymous) {
        void loadPartiesForUser(userId);
      }
    }, [userId, isAnonymous, loadPartiesForUser]),
  );

  const handleRefresh = async () => {
    if (!userId || isAnonymous) return;
    await loadPartiesForUser(userId);
  };

  if (isAnonymous) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="🍽"
          title="Browse public parties"
          message="Guests can discover public parties. Sign in to create or join one."
          actionLabel="Discover Parties"
          onAction={() => navigation.navigate("PartyDiscovery")}
        />
        <View style={styles.emptyActions}>
          <Button title="Sign In" onPress={() => setAuthVisible(true)} />
        </View>
        <AuthModal
          visible={authVisible}
          reason="Sign in to create and join parties."
          onClose={() => setAuthVisible(false)}
          onSignedIn={() => setAuthVisible(false)}
        />
      </SafeAreaView>
    );
  }

  if (isLoading && parties.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.glaze[600]} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={handleRefresh} />
      </SafeAreaView>
    );
  }

  if (parties.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="🍽"
          title="No parties yet"
          message="Create a new party or join one with an invite code."
          actionLabel="Create Party"
          onAction={() => navigation.navigate("CreateParty")}
        />
        <View style={styles.emptyActions}>
          <Button
            title="Join Party"
            variant="secondary"
            onPress={() => navigation.navigate("JoinParty", {})}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Parties</Text>
        <Button
          title="Create"
          size="sm"
          onPress={() => navigation.navigate("CreateParty")}
        />
      </View>

      <View style={styles.discoveryRow}>
        <Button
          title="🔍 Discover Parties"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate("PartyDiscovery")}
          style={styles.discoveryButton}
        />
        <Button
          title="🏆 Leaderboard"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate("GlobalLeaderboard")}
          style={styles.discoveryButton}
        />
      </View>

      <FlatList
        data={parties}
        keyExtractor={(item) => item.party.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("PartyDetail", { partyId: item.party.id })
            }
          >
            <Card variant="elevated" padding={4} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.partyName}>{item.party.name}</Text>
                <Text style={styles.role}>{item.membership.role}</Text>
              </View>
              <Text style={styles.charity}>{item.party.charityOrgName}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.plates}>🍽 {item.membership.plateBalance}</Text>
                <Text style={styles.invite}>Code: {item.party.inviteCode}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <Button
          title="Join Party"
          variant="secondary"
          onPress={() => navigation.navigate("JoinParty", {})}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink[900],
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  discoveryRow: {
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
  },
  discoveryButton: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  list: {
    padding: spacing[6],
  },
  card: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[1],
  },
  partyName: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  role: {
    color: colors.glaze[700],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: "capitalize",
  },
  charity: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[3],
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  plates: {
    color: colors.gold,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  invite: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  emptyActions: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  errorText: {
    color: colors.wine[500],
    marginBottom: spacing[4],
  },
});
