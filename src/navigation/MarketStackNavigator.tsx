import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MarketHomeScreen from "../screens/market/MarketHomeScreen";
import MarketDetailScreen from "../screens/market/MarketDetailScreen";
import { WatchlistScreen } from "../screens/market/WatchlistScreen";
import type { MarketStackParamList } from "./types";
import TradeScreen from "../screens/market/TradeScreen";

const Stack = createNativeStackNavigator<MarketStackParamList>();

export function MarketStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="MarketHome"
        component={MarketHomeScreen}
        options={{ title: "Market", headerShown: false }}
      />
      <Stack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={{ title: "Market Detail" }}
      />
      <Stack.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{ title: "Watchlist" }}
      />
      <Stack.Screen
        name="Trade"
        component={TradeScreen}
        options={{ title: "Trade" }}
      />
    </Stack.Navigator>
  );
}
