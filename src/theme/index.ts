import { accessibility } from "./accessibility";
import { colors } from "./colors";
import { gradients } from "./gradients";
import { responsive } from "./responsive";
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
  responsive,
  accessibility,
} as const;

export type Theme = typeof theme;

export {
  accessibility,
  blur,
  borderRadius,
  colors,
  gradients,
  responsive,
  shadows,
  spacing,
  typography,
};
