import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../screens/profile/ProfileScreen";
import { GiverLeaderboardScreen } from "../screens/profile/GiverLeaderboardScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { ActivityHistoryScreen } from "../screens/activity/ActivityHistoryScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import type { ProfileStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Edit Profile" }}
      />
      <Stack.Screen
        name="GiverLeaderboard"
        component={GiverLeaderboardScreen}
        options={{ title: "Top Givers", headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="ActivityHistory"
        component={ActivityHistoryScreen}
        options={{ title: "Activity" }}
      />
    </Stack.Navigator>
  );
}
