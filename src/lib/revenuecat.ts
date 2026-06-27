import Purchases, { LOG_LEVEL, PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";

const API_KEYS = {
  ios: "appl_your_revenuecat_ios_api_key",
  android: "goog_your_revenuecat_android_api_key",
};

export const PLATE_PRODUCT_ID = "plate_party_10_plates";

export async function initializeRevenueCat() {
  if (Platform.OS === "ios") Purchases.configure({ apiKey: API_KEYS.ios });
  else Purchases.configure({ apiKey: API_KEYS.android });
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}

export async function getOfferings(): Promise<PurchasesPackage | null> {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;
  const pkg = current.availablePackages.find((p) => p.product.identifier === PLATE_PRODUCT_ID);
  return pkg || current.availablePackages[0] || null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
    const transaction = customerInfo.allPurchaseDatesByProduct[productIdentifier];
    return { success: true, transactionId: transaction };
  } catch (error: any) {
    if (error.userCancelled) return { success: false, error: "User cancelled purchase." };
    return { success: false, error: error.message || "Purchase failed." };
  }
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return Object.keys(customerInfo.allPurchaseDatesByProduct).length > 0;
}

export async function getCustomerInfo() { return await Purchases.getCustomerInfo(); }
