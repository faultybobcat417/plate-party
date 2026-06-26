import { Platform } from "react-native";

const palette = {
  purple: {
    50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD",
    400: "#A78BFA", 500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9",
    800: "#5B21B6", 900: "#4C1D95", 950: "#2E1065",
  },
  gray: {
    0: "#FFFFFF", 50: "#FCFAFF", 100: "#F5F3F7", 200: "#E5E1EB",
    300: "#D1CBD7", 400: "#A89FB0", 500: "#6B6478", 600: "#504A5C",
    700: "#3A3544", 800: "#252230", 900: "#0F0C19", 950: "#080610",
  },
  success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6",
  plate: "#F59E0B", impact: "#34D399",
} as const;

export const primary = {
  base: palette.purple[600], dark: palette.purple[700], darker: palette.purple[800],
  light: palette.purple[100], subtle: palette.purple[200],
  gradient: [palette.purple[600], palette.purple[700]] as const,
} as const;

export const neutral = {
  0: palette.gray[0], 50: palette.gray[50], 100: palette.gray[100], 200: palette.gray[200],
  300: palette.gray[300], 400: palette.gray[400], 500: palette.gray[500], 600: palette.gray[600],
  700: palette.gray[700], 800: palette.gray[800], 900: palette.gray[900], 950: palette.gray[950],
} as const;

export const semantic = {
  success: palette.success, error: palette.error, warning: palette.warning, info: palette.info,
  successBg: "#D1FAE5", errorBg: "#FEE2E2", warningBg: "#FEF3C7", infoBg: "#DBEAFE",
} as const;

export const charity = { plate: palette.plate, impact: palette.impact } as const;

// ── BACKWARD-COMPATIBLE ALIASES ──
export const ink = {
  50: neutral[50], 100: neutral[100], 200: neutral[200], 300: neutral[300],
  400: neutral[400], 500: neutral[500], 600: neutral[600], 700: neutral[700],
  800: neutral[800], 900: neutral[900], 950: neutral[950],
} as const;

export const glaze = {
  50: primary.light, 100: primary.light, 200: primary.subtle, 300: palette.purple[300],
  400: palette.purple[400], 500: primary.base, 600: primary.base, 700: primary.dark,
  800: primary.darker, 900: palette.purple[900], 950: palette.purple[950],
} as const;

export const linen = { 50: neutral[50], 100: neutral[100], 200: neutral[200], 300: neutral[300] } as const;
export const ash = {
  100: neutral[100], 200: neutral[200], 300: neutral[300], 400: neutral[400],
  500: neutral[500], 600: neutral[600],
} as const;
export const stone = { 700: neutral[700], 800: neutral[800], 900: neutral[900] } as const;
export const gold = charity.plate;

export const wine = {
  50: "#FEF2F2", 100: "#FEE2E2", 200: "#FECACA", 300: "#FCA5A5", 400: "#F87171",
  500: palette.error, 600: "#DC2626", 700: "#B91C1C", 800: "#991B1B", 900: "#7F1D1D",
} as const;

export const mustard = {
  50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D", 400: "#FBBF24",
  500: palette.warning, 600: "#D97706", 700: "#B45309", 800: "#92400E", 900: "#78350F",
} as const;

export const win = semantic.success;
export const lose = semantic.error;
export const clay = { 500: "#C2410C" } as const;
export const iron = { 500: neutral[500] } as const;

export const colors = {
  primary, neutral, semantic, charity,
  ink, glaze, linen, ash, stone, gold, wine, mustard, win, lose, clay, iron,
  white: neutral[0], black: neutral[900],
} as const;

export type Colors = typeof colors;
