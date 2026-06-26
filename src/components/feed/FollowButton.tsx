import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useFollowStore } from "../../stores/useFollowStore";

interface FollowButtonProps {
  userId: string;
  followerCount?: number;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, followerCount }) => {
  const { isFollowing, follow, unfollow } = useFollowStore();
  const following = isFollowing(userId);

  const handlePress = () => {
    if (following) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  };

  return (
    <Pressable
      style={[styles.button, following && styles.following]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={following ? `Unfollow user ${userId}` : `Follow user ${userId}`}
    >
      <Text style={[styles.text, following && styles.followingText]}>
        {following ? "Following" : "Follow"}
      </Text>
      {followerCount !== undefined && (
        <Text style={styles.count}>{followerCount}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#34C759",
    backgroundColor: "transparent",
    gap: 6,
  },
  following: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  text: {
    fontWeight: "600",
    fontSize: 13,
    color: "#34C759",
  },
  followingText: {
    color: "#fff",
  },
  count: {
    fontSize: 11,
    color: "#888",
    marginLeft: 2,
  },
});
