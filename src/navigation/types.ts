import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Uuid } from "../db/schema";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  CreateProfile: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  FeedTab: NavigatorScreenParams<FeedStackParamList>;
  MarketTab: NavigatorScreenParams<MarketStackParamList>;
  PartyTab: NavigatorScreenParams<PartyStackParamList>;
  PlayTab: NavigatorScreenParams<PlayStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type FeedStackParamList = {
  FeedHome: undefined;
  CreateChallenge: undefined;
  ChallengeDetail: { challengeId: string };
  CreateMeatPost: undefined;
  CreateStakePost: undefined;
  MeatPostDetail: { postId: string };
  StakePostDetail: { postId: string };
};

export type MarketStackParamList = {
  MarketHome: undefined;
  MarketDetail: { marketId: string };
  Watchlist: undefined;
  Trade: { marketId: string; defaultOutcome: "yes" | "no" };
};

export type PartyStackParamList = {
  PartyList: undefined;
  CreateParty: undefined;
  JoinParty: { inviteCode?: string } | undefined;
  PartyDetail: { partyId: Uuid };
  PartySettings: { partyId: Uuid };
  MemberProfile: { partyId: Uuid; userId: Uuid };
  CreateWager: { partyId: Uuid };
  WagerDetail: { wagerId: Uuid; partyId: Uuid };
  PlaceBet: { wagerId: Uuid; partyId: Uuid };
  BetConfirmed: { wagerId: Uuid; partyId: Uuid };
  Reveal: { wagerId: Uuid; partyId: Uuid };
  Leaderboard: { partyId: Uuid };
  CharityPool: { partyId: Uuid };
  RealMoneySettle: { partyId: Uuid; userId: Uuid };
  EditProfile: undefined;
  Settings: undefined;
  PartyDiscovery: undefined;
  GlobalLeaderboard: undefined;
};

export type PlayStackParamList = {
  PlayHome: undefined;
  GameScreen: { gameId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  GiverLeaderboard: undefined;
  ActivityHistory: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type --
   React Navigation requires this global namespace augmentation so that
   useNavigation() is typed against our root param list. */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
