import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface MyBetsIconProps {
  activeBetCount?: number;
}

export function MyBetsIcon({ activeBetCount = 0 }: MyBetsIconProps) {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate("Activity" as never)}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`My Bets${activeBetCount > 0 ? `, ${activeBetCount} active` : ""}`}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>🎫</Text>
        {activeBetCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeBetCount > 99 ? "99+" : activeBetCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8, marginRight: 8 },
  icon: { position: "relative" },
  iconText: { fontSize: 22 },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#34C759",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
