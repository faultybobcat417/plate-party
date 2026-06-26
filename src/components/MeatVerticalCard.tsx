import React from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { type MeatPost } from "../api/meat";

const { height: SCREEN_H } = Dimensions.get("window");

interface MeatVerticalCardProps {
  post: MeatPost;
  onLike: () => void;
  onComment: () => void;
  onDm: () => void;
}

export function MeatVerticalCard({ post, onLike, onComment, onDm }: MeatVerticalCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.nameCol}>
            <Text style={styles.name}>{post.creatorId?.slice(0, 8) || "User"}</Text>
            <Text style={styles.bio}>🥩 Meat Post</Text>
          </View>
        </View>

        <Text style={styles.caption}>{post.caption}</Text>

        <View style={styles.plateBadge}>
          <Text style={styles.plateText}>🔒 {post.plateCost} plates to interact</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>❤️ {post.likes || 0}</Text>
          <Text style={styles.stat}>💬 {post.comments || 0}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onLike} style={[styles.btn, styles.likeBtn]}>
            <Text style={styles.btnText}>Pay & Like (1)</Text>
          </Pressable>
          <Pressable onPress={onComment} style={[styles.btn, styles.commentBtn]}>
            <Text style={styles.btnText}>Comment (5)</Text>
          </Pressable>
          <Pressable onPress={onDm} style={[styles.btn, styles.dmBtn]}>
            <Text style={styles.btnText}>DM (25)</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SCREEN_H * 0.75,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F4FD",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 24 },
  nameCol: { marginLeft: 12 },
  name: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  bio: { fontSize: 13, color: "#888", marginTop: 2 },
  caption: { fontSize: 16, color: "#333", lineHeight: 22, marginBottom: 12 },
  plateBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  plateText: { fontSize: 13, fontWeight: "600", color: "#E65100" },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  stat: { fontSize: 14, color: "#666" },
  actions: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  likeBtn: { backgroundColor: "#34C759" },
  commentBtn: { backgroundColor: "#333" },
  dmBtn: { backgroundColor: "#FF9500" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
