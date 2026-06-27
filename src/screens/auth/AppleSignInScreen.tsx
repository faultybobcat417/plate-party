import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "../../context/AuthContext";

interface AppleSignInScreenProps {
  onSuccess: () => void;
}

export function AppleSignInScreen({ onSuccess }: AppleSignInScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Not Available", "Apple Sign-In is only available on iOS devices.");
      return;
    }

    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { supabase } = await import("../../lib/supabase");
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (error) throw error;
        onSuccess();
      }
    } catch (error: any) {
      if (error.code === "ERR_CANCELED") {
        // User cancelled
      } else {
        Alert.alert("Error", error.message || "Apple sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== "ios") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Apple Sign-In</Text>
        <Text style={styles.subtitle}>This feature is only available on iOS devices.</Text>
        <TouchableOpacity onPress={onSuccess}>
          <Text style={styles.link}>Use a different method</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In with Apple</Text>
      <Text style={styles.subtitle}>Private, secure, and no tracking.</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue with Apple</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onSuccess}>
        <Text style={styles.link}>Use a different method</Text>
      </TouchableOpacity>
    </View>
  );
}

export default AppleSignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0a0a0a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 32,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "#FFD700",
    fontSize: 14,
    marginTop: 8,
  },
});
