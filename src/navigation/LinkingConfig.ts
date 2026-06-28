import * as Linking from "expo-linking";
import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "plateparty://"],
  config: {
    screens: {
      Main: {
        screens: {
          PartyTab: {
            screens: {
              ChallengeDetail: "challenge/:challengeId",
              JoinParty: "join/:inviteCode",
            },
          },
        },
      },
    },
  },
};
