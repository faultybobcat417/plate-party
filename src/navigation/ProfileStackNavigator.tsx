import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme";

import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { GiverLeaderboardScreen } from "../screens/profile/GiverLeaderboardScreen";
import { CharitySettingsScreen } from "../screens/profile/CharitySettingsScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { ActivityHistoryScreen } from "../screens/activity/ActivityHistoryScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { PlateStoreScreen } from "../screens/play/PlateStoreScreen";
import type { ProfileStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: colors.ink[900] }, headerTintColor: colors.glaze[500] }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: "Profile", headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="GiverLeaderboard" component={GiverLeaderboardScreen} options={{ title: "Top Givers", headerShown: false }} />
      <Stack.Screen name="CharitySettings" component={CharitySettingsScreen} options={{ title: "Charity Settings" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} options={{ title: "Activity" }} />
      <Stack.Screen name="PlateStore" component={PlateStoreScreen} options={{ title: "Buy Plates" }} />
    </Stack.Navigator>
  );
}
