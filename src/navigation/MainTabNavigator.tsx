import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { ActivityScreen } from "../screens/activity/ActivityScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { colors, typography } from "../theme";
import { PartyStackNavigator } from "./PartyStackNavigator";
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

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.glaze[600],
        tabBarInactiveTintColor: colors.ash[500],
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={PartyStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabIcon label="Activity" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
