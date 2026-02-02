import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../../theme";
import { AppText } from "../AppText/AppText";

const AnimatedTouchable = Animated.createAnimatedComponent(
  require("react-native").TouchableOpacity,
);

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
  onPress,
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

  // Animation values
  const scale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const glowIntensity = useSharedValue(0.5);

  // Continuous glow pulse
  useEffect(() => {
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 1500 }),
      withTiming(0.5, { duration: 1500 }),
    );
    const interval = setInterval(() => {
      glowIntensity.value = withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 }),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
    rippleOpacity.value = 0.5;
    rippleScale.value = 0;
    rippleScale.value = withTiming(1, { duration: 600 });
    rippleOpacity.value = withTiming(0, { duration: 600 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowIntensity.value, [0.5, 1], [0.3, 0.6]),
    transform: [
      { scale: interpolate(glowIntensity.value, [0.5, 1], [1, 1.05]) },
    ],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        animatedButtonStyle,
        style,
      ]}
    >
      <TouchableOpacity
        disabled={disabled || loading}
        style={[(disabled || loading) && styles.disabled]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
        {...props}
      >
        {/* Glow Effect */}
        <Animated.View
          style={[styles.glowContainer, animatedGlowStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              theme.gradients[gradient][0] + "80",
              theme.gradients[gradient][1] + "80",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.glow,
              {
                height: currentSize.height,
                borderRadius: currentSize.borderRadius,
              },
            ]}
          />
        </Animated.View>

        {/* Main Button */}
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
          {/* Ripple Effect */}
          <Animated.View style={[styles.ripple, animatedRippleStyle]}>
            <View
              style={[
                styles.rippleCircle,
                { borderRadius: currentSize.borderRadius },
              ]}
            />
          </Animated.View>

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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "flex-start",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.5,
  },
  glowContainer: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
  },
  glow: {
    flex: 1,
    ...theme.shadows.neon,
  },
  gradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  ripple: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  rippleCircle: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
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
});
