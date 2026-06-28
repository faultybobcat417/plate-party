import { Platform } from "react-native";

let Mixpanel: any = null;

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;

export async function initAnalytics(): Promise<void> {
  if (!MIXPANEL_TOKEN) return;
  try {
    // @ts-expect-error mixpanel-react-native is optional; install when ready
    const { Mixpanel: MixpanelClass } = await import("mixpanel-react-native");
    Mixpanel = new MixpanelClass(MIXPANEL_TOKEN);
    await Mixpanel.init();
  } catch {
    Mixpanel = null;
  }
}

export async function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (!Mixpanel) return;
  await Mixpanel.track(event, properties ?? {});
}

export async function setUserProperties(properties: Record<string, unknown>): Promise<void> {
  if (!Mixpanel) return;
  await Mixpanel.getPeople().set(properties);
}

export async function identifyUser(userId: string): Promise<void> {
  if (!Mixpanel) return;
  await Mixpanel.identify(userId);
}

export async function resetAnalytics(): Promise<void> {
  if (!Mixpanel) return;
  await Mixpanel.reset();
}

export const AnalyticsEvents = {
  onboardingComplete: "onboarding_complete",
  challengeCreated: "challenge_created",
  challengeJoined: "challenge_joined",
  gamePlayed: "game_played",
  platePurchased: "plate_purchased",
  donationMade: "donation_made",
  partyCreated: "party_created",
  partyJoined: "party_joined",
  profileUpdated: "profile_updated",
  settingsChanged: "settings_changed",
  referralUsed: "referral_used",
} as const;
