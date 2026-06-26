import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { useCharityStore } from "../../stores/useCharityStore";
import { CharityWidgetCard } from "../../components/charity/CharityWidgetCard";
import { CategoryPill } from "../../components/charity/CategoryPill";
import { type CharityCategory } from "../../types/charity";

const CATEGORIES: CharityCategory[] = [
  "all", "education", "health", "environment", "hunger", "animals", "disaster",
];

const MAX_SELECTIONS = 3;


interface CharityPickerScreenProps {
  onSaveComplete?: () => void;
}

export function CharityPickerScreen({ onSaveComplete }: CharityPickerScreenProps = {}) {
  const {
    selectedIds,
    activeCategory,
    searchQuery,
    isSaving,
    error,
    loadSelections,
    toggleSelection,
    setCategory,
    setSearchQuery,
    saveSelections,
    clearError,
    filteredCharities,
    selectedCharities,
    canSelectMore,
    selectionCount,
  } = useCharityStore();

  useEffect(() => { loadSelections(); }, [loadSelections]);

  useFocusEffect(
    useCallback(() => { loadSelections(); }, [loadSelections])
  );

  const charities = filteredCharities();
  const selected = selectedCharities();
  const canSelect = canSelectMore();
  const count = selectionCount();

  const handleSave = async () => {
    if (count === 0) return;
    await saveSelections();
    onSaveComplete?.();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Choose Your Causes</Text>
      <Text style={styles.subtitle}>
        Select up to {MAX_SELECTIONS} organizations to support with your plates
      </Text>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search organizations..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search charities"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.pillsContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <CategoryPill
              category={item}
              isActive={activeCategory === item}
              onPress={() => setCategory(item)}
            />
          )}
          contentContainerStyle={styles.pillsContent}
        />
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          <Text style={count > 0 ? styles.counterActive : styles.counterInactive}>{count}</Text>
          <Text style={styles.counterInactive}> / {MAX_SELECTIONS} selected</Text>
        </Text>
        {count > 0 && (
          <Pressable onPress={() => { /* TODO: clear all */ }} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={clearError}>
            <Text style={styles.errorDismiss}>✕</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No organizations found</Text>
      <Text style={styles.emptySubtitle}>Try a different search or category</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <FlatList
          data={charities}
          numColumns={2}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <CharityWidgetCard
              charity={item}
              isSelected={selectedIds.includes(item.id)}
              canSelect={canSelect}
              onToggle={() => toggleSelection(item.id)}
            />
          )}
        />

        <View style={styles.bottomBar}>
          {selected.length > 0 && (
            <View style={styles.selectedPreview}>
              <Text style={styles.previewLabel}>Supporting:</Text>
              <View style={styles.previewRow}>
                {selected.map((s) => (
                  <View key={s.id} style={[styles.previewChip, { backgroundColor: s.color + "20" }]}>
                    <Text style={styles.previewEmoji}>{s.emoji}</Text>
                    <Text style={[styles.previewName, { color: s.color }]} numberOfLines={1}>{s.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable
            onPress={handleSave}
            disabled={count === 0 || isSaving}
            style={[styles.saveBtn, (count === 0 || isSaving) && styles.saveBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={`Save ${count} charity selection${count !== 1 ? "s" : ""}`}
            accessibilityState={{ disabled: count === 0 || isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {count === 0 ? "Select at least 1 cause" : `Save ${count} Cause${count !== 1 ? "s" : ""}`}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 16, lineHeight: 20 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F0F0", borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: "#1a1a1a" },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 14, color: "#999", fontWeight: "600" },
  pillsContainer: { marginBottom: 12 },
  pillsContent: { paddingRight: 16 },
  counterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  counterText: { fontSize: 14 },
  counterActive: { fontWeight: "700", color: "#34C759" },
  counterInactive: { color: "#999" },
  clearAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  clearAllText: { fontSize: 13, color: "#FF3B30", fontWeight: "600" },
  errorBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFE5E5", padding: 12, borderRadius: 10, marginTop: 8 },
  errorText: { color: "#C0392B", fontSize: 13, flex: 1 },
  errorDismiss: { fontSize: 14, color: "#C0392B", fontWeight: "700", paddingLeft: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  columnWrapper: { justifyContent: "space-between" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: "#999" },
  bottomBar: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 28 : 16, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 5 },
  selectedPreview: { marginBottom: 12 },
  previewLabel: { fontSize: 12, color: "#999", fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  previewRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  previewChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  previewEmoji: { fontSize: 14, marginRight: 4 },
  previewName: { fontSize: 12, fontWeight: "600" },
  saveBtn: { backgroundColor: "#34C759", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#E0E0E0" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
