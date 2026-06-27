import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useAuth } from "../../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInScreenProps {
  onSuccess: () => void;
}

export default function GoogleSignInScreen({ onSuccess }: GoogleSignInScreenProps) {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // For mobile, we rely on deep link callback
      Alert.alert(
        "Check Your Browser",
        "Complete sign-in in the browser. You will be redirected back to the app."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In with Google</Text>
      <Text style={styles.subtitle}>
        Secure, fast, and no password needed.
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0a0a0a" />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onSuccess}>
        <Text style={styles.link}>Use a different method</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "#FFD700",
    fontSize: 14,
    marginTop: 8,
  },
});
