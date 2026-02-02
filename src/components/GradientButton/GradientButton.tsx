import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { theme } from "../../theme";
import { AppText } from "../AppText/AppText";

type ButtonSize = "sm" | "md" | "lg";
type GradientType = keyof typeof theme.gradients;

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  size?: ButtonSize;
  gradient?: GradientType;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  size = "md",
  gradient = "primary",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const sizeStyles = {
    sm: {
      height: 40,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      height: 52,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      height: 60,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      fontSize: theme.typography.fontSize.lg,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      <LinearGradient
        colors={theme.gradients[gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            borderRadius: currentSize.borderRadius,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === "left" && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <AppText
              weight="bold"
              style={{ fontSize: currentSize.fontSize }}
              color={theme.colors.white}
            >
              {title}
            </AppText>
            {icon && iconPosition === "right" && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
