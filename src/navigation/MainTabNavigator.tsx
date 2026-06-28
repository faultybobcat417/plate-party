import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { useEffect } from "react";

import { ActivityScreen } from "../screens/activity/ActivityScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { colors, typography } from "../theme";
import FeedStackNavigator from "./FeedStackNavigator";
import { PartyStackNavigator } from "./PartyStackNavigator";
import { PlayStackNavigator } from "./PlayStackNavigator";
import { ProfileStackNavigator } from "./ProfileStackNavigator";
import { OnlineBadge } from "../components/play/OnlineBadge";
import { useOnlineStore, startOnlinePresence, stopOnlinePresence } from "../stores/useOnlineStore";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        color: focused ? colors.glaze[600] : colors.ash[500],
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
      }}
    >
      {label}
    </Text>
  );
}

function PlayTabIcon({ focused }: { focused: boolean }) {
  const onlineCount = useOnlineStore((state) => state.onlineCount);
  return (
    <View>
      <TabIcon label="Play" focused={focused} />
      <OnlineBadge count={onlineCount} />
    </View>
  );
}

export function MainTabNavigator() {
  const { userId } = useCurrentUser();

  useEffect(() => {
    void startOnlinePresence(userId);
    return () => stopOnlinePresence();
  }, [userId]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.glaze[600],
        tabBarInactiveTintColor: colors.ash[500],
      }}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabIcon label="Feed" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PlayTab"
        component={PlayStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <PlayTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PartyTab"
        component={PartyStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabIcon label="Party" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
