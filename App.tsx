import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useState } from "react";

import { ThemeProvider, theme, colors } from "./src/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { runMigrations } from "./src/db/migrate";
import {
  ensureDefaultProfile,
  syncProfileToDatabase,
} from "./src/utils/profileStorage";

function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await runMigrations();
        await syncProfileToDatabase();
        if (__DEV__) {
          await ensureDefaultProfile();
        }
      } catch (error) {
        console.error("Database bootstrap failed:", error);
      }
      if (mounted) setReady(true);
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.glaze[600]} />
      </View>
    );
  }

  return children;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <DatabaseProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </DatabaseProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    alignItems: "center",
    backgroundColor: colors.linen[100],
    flex: 1,
    justifyContent: "center",
  },
});
