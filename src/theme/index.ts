import { colors } from "./colors";
import { gradients } from "./gradients";
import { blur, shadows } from "./shadows";
import { borderRadius, spacing } from "./spacing";
import { typography } from "./typography";

export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  blur,
} as const;

export type Theme = typeof theme;

export { blur, borderRadius, colors, gradients, shadows, spacing, typography };
