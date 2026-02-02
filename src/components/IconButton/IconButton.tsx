import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { theme } from "../../theme";

type IconButtonSize = "sm" | "md" | "lg";
type IconButtonVariant = "solid" | "outline" | "ghost" | "gradient";
type GradientType = keyof typeof theme.gradients;

interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  gradient?: GradientType;
  haptic?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = "md",
  variant = "ghost",
  gradient = "primary",
  haptic = true,
  disabled,
  style,
  onPress,
  ...props
}) => {
  const sizeStyles = {
    sm: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.md,
    },
    md: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.lg,
    },
    lg: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.xl,
    },
  };

  const currentSize = sizeStyles[size];

  const handlePress = (e: any) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const variantStyles = {
    solid: {
      backgroundColor: theme.colors.glass.medium,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: theme.colors.glass.heavy,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    gradient: {},
  };

  if (variant === "gradient") {
    return (
      <TouchableOpacity
        disabled={disabled}
        onPress={handlePress}
        style={[
          styles.container,
          currentSize,
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.7}
        {...props}
      >
        <LinearGradient
          colors={theme.gradients[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, currentSize]}
        >
          {icon}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.container,
        currentSize,
        variantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
