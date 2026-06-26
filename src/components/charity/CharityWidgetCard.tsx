import React from "react";
import { Pressable, View, Text, StyleSheet, Dimensions } from "react-native";
import { type CharityOrg } from "../../types/charity";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_W - 48) / 2;

interface CharityWidgetCardProps {
  charity: CharityOrg;
  isSelected: boolean;
  canSelect: boolean;
  onToggle: () => void;
}

export function CharityWidgetCard({ charity, isSelected, canSelect, onToggle }: CharityWidgetCardProps) {
  const isDisabled = !isSelected && !canSelect;

  return (
    <Pressable
      onPress={onToggle}
      disabled={isDisabled}
      style={[styles.card, isSelected && styles.selectedCard, isDisabled && styles.disabledCard]}
      accessibilityRole="button"
      accessibilityLabel={`${charity.name}. ${charity.description}. ${isSelected ? "Selected" : "Not selected"}`}
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
    >
      <View style={styles.selectionBadge}>
        <View style={[styles.checkCircle, isSelected && { backgroundColor: charity.color, borderColor: charity.color }, isDisabled && !isSelected && styles.disabledCircle]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>

      <View style={[styles.emojiContainer, { backgroundColor: charity.color + "15" }]}>
        <Text style={styles.emoji}>{charity.emoji}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{charity.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{charity.description}</Text>
        <View style={styles.impactRow}>
          <View style={[styles.impactDot, { backgroundColor: charity.color }]} />
          <Text style={styles.impactText} numberOfLines={1}>{charity.impactMetric}</Text>
        </View>
      </View>

      <View style={[styles.raisedBar, { backgroundColor: charity.color }]}>
        <Text style={styles.raisedText}>🍽️ {formatRaised(charity.totalRaised)} raised</Text>
      </View>
    </Pressable>
  );
}

function formatRaised(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderColor: "#34C759",
    shadowOpacity: 0.12,
    elevation: 5,
  },
  disabledCard: {
    opacity: 0.5,
  },
  selectionBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#DDD",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledCircle: {
    borderColor: "#EEE",
    backgroundColor: "#F5F5F5",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  emojiContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 40,
  },
  content: {
    padding: 12,
    paddingTop: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: "#888",
    lineHeight: 15,
    marginBottom: 8,
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  impactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  impactText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  raisedBar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  raisedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
