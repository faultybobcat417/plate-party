import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  type TextInputProps,
} from "react-native";

import { colors, spacing, typography } from "../../theme";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
};

export function Input({ label, error, helper, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={helper}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            borderColor: error ? colors.wine[500] : focused ? colors.glaze[500] : colors.ash[300],
          },
          style,
        ]}
        placeholderTextColor={colors.ash[500]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {helper && !error ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
    width: "100%",
  },
  label: {
    color: colors.ink[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1],
  },
  input: {
    backgroundColor: colors.linen[50],
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink[900],
    fontSize: typography.sizes.base,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  error: {
    color: colors.wine[500],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  helper: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
});
