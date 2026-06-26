import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { CharityPickerScreen } from "../charity/CharityPickerScreen";

export function CharitySettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <CharityPickerScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
});
