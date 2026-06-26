import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface DmIconProps {
  unreadCount?: number;
}

export function DmIcon({ unreadCount = 0 }: DmIconProps) {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate("Messages" as never)}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>✉️</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
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
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
