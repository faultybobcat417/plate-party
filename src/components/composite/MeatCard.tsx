import { View, Text, Pressable, StyleSheet } from "react-native";
import { Card } from "../primitives/Card";
import { colors, spacing, typography } from "../../theme";
import type { MeatPost } from "../../api/meat";

export interface MeatCardProps {
  post: MeatPost;
  onPayToInteract: (type: "like" | "comment" | "dm") => void;
}

export function MeatCard({ post, onPayToInteract }: MeatCardProps) {
  return (
    <Card style={styles.card} padding={0}>
      {/* Image / Avatar Area */}
      <View style={styles.imageArea}>
        <View style={styles.avatarCircle} accessibilityRole="image">
          <Text style={styles.avatarEmoji}>{post.creatorAvatar || "👤"}</Text>
        </View>
        {post.isTrending && (
          <View style={styles.trendingBadge}>
            <Text style={styles.trendingText}>🔥 Trending</Text>
          </View>
        )}
        <View style={styles.overlayInfo}>
          <Text style={styles.username}>{post.creatorName || "Unknown"}</Text>
          {post.bioSnippet && (
            <Text style={styles.bio} numberOfLines={1}>
              {post.bioSnippet}
            </Text>
          )}
        </View>
      </View>

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Plate Cost Badge */}
      <View style={styles.plateBadge}>
        <Text style={styles.plateBadgeText}>🔒 {post.plateCost} plates to interact</Text>
      </View>

      {/* Stats */}
      <Text style={styles.stats}>
        {post.likes} likes • {post.comments} comments
      </Text>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pay 1 plate to like ${post.creatorName ?? "this post"}`}
          style={({ pressed }) => [styles.actionBtn, styles.likeBtn, pressed && styles.pressed]}
          onPress={() => onPayToInteract("like")}
        >
          <Text style={styles.likeBtnText}>Pay & Like (1)</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pay 5 plates to comment on ${post.creatorName ?? "this post"}`}
          style={({ pressed }) => [styles.actionBtn, styles.commentBtn, pressed && styles.pressed]}
          onPress={() => onPayToInteract("comment")}
        >
          <Text style={styles.commentBtnText}>Comment (5)</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pay ${post.plateCost ?? 0} plates to DM ${post.creatorName ?? "this post"}`}
          style={({ pressed }) => [styles.actionBtn, styles.dmBtn, pressed && styles.pressed]}
          onPress={() => onPayToInteract("dm")}
        >
          <Text style={styles.dmBtnText}>DM ({post.plateCost})</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[3],
    marginBottom: spacing[3],
    overflow: "hidden",
  },
  imageArea: {
    height: 200,
    backgroundColor: colors.ash[100],
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.glaze[100],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 40,
  },
  trendingBadge: {
    position: "absolute",
    top: spacing[3],
    right: spacing[3],
    backgroundColor: colors.gold,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: spacing[1],
  },
  trendingText: {
    color: colors.ink[900],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  overlayInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[3],
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  username: {
    color: colors.linen[50],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  bio: {
    color: colors.linen[200],
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  caption: {
    padding: spacing[4],
    fontSize: typography.sizes.base,
    color: colors.ink[900],
    lineHeight: 22,
  },
  plateBadge: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    alignSelf: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: spacing[1],
  },
  plateBadgeText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  stats: {
    paddingHorizontal: spacing[4],
    fontSize: typography.sizes.xs,
    color: colors.ash[500],
    marginBottom: spacing[3],
  },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing[2],
    borderRadius: spacing[2],
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  likeBtn: {
    backgroundColor: colors.win,
  },
  likeBtnText: {
    color: colors.linen[50],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  commentBtn: {
    backgroundColor: colors.ink[700],
  },
  commentBtnText: {
    color: colors.linen[50],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  dmBtn: {
    backgroundColor: colors.gold,
  },
  dmBtnText: {
    color: colors.ink[900],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
