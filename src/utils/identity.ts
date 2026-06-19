import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_ID_KEY = "plate-party-current-user-id";
const DEVICE_ID_KEY = "plate-party-device-id";

export async function getCurrentUserId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_USER_ID_KEY);
}

export async function getDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_ID_KEY);
}
