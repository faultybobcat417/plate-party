import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, typography } from "../../theme";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const { captureException } = require("../../lib/sentry");
      captureException(error, { componentStack: errorInfo.componentStack });
    } catch {
      // Sentry not available
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>💥</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <Pressable onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
    backgroundColor: colors.ink[900],
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.sizes.base,
    color: colors.ash[400],
    textAlign: "center",
    marginBottom: spacing[6],
    lineHeight: typography.lineHeights.base,
  },
  button: {
    backgroundColor: colors.glaze[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 99,
  },
  buttonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
});
