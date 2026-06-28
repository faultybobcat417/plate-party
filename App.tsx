import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider, theme } from "./src/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { linking } from "./src/navigation/LinkingConfig";
import { AuthProvider } from "./src/context/AuthContext";
import { queryClient } from "./src/lib/queryClient";
import { useDeepLink } from "./src/hooks/useDeepLink";
import { OfflineSyncIndicator } from "./src/components/composite/OfflineSyncIndicator";

function DeepLinkHandler() {
  useDeepLink();
  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider value={theme}>
              <NavigationContainer linking={linking}>
                <DeepLinkHandler />
                <RootNavigator />
                <OfflineSyncIndicator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
