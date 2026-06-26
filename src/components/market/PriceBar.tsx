import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface PriceBarProps {
  yesPrice: number;
  noPrice: number;
  small?: boolean;
}

export function PriceBar({ yesPrice, noPrice, small = false }: PriceBarProps) {
  const yesPercent = yesPrice * 100;
  const noPercent = noPrice * 100;
  const height = small ? 10 : 18;

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.yesSegment,
            { width: `${yesPercent}%`, borderRadius: height / 2 },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, small && styles.labelSmall]}>
          Yes <Text style={styles.yesColor}>{yesPercent.toFixed(1)}%</Text>
        </Text>
        <Text style={[styles.label, small && styles.labelSmall]}>
          No <Text style={styles.noColor}>{noPercent.toFixed(1)}%</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  bar: {
    backgroundColor: "#FF3B30",
    overflow: "hidden",
  },
  yesSegment: {
    height: "100%",
    backgroundColor: "#34C759",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  label: { fontSize: 12, color: "#888" },
  labelSmall: { fontSize: 10 },
  yesColor: { color: "#34C759", fontWeight: "700" },
  noColor: { color: "#FF3B30", fontWeight: "700" },
});
