import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PartyListScreen } from "../screens/home/PartyListScreen";
import { CreatePartyScreen } from "../screens/party/CreatePartyScreen";
import { JoinPartyScreen } from "../screens/party/JoinPartyScreen";
import { PartyDetailScreen } from "../screens/party/PartyDetailScreen";
import { PartySettingsScreen } from "../screens/party/PartySettingsScreen";
import { MemberProfileScreen } from "../screens/party/MemberProfileScreen";
import { CreateChallengeScreen } from "../screens/challenge/CreateChallengeScreen";
import { ChallengeDetailScreen } from "../screens/challenge/ChallengeDetailScreen";
import { PlaceBetScreen } from "../screens/challenge/PlaceBetScreen";
import { GameScreen } from "../screens/challenge/GameScreen";
import { ResultsScreen } from "../screens/challenge/ResultsScreen";
import { CreateWagerScreen } from "../screens/wager/CreateWagerScreen";
import { WagerDetailScreen } from "../screens/wager/WagerDetailScreen";
import { PlaceBetSheet } from "../screens/wager/PlaceBetSheet";
import { BetConfirmedSheet } from "../screens/wager/BetConfirmedSheet";
import { RevealScreen } from "../screens/wager/RevealScreen";
// import { LeaderboardScreen } from "../screens/leaderboard/LeaderboardScreen";
// import { GlobalLeaderboardScreen } from "../screens/party/GlobalLeaderboardScreen";
import { PartyDiscoveryScreen } from "../screens/party/PartyDiscoveryScreen";
import { CharityPoolScreen } from "../screens/charity/CharityPoolScreen";
import { RealMoneySettleScreen } from "../screens/charity/RealMoneySettleScreen";
import type { PartyStackParamList } from "./types";

const Stack = createNativeStackNavigator<PartyStackParamList>();

export function PartyStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="PartyList"
        component={PartyListScreen}
        options={{ title: "Parties" }}
      />
      <Stack.Screen
        name="CreateParty"
        component={CreatePartyScreen}
        options={{ title: "Create Party" }}
      />
      <Stack.Screen
        name="JoinParty"
        component={JoinPartyScreen}
        options={{ title: "Join Party" }}
      />
      <Stack.Screen
        name="PartyDetail"
        component={PartyDetailScreen}
        options={{ title: "Party" }}
      />
      <Stack.Screen
        name="PartySettings"
        component={PartySettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={{ title: "Member" }}
      />
      <Stack.Screen
        name="CreateChallenge"
        component={CreateChallengeScreen}
        options={{ title: "Create Challenge", gestureEnabled: true }}
      />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{ title: "Challenge", gestureEnabled: true }}
      />
      <Stack.Screen
        name="PlaceBet"
        component={PlaceBetScreen}
        options={{ title: "Place Bet", gestureEnabled: true }}
      />
      <Stack.Screen
        name="GameScreen"
        component={GameScreen}
        options={{ title: "Game", gestureEnabled: true }}
      />
      <Stack.Screen
        name="ResultsScreen"
        component={ResultsScreen}
        options={{ title: "Results", gestureEnabled: true }}
      />
      <Stack.Screen
        name="CreateWager"
        component={CreateWagerScreen}
        options={{ title: "New Wager" }}
      />
      <Stack.Screen
        name="WagerDetail"
        component={WagerDetailScreen}
        options={{ title: "Wager" }}
      />
      <Stack.Screen
        name="WagerPlaceBet"
        component={PlaceBetSheet}
        options={{ title: "Place Bet", presentation: "modal" }}
      />
      <Stack.Screen
        name="BetConfirmed"
        component={BetConfirmedSheet}
        options={{ title: "Bet Confirmed", presentation: "modal" }}
      />
      <Stack.Screen
        name="Reveal"
        component={RevealScreen}
        options={{ title: "Reveal" }}
      />
      {/* Leaderboard hidden for MVP
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: "Leaderboard" }}
      /> */}
      <Stack.Screen
        name="PartyDiscovery"
        component={PartyDiscoveryScreen}
        options={{ title: "Discover Parties" }}
      />
      {/* GlobalLeaderboard hidden for MVP
      <Stack.Screen
        name="GlobalLeaderboard"
        component={GlobalLeaderboardScreen}
        options={{ title: "Leaderboard" }}
      /> */}
      <Stack.Screen
        name="CharityPool"
        component={CharityPoolScreen}
        options={{ title: "Charity Pool" }}
      />
      <Stack.Screen
        name="RealMoneySettle"
        component={RealMoneySettleScreen}
        options={{ title: "Settle" }}
      />
    </Stack.Navigator>
  );
}
