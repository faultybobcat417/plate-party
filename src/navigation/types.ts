import type { Uuid } from "../db/schema";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  CreateProfile: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
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
  Activity: undefined;
  Profile: undefined;
  Settings: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
