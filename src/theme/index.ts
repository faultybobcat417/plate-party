import * as React from "react";
import { createContext, useContext } from "react";
import { colors } from "./colors";
import { typography, sizes, weights, lineHeights, letterSpacing, fontFamily } from "./typography";
import { spacing } from "./spacing";

export { colors, typography, spacing, sizes, weights, lineHeights, letterSpacing, fontFamily };

export const theme = {
  colors, typography, spacing, sizes, weights, lineHeights, letterSpacing, fontFamily,
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadows: {
    sm: { shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  },
} as const;

export type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children, value }: { children: React.ReactNode; value?: Theme }) {
  return React.createElement(ThemeContext.Provider, { value: value ?? theme }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}
