import React from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { CHARITY_ORGS } from "../../api/charity";
import type { CharityOrg } from "../../types/charity";

const MAX_SELECTIONS = 3;

interface OrgWidgetsGridProps {
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function OrgWidgetsGrid({ onSelectionChange }: OrgWidgetsGridProps) {
  const charities = CHARITY_ORGS;
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggleSelection = (id: string) => {
    let newSelected: string[];
    if (selectedIds.includes(id)) {
      newSelected = selectedIds.filter((sid) => sid !== id);
    } else if (selectedIds.length < MAX_SELECTIONS) {
      newSelected = [...selectedIds, id];
    } else {
      return; // max reached
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(newSelected);
  };

  const renderItem = ({ item }: { item: CharityOrg }) => {
    const isSelected = selectedIds.includes(item.id);
    const canSelect = selectedIds.length < MAX_SELECTIONS || isSelected;

    return (
      <Pressable
        onPress={() => canSelect && toggleSelection(item.id)}
        style={[
          styles.widget,
          isSelected && styles.widgetSelected,
          !canSelect && !isSelected && styles.widgetDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}. ${isSelected ? "Selected" : "Not selected"}`}
        accessibilityState={{ selected: isSelected, disabled: !canSelect && !isSelected }}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.metric}>{item.impactMetric}</Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View>
      <Text style={styles.counter}>
        <Text style={selectedIds.length > 0 ? styles.counterActive : styles.counterInactive}>
          {selectedIds.length}
        </Text>
        <Text style={styles.counterInactive}> / {MAX_SELECTIONS} selected</Text>
      </Text>
      <FlatList
        data={charities}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { paddingBottom: 20 },
  columnWrapper: { justifyContent: "space-between" },
  widget: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: "48%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetSelected: {
    borderColor: "#34C759",
    backgroundColor: "#F0FFF0",
  },
  widgetDisabled: {
    opacity: 0.5,
  },
  emoji: { fontSize: 32, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", textAlign: "center" },
  category: { fontSize: 12, color: "#888", marginTop: 2, textTransform: "capitalize" },
  metric: { fontSize: 11, color: "#34C759", marginTop: 4, fontWeight: "600" },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#34C759",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  counter: { fontSize: 14, marginBottom: 12 },
  counterActive: { fontWeight: "700", color: "#34C759" },
  counterInactive: { color: "#999" },
});
