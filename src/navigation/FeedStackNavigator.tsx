import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { FeedStackParamList } from "../navigation/types";
import { FeedHomeScreen } from "../screens/feed/FeedHomeScreen";
import { EnterStakeScreen } from "../screens/feed/EnterStakeScreen";

const Stack = createNativeStackNavigator<FeedStackParamList>();

export default function FeedStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedHome" component={FeedHomeScreen} />
      <Stack.Screen name="EnterStake" component={EnterStakeScreen} />
    </Stack.Navigator>
  );
}
