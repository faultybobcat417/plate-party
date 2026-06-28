import { Platform } from "react-native";

let trackingModule: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  trackingModule = require("expo-tracking-transparency");
} catch {
  // Not installed
}

import { trackEvent } from "./analytics";

export async function requestTrackingPermission(): Promise<boolean> {
  if (Platform.OS !== "ios" || !trackingModule) return true;

  const { granted } = await trackingModule.requestTrackingPermissionsAsync();
  await trackEvent("att_permission", { granted, platform: "ios" });
  return granted;
}

export async function getTrackingStatus(): Promise<boolean> {
  if (Platform.OS !== "ios" || !trackingModule) return true;

  const { granted } = await trackingModule.getTrackingPermissionsAsync();
  return granted;
}
