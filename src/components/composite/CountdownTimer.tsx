import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { colors, typography } from "../../theme";

export type CountdownTimerProps = {
  deadline: string;
};

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Ended";

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => {
    return new Date(deadline).getTime() - Date.now();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const next = new Date(deadline).getTime() - Date.now();
      setRemaining(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const urgent = remaining > 0 && remaining < 60 * 60 * 1000;

  return (
    <Text style={[styles.text, urgent && styles.urgent]}>
      {formatTimeRemaining(remaining)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.ash[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  urgent: {
    color: colors.wine[500],
  },
});
