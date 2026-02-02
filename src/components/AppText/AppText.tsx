import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { theme } from "../../theme";

type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "bodyLarge"
  | "caption"
  | "overline";
type TextWeight = "regular" | "medium" | "semibold" | "bold" | "black";

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  gradient?: boolean;
  center?: boolean;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = "body",
  weight = "regular",
  color = theme.colors.text.primary,
  gradient = false,
  center = false,
  style,
  children,
  ...props
}) => {
  const variantStyles = {
    h1: {
      fontSize: theme.typography.fontSize["5xl"],
      lineHeight:
        theme.typography.fontSize["5xl"] * theme.typography.lineHeight.tight,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    h2: {
      fontSize: theme.typography.fontSize["4xl"],
      lineHeight:
        theme.typography.fontSize["4xl"] * theme.typography.lineHeight.tight,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    h3: {
      fontSize: theme.typography.fontSize["3xl"],
      lineHeight:
        theme.typography.fontSize["3xl"] * theme.typography.lineHeight.normal,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    h4: {
      fontSize: theme.typography.fontSize["2xl"],
      lineHeight:
        theme.typography.fontSize["2xl"] * theme.typography.lineHeight.normal,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    body: {
      fontSize: theme.typography.fontSize.base,
      lineHeight:
        theme.typography.fontSize.base * theme.typography.lineHeight.normal,
    },
    bodyLarge: {
      fontSize: theme.typography.fontSize.lg,
      lineHeight:
        theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
    },
    caption: {
      fontSize: theme.typography.fontSize.sm,
      lineHeight:
        theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
      color: theme.colors.text.secondary,
    },
    overline: {
      fontSize: theme.typography.fontSize.xs,
      lineHeight:
        theme.typography.fontSize.xs * theme.typography.lineHeight.normal,
      textTransform: "uppercase" as const,
      letterSpacing: theme.typography.letterSpacing.wider,
      fontWeight: theme.typography.fontWeight.bold,
    },
  };

  return (
    <Text
      style={[
        styles.base,
        variantStyles[variant],
        { fontWeight: theme.typography.fontWeight[weight] },
        !gradient && { color },
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: theme.typography.fontFamily.regular,
  },
  center: {
    textAlign: "center",
  },
});
