import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Crypto from "expo-crypto";

import { supabase } from "../../lib/supabase";
import { FileUploadSchema } from "../../lib/validation";
import { colors, spacing, typography } from "../../theme";
import type { ProofType } from "./ProofSubmissionSheet";

export type UploadedProof = {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

type ProofUploaderProps = {
  type: Exclude<ProofType, "text">;
  onUploaded: (proof: UploadedProof) => void;
};

const PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime"] as const;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function ProofUploader({ type, onUploaded }: ProofUploaderProps) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setUploading] = useState(false);

  const pickAndUpload = async () => {
    setUploading(true);
    setProgress(10);

    try {
      const selected = await selectProof(type);
      if (!selected) return;
      setProgress(35);

      const sanitized = await stripImageMetadata(selected);
      const blob = await uriToBlob(sanitized.uri);
      const parsed = FileUploadSchema.parse({
        name: sanitized.name,
        sizeBytes: sanitized.sizeBytes > 0 ? sanitized.sizeBytes : blob.size,
        mimeType: sanitized.mimeType,
      });
      validateProofUpload(parsed.mimeType, parsed.sizeBytes);
      setProgress(60);

      const extension = extensionForMimeType(parsed.mimeType);
      const path = `${Crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("proofs").upload(path, blob, {
        contentType: parsed.mimeType,
        upsert: false,
      });
      if (error) throw error;

      setProgress(90);
      const { data } = supabase.storage.from("proofs").getPublicUrl(path);
      const proof = {
        uri: data.publicUrl,
        name: parsed.name,
        mimeType: parsed.mimeType,
        sizeBytes: parsed.sizeBytes,
      };
      onUploaded(proof);
      setProgress(100);
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Could not upload proof.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${type} proof`}
        disabled={isUploading}
        onPress={pickAndUpload}
        style={({ pressed }) => [styles.button, (pressed || isUploading) && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>{isUploading ? "Uploading..." : actionLabel(type)}</Text>
      </Pressable>
      {progress > 0 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      <Text style={styles.helper}>
        Images up to 10MB. Videos up to 50MB. JPG, PNG, GIF, MP4, and MOV only.
      </Text>
    </View>
  );
}

async function selectProof(type: Exclude<ProofType, "text">): Promise<UploadedProof | null> {
  if (type === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("Camera permission is required.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.82,
      exif: false,
    });
    return imagePickerResultToProof(result);
  }

  if (type === "photo") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error("Photo library permission is required.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.82,
      exif: false,
    });
    return imagePickerResultToProof(result);
  }

  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: [...PROOF_MIME_TYPES],
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? "application/octet-stream",
    sizeBytes: asset.size ?? 0,
  };
}

function imagePickerResultToProof(result: ImagePicker.ImagePickerResult): UploadedProof | null {
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg");
  return {
    uri: asset.uri,
    name: asset.fileName ?? `proof.${extensionForMimeType(mimeType)}`,
    mimeType,
    sizeBytes: asset.fileSize ?? 0,
  };
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read the selected file.");
  return response.blob();
}

async function stripImageMetadata(proof: UploadedProof): Promise<UploadedProof> {
  if (!proof.mimeType.startsWith("image/") || proof.mimeType === "image/gif") return proof;

  const result = await ImageManipulator.manipulateAsync(proof.uri, [], {
    compress: proof.mimeType === "image/png" ? 1 : 0.88,
    format: proof.mimeType === "image/png" ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
  });

  return {
    ...proof,
    uri: result.uri,
    name: proof.name || `proof.${extensionForMimeType(proof.mimeType)}`,
  };
}

function validateProofUpload(mimeType: string, sizeBytes: number): void {
  if (!PROOF_MIME_TYPES.includes(mimeType as (typeof PROOF_MIME_TYPES)[number])) {
    throw new Error("Proof must be a JPG, PNG, GIF, MP4, or MOV file.");
  }

  if (mimeType.startsWith("image/") && sizeBytes > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 10MB or smaller.");
  }

  if (mimeType.startsWith("video/") && sizeBytes > MAX_VIDEO_BYTES) {
    throw new Error("Videos must be 50MB or smaller.");
  }
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

function actionLabel(type: Exclude<ProofType, "text">): string {
  if (type === "camera") return "Open Camera";
  if (type === "photo") return "Choose Photo or Video";
  return "Choose File";
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.glaze[600],
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: colors.linen[50],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  progressTrack: {
    backgroundColor: colors.ash[200],
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.glaze[600],
    height: "100%",
  },
  helper: {
    color: colors.ash[500],
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
});
