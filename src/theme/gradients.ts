import { colors } from './colors';

export const gradients = {
  primary: [colors.neon.pink, colors.neon.purple],
  secondary: [colors.neon.blue, colors.neon.cyan],
  accent: [colors.neon.purple, colors.neon.blue],
  party: [colors.neon.pink, colors.neon.purple, colors.neon.blue],
  sunset: [colors.neon.orange, colors.neon.pink, colors.neon.purple],
  electric: [colors.neon.cyan, colors.neon.blue, colors.neon.purple],
  lime: [colors.neon.green, colors.neon.cyan],
  fire: [colors.neon.orange, colors.neon.yellow],
} as const;

export type Gradients = typeof gradients;
