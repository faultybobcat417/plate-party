import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { usePartyStore } from "../../stores/usePartyStore";
import { colors, spacing, typography } from "../../theme";
import type { PartyStackParamList } from "../../navigation/types";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { supabase } from "../../lib/supabase";
import type { Party } from "../../db/schema";

export type PartyDiscoveryScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "PartyDiscovery"
>;

export function PartyDiscoveryScreen({ navigation }: PartyDiscoveryScreenProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPublicParties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from("parties")
        .select("*")
        .eq("is_private", false)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (supaError) throw supaError;
      const normalized = (data ?? []).map(normalizeParty);
      setParties(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPublicParties();
  }, [loadPublicParties]);

  const filtered = parties.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPartyCard = ({ item }: { item: Party }) => (
    <Pressable
      onPress={() => navigation.navigate("PartyDetail", { partyId: item.id })}
      style={styles.card}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>🍽 {item.defaultStakePlates} stake</Text>
        {item.charityOrgName ? (
          <Text style={styles.cardMeta}>❤️ {item.charityOrgName}</Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover Parties</Text>
          <Text style={styles.subtitle}>Join public groups and start competing</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search parties..."
            placeholderTextColor={colors.ash[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={() => navigation.navigate("CreateParty")}
            style={styles.createBtn}
          >
            <Text style={styles.createBtnText}>+ Create</Text>
          </Pressable>
        </View>

        {loading && parties.length === 0 ? (
          <ActivityIndicator color={colors.glaze[500]} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderPartyCard}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery ? "No parties match your search." : "No public parties yet. Be the first to create one!"}
              </Text>
            }
            refreshing={loading}
            onRefresh={loadPublicParties}
          />
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

function normalizeParty(row: Record<string, unknown>): Party {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Untitled party"),
    description: row.description ? String(row.description) : null,
    hostId: String(row.host_id ?? ""),
    inviteCode: String(row.invite_code ?? ""),
    isPrivate: Boolean(row.is_private),
    charityPoolPlates: Number(row.charity_pool_plates ?? 0),
    charityOrgName: row.charity_org_name ? String(row.charity_org_name) : "",
    charityOrgUrl: row.charity_org_url ? String(row.charity_org_url) : null,
    defaultStakePlates: Number(row.default_stake_plates ?? 1),
    realMoneyEnabled: Boolean(row.real_money_enabled),
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
    deletedAt: row.deleted_at ? new Date(String(row.deleted_at)) : null,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[3] },
  title: { fontSize: typography.sizes["3xl"], fontWeight: typography.weights.bold, color: colors.white },
  subtitle: { fontSize: typography.sizes.base, color: colors.ash[400], marginTop: spacing[1] },
  searchRow: { flexDirection: "row", paddingHorizontal: spacing[5], gap: spacing[3], marginBottom: spacing[4] },
  searchInput: {
    flex: 1,
    backgroundColor: colors.ink[800],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.white,
    fontSize: typography.sizes.base,
  },
  createBtn: {
    backgroundColor: colors.glaze[600],
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    justifyContent: "center",
    alignItems: "center",
  },
  createBtnText: { color: colors.white, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[6] },
  card: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    padding: spacing[5],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  cardTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white },
  cardDesc: { fontSize: typography.sizes.sm, color: colors.ash[400], marginTop: spacing[1] },
  cardFooter: { flexDirection: "row", gap: spacing[4], marginTop: spacing[3] },
  cardMeta: { fontSize: typography.sizes.xs, color: colors.ash[500] },
  loader: { marginTop: spacing[10] },
  errorText: { color: colors.wine[400], textAlign: "center", marginTop: spacing[10], fontSize: typography.sizes.base },
  emptyText: { color: colors.ash[500], textAlign: "center", marginTop: spacing[10], fontSize: typography.sizes.base },
});
