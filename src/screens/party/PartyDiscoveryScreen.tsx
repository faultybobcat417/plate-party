import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { PartyDiscoveryCard } from "../../components/composite/PartyDiscoveryCard";
import { PartySearchBar } from "../../components/composite/PartySearchBar";
import { Button } from "../../components/primitives/Button";
import { usePartyDiscoveryStore } from "../../stores/usePartyDiscoveryStore";
import { colors, spacing, typography } from "../../theme";
import type { PartyStackParamList } from "../../navigation/types";

export type PartyDiscoveryScreenProps = NativeStackScreenProps<
  PartyStackParamList,
  "PartyDiscovery"
>;

export function PartyDiscoveryScreen() {
  const {
    parties,
    currentIndex,
    isLoading,
    error,
    searchQuery,
    filters,
    swipeHistory,
    loadParties,
    setSearchQuery,
    setFilters,
    swipeLeft,
    swipeRight,
    superRequest,
    clearError,
  } = usePartyDiscoveryStore();

  useEffect(() => {
    void loadParties();
  }, [loadParties]);

  const currentParty = parties[currentIndex];
  const hasMore = currentIndex < parties.length - 1;
  const joinedPartyIds = swipeHistory
    .filter((item) => item.action === "join")
    .map((item) => item.partyId);
  const superRequestedIds = swipeHistory
    .filter((item) => item.action === "super")
    .map((item) => item.partyId);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <PartySearchBar
        query={searchQuery}
        onQueryChange={(query) => void setSearchQuery(query)}
        filters={filters}
        onFiltersChange={(newFilters) => void setFilters(newFilters)}
        onSearch={() => void setSearchQuery(searchQuery)}
      />

      {isLoading && !currentParty && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.glaze[600]} />
          <Text style={styles.loadingText}>Finding parties...</Text>
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Button title="Dismiss" onPress={clearError} variant="secondary" />
        </View>
      )}

      {!isLoading && parties.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No more parties nearby. Check back tomorrow! 🌅
          </Text>
        </View>
      )}

      {!isLoading && currentParty && (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {currentIndex + 1} of {parties.length}
              </Text>
            </View>

            <View style={styles.cardWrapper}>
              <PartyDiscoveryCard
                party={currentParty}
                onSkip={swipeLeft}
                onJoin={() => void swipeRight()}
                onSuperRequest={() => void superRequest()}
                isJoined={joinedPartyIds.includes(currentParty.id)}
                isSuperRequested={superRequestedIds.includes(currentParty.id)}
              />
            </View>
          </ScrollView>

          {hasMore && (
            <View style={styles.hintRow}>
              <Text style={styles.hintText}>
                👈 Skip · 👉 Join · ⬆️ Super-Request
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[100],
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  counter: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  counterText: {
    color: colors.ash[500],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: spacing[4],
    minHeight: 480,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
  },
  loadingText: {
    color: colors.ash[600],
    fontSize: typography.sizes.base,
    marginTop: spacing[3],
  },
  errorText: {
    color: colors.wine[500],
    fontSize: typography.sizes.base,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  emptyText: {
    color: colors.ink[900],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  hintRow: {
    alignItems: "center",
    paddingBottom: spacing[4],
  },
  hintText: {
    color: colors.ash[400],
    fontSize: typography.sizes.xs,
  },
});
