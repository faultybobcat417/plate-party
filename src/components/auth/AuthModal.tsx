import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { useAuth } from "../../context/AuthContext";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../primitives/Button";

export type AuthModalProps = {
  visible: boolean;
  reason?: string;
  onClose: () => void;
  onSignedIn?: () => void;
};

const EmailSchema = z.string().trim().email("Enter a valid email address.");
const PasswordSchema = z.string().min(6, "Password must be at least 6 characters.");

export function AuthModal({ visible, reason, onClose, onSignedIn }: AuthModalProps) {
  const {
    signInWithApple,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signInAsGuest,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailPasswordValid = useMemo(() => {
    return EmailSchema.safeParse(email).success && PasswordSchema.safeParse(password).success;
  }, [email, password]);

  const finish = useCallback(() => {
    setError(null);
    setLoadingAction(null);
    onSignedIn?.();
    onClose();
  }, [onClose, onSignedIn]);

  const runAuth = useCallback(async (actionName: string, action: () => Promise<void>) => {
    setLoadingAction(actionName);
    setError(null);
    try {
      await action();
      finish();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed. Please try again.");
      setLoadingAction(null);
    }
  }, [finish]);

  const continueWithEmail = useCallback(async () => {
    const parsedEmail = EmailSchema.safeParse(email);
    const parsedPassword = PasswordSchema.safeParse(password);
    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    if (!parsedPassword.success) {
      setError(parsedPassword.error.issues[0]?.message ?? "Password must be at least 6 characters.");
      return;
    }

    await runAuth("email", async () => {
      try {
        await signInWithPassword(parsedEmail.data, parsedPassword.data);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message.toLocaleLowerCase() : "";
        if (message.includes("invalid") || message.includes("credentials") || message.includes("not found")) {
          await signUpWithPassword(parsedEmail.data, parsedPassword.data);
          return;
        }
        throw caught;
      }
    });
  }, [email, password, runAuth, signInWithPassword, signUpWithPassword]);

  const continueAsGuest = useCallback(async () => {
    await runAuth("guest", signInAsGuest);
  }, [runAuth, signInAsGuest]);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close sign in" onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Sign in to Plate Party</Text>
          <Text style={styles.subtitle}>
            {reason ?? "Save your progress, wager plates, and join parties with friends."}
          </Text>

          <View style={styles.providerStack}>
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(loadingAction)}
              onPress={() => void runAuth("apple", signInWithApple)}
              style={[styles.providerButton, styles.appleButton]}
            >
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
              {loadingAction === "apple" ? <ActivityIndicator color={colors.white} /> : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={Boolean(loadingAction)}
              onPress={() => void runAuth("google", signInWithGoogle)}
              style={[styles.providerButton, styles.googleButton]}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
              {loadingAction === "google" ? <ActivityIndicator color={colors.ink[900]} /> : null}
            </Pressable>
          </View>

          <View style={styles.emailPanel}>
            <Text style={styles.panelTitle}>Email / Password</Text>
            <TextInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.ash[500]}
              style={styles.input}
              value={email}
            />
            <TextInput
              accessibilityLabel="Password"
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.ash[500]}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <Button
              title="Sign In / Create Account"
              loading={loadingAction === "email"}
              disabled={!emailPasswordValid || Boolean(loadingAction)}
              onPress={() => void continueWithEmail()}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="Continue as Guest"
            variant="ghost"
            loading={loadingAction === "guest"}
            disabled={Boolean(loadingAction)}
            onPress={() => void continueAsGuest()}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink[900],
    flex: 1,
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[8],
  },
  closeText: {
    color: colors.glaze[400],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  content: {
    flex: 1,
    gap: spacing[4],
    justifyContent: "center",
    padding: spacing[5],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.ash[400],
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.md,
    textAlign: "center",
  },
  providerStack: {
    gap: spacing[3],
  },
  providerButton: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing[4],
  },
  appleButton: {
    backgroundColor: colors.black,
    borderColor: colors.ink[700],
    borderWidth: 1,
  },
  appleButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  googleButton: {
    backgroundColor: colors.white,
  },
  googleButtonText: {
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  emailPanel: {
    backgroundColor: colors.ink[800],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  panelTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  input: {
    backgroundColor: colors.ink[900],
    borderColor: colors.ink[700],
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: typography.sizes.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  errorText: {
    color: colors.wine[400],
    fontSize: typography.sizes.sm,
    textAlign: "center",
  },
});
