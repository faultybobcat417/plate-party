import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, spacing, typography } from "../../theme";
import type { PartyFilters, PartyVibe } from "../../api/party-discovery";

export type PartySearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filters: PartyFilters;
  onFiltersChange: (filters: PartyFilters) => void;
  onSearch: () => void;
};

const VIBE_OPTIONS: { label: string; value: PartyVibe | null }[] = [
  { label: "All", value: null },
  { label: "🔥 Competitive", value: "competitive" },
  { label: "😎 Casual", value: "casual" },
  { label: "❤️ Charity", value: "charity" },
  { label: "💎 High-Stakes", value: "high-stakes" },
];

function parseNumberInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function PartySearchBar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onSearch,
}: PartySearchBarProps) {
  const [location, setLocation] = useState(filters.location ?? "");
  const [minPlates, setMinPlates] = useState(
    filters.minPlates?.toString() ?? "",
  );
  const [maxPlates, setMaxPlates] = useState(
    filters.maxPlates?.toString() ?? "",
  );

  const applyFilters = () => {
    onFiltersChange({
      ...filters,
      location: location.trim() || undefined,
      minPlates: parseNumberInput(minPlates),
      maxPlates: parseNumberInput(maxPlates),
    });
  };

  const handleVibeSelect = (value: PartyVibe | null) => {
    onFiltersChange({
      ...filters,
      vibe: value ?? undefined,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search parties, locations, hosts..."
          placeholderTextColor={colors.ash[400]}
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={onSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        {VIBE_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            style={[
              styles.chip,
              filters.vibe === option.value && styles.chipActive,
            ]}
            onPress={() => handleVibeSelect(option.value)}
          >
            <Text
              style={[
                styles.chipText,
                filters.vibe === option.value && styles.chipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Location"
          placeholderTextColor={colors.ash[400]}
          value={location}
          onChangeText={setLocation}
          onBlur={applyFilters}
        />
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Min plates"
          placeholderTextColor={colors.ash[400]}
          keyboardType="numeric"
          value={minPlates}
          onChangeText={setMinPlates}
          onBlur={applyFilters}
        />
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Max plates"
          placeholderTextColor={colors.ash[400]}
          keyboardType="numeric"
          value={maxPlates}
          onChangeText={setMaxPlates}
          onBlur={applyFilters}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  input: {
    backgroundColor: colors.linen[50],
    borderColor: colors.ash[200],
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink[900],
    flex: 1,
    fontSize: typography.sizes.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  smallInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing[3],
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.glaze[600],
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchButtonText: {
    color: colors.linen[50],
    fontSize: typography.sizes.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  chip: {
    backgroundColor: colors.linen[50],
    borderColor: colors.ash[200],
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  chipActive: {
    backgroundColor: colors.glaze[600],
    borderColor: colors.glaze[600],
  },
  chipText: {
    color: colors.ash[600],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  chipTextActive: {
    color: colors.linen[50],
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
