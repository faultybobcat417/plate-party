import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";

interface MagicLinkScreenProps {
  onSuccess: () => void;
}

export function MagicLinkScreen({ onSuccess }: MagicLinkScreenProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signInWithEmail } = useAuth();

  const handleSendLink = async () => {
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.message}>
          We sent a magic link to {email}. Tap the link in your email to sign in.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onSuccess}>
          <Text style={styles.buttonText}>I have signed in</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSent(false)}>
          <Text style={styles.link}>Use a different email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In with Email</Text>
      <Text style={styles.subtitle}>No password needed. We will send you a magic link.</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendLink}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0a0a0a" />
        ) : (
          <Text style={styles.buttonText}>Send Magic Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onSuccess}>
        <Text style={styles.link}>Continue as guest</Text>
      </TouchableOpacity>
    </View>
  );
}

export default MagicLinkScreen;

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
  message: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#FFD700",
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
