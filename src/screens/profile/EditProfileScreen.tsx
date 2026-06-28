import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { z } from "zod";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUserStore } from "../../stores/useUserStore";
import { uploadAvatar } from "../../api/user";
import { colors, spacing, typography } from "../../theme";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { Input } from "../../components/primitives/Input";
import { Button } from "../../components/primitives/Button";

const EditProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(50, "Max 50 characters."),
  username: z.string().trim().min(3, "Min 3 characters.").max(30, "Max 30 characters.").regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only.").optional().or(z.literal("")),
  bio: z.string().trim().max(200, "Max 200 characters.").optional().or(z.literal("")),
});

export function EditProfileScreen() {
  const { profile, userId } = useCurrentUser();
  const { updateProfile } = useUserStore();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      setAvatarUri(manipulated.uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) {
      Alert.alert("Error", "You must be signed in.");
      return;
    }

    setValidationError(null);
    const parsed = EditProfileSchema.safeParse({ displayName, username, bio });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setLoading(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri && avatarUri !== profile?.avatarUrl) {
        avatarUrl = await uploadAvatar({
          uri: avatarUri,
          mimeType: "image/jpeg",
          sizeBytes: 50 * 1024,
        });
      }

      await updateProfile(userId, {
        displayName: parsed.data.displayName,
        username: parsed.data.username || null,
        bio: parsed.data.bio || null,
        ...(avatarUrl ? { avatarUrl } : {}),
      });

      Alert.alert("Success", "Profile updated successfully.");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }, [userId, displayName, username, bio, avatarUri, profile?.avatarUrl, updateProfile]);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(displayName || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>Edit</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Display Name *</Text>
            <Input value={displayName} onChangeText={setDisplayName} placeholder="Your name" maxLength={50} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <Input value={username} onChangeText={setUsername} placeholder="@username" autoCapitalize="none" maxLength={30} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <Input
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>

          {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

          <Button title="Save Changes" onPress={handleSave} loading={loading} disabled={loading} />
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[900] },
  avatarSection: { alignItems: "center", paddingVertical: spacing[6] },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: colors.glaze[600] },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.glaze[600], justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 36, fontWeight: typography.weights.bold, color: colors.white },
  editBadge: { position: "absolute", bottom: 0, right: "35%", backgroundColor: colors.ink[800], paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: 8, borderWidth: 1, borderColor: colors.ink[700] },
  editBadgeText: { fontSize: typography.sizes.xs, color: colors.ash[300] },
  form: { padding: spacing[6], paddingTop: 0 },
  field: { marginBottom: spacing[5] },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.ash[300], marginBottom: spacing[2] },
  errorText: { color: colors.wine[400], fontSize: typography.sizes.sm, marginBottom: spacing[4] },
});
