import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors, typography, spacing } from "../../theme";
import { useMarketStore } from "../../stores/useMarketStore";

export function MarketDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { marketId } = route.params as { marketId: string };

  const { markets, loadMarketDetails, selectedMarket } = useMarketStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);

  // Find market from list as fallback
  const marketFromList = markets.find((m: any) => m.id === marketId);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await loadMarketDetails(marketId);
        if (mounted) {
          if (data) {
            setDetail(data);
          } else if (marketFromList) {
            // Fallback: construct detail from list data
            setDetail({
              ...marketFromList,
              relatedMarkets: markets.filter((m: any) => m.id !== marketId).slice(0, 3),
            });
          } else {
            setError("Market not found");
          }
        }
      } catch (err: any) {
        if (mounted) {
          if (marketFromList) {
            setDetail({
              ...marketFromList,
              relatedMarkets: markets.filter((m: any) => m.id !== marketId).slice(0, 3),
            });
          } else {
            setError(err?.message || "Failed to load market");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [marketId, loadMarketDetails, marketFromList, markets]);

  const market = detail || selectedMarket || marketFromList;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[0], justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary.base} />
      </SafeAreaView>
    );
  }

  if (error || !market) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[0] }}>
        <View style={{ padding: spacing[4] }}>
          <TouchableOpacity onPress={() => (navigation as any).goBack()}>
            <Text style={{ fontSize: typography.sizes.xl, color: colors.neutral[500] }}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing[6] }}>
          <Text style={{ fontSize: 48, marginBottom: spacing[3] }}>📭</Text>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>
            Market not found
          </Text>
          <Text style={{ fontSize: typography.sizes.base, color: colors.neutral[500], marginTop: spacing[2], textAlign: "center" }}>
            This market may have been removed or the ID is invalid.
          </Text>
          <TouchableOpacity
            onPress={() => (navigation as any).goBack()}
            style={{
              marginTop: spacing[5],
              backgroundColor: colors.primary.base,
              paddingHorizontal: spacing[6],
              paddingVertical: spacing[3],
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: colors.neutral[0] }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const yesPct = market.yesPercentage ?? 50;
  const noPct = 100 - yesPct;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4] }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing[4] }}>
          <TouchableOpacity onPress={() => (navigation as any).goBack()}>
            <Text style={{ fontSize: typography.sizes.xl, color: colors.neutral[500] }}>←</Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
              color: colors.neutral[900],
              marginLeft: spacing[3],
            }}
          >
            Market Detail
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: typography.sizes["2xl"],
            fontWeight: typography.weights.bold,
            color: colors.neutral[900],
            marginBottom: spacing[2],
          }}
        >
          {market.title}
        </Text>
        <Text style={{ fontSize: typography.sizes.base, color: colors.neutral[500], marginBottom: spacing[4] }}>
          {market.description}
        </Text>

        {/* Category + Volume */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing[5] }}>
          <View
            style={{
              backgroundColor: colors.primary.light,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: typography.sizes.sm, color: colors.primary.base, fontWeight: typography.weights.semibold }}>
              {market.category?.toUpperCase() || "GENERAL"}
            </Text>
          </View>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.neutral[500], marginLeft: spacing[3] }}>
            Vol: {(market.volume || 0).toLocaleString()} plates
          </Text>
        </View>

        {/* Progress */}
        <View
          style={{
            height: 12,
            backgroundColor: colors.neutral[200],
            borderRadius: 6,
            marginBottom: spacing[3],
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${yesPct}%`,
              height: "100%",
              backgroundColor: colors.primary.base,
              borderRadius: 6,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing[6] }}>
          <Text style={{ fontSize: typography.sizes.base, color: colors.primary.base, fontWeight: typography.weights.bold }}>
            Yes {yesPct}%
          </Text>
          <Text style={{ fontSize: typography.sizes.base, color: colors.neutral[500], fontWeight: typography.weights.bold }}>
            No {noPct}%
          </Text>
        </View>

        {/* Trade Button */}
        <TouchableOpacity
          onPress={() => (navigation as any).navigate("Trade", { marketId })}
          style={{
            backgroundColor: colors.primary.base,
            borderRadius: 12,
            paddingVertical: spacing[4],
            alignItems: "center",
            marginBottom: spacing[6],
          }}
        >
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.neutral[0] }}>
            Trade Now
          </Text>
        </TouchableOpacity>

        {/* Related Markets */}
        {market.relatedMarkets && market.relatedMarkets.length > 0 && (
          <>
            <Text
              style={{
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.semibold,
                color: colors.neutral[900],
                marginBottom: spacing[3],
              }}
            >
              Related Markets
            </Text>
            {market.relatedMarkets.map((m: any) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => (navigation as any).replace("MarketDetail", { marketId: m.id })}
                style={{
                  backgroundColor: colors.neutral[0],
                  borderRadius: 12,
                  padding: spacing[3],
                  marginBottom: spacing[2],
                }}
              >
                <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>
                  {m.title}
                </Text>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.neutral[500] }}>
                  {m.category} · Vol: {(m.volume || 0).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
