export const colors = {
  // Base colors
  black: "#000000",
  white: "#FFFFFF",

  // Dark mode backgrounds
  background: {
    primary: "#0A0A0F",
    secondary: "#121218",
    tertiary: "#1A1A24",
  },

  // Neon accent colors
  neon: {
    pink: "#FF006E",
    purple: "#8338EC",
    blue: "#3A86FF",
    cyan: "#00F5FF",
    green: "#06FFA5",
    yellow: "#FFBE0B",
    orange: "#FB5607",
  },

  // Glassmorphism overlays
  glass: {
    light: "rgba(255, 255, 255, 0.08)",
    medium: "rgba(255, 255, 255, 0.12)",
    heavy: "rgba(255, 255, 255, 0.18)",
  },

  // Text colors
  text: {
    primary: "#FFFFFF",
    secondary: "#A0A0B2",
    tertiary: "#6B6B7E",
    disabled: "#3A3A4A",
  },

  // Functional colors
  success: "#06FFA5",
  warning: "#FFBE0B",
  error: "#FF006E",
  info: "#3A86FF",
} as const;

export type Colors = typeof colors;
