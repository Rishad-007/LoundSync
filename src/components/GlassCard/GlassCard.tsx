import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../../theme";

type GlassIntensity = "light" | "medium" | "heavy";

interface GlassCardProps extends ViewProps {
  intensity?: GlassIntensity;
  blur?: keyof typeof theme.blur;
  noBorder?: boolean;
  pressable?: boolean;
  children: React.ReactNode;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = "medium",
  blur = "md",
  noBorder = false,
  pressable = false,
  style,
  children,
  onTouchStart,
  onTouchEnd,
  ...props
}) => {
  const intensityColors = {
    light: theme.colors.glass.light,
    medium: theme.colors.glass.medium,
    heavy: theme.colors.glass.heavy,
  };

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const handlePressIn = (e: any) => {
    if (pressable) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      glowOpacity.value = withTiming(0.4, { duration: 200 });
    }
    onTouchStart?.(e);
  };

  const handlePressOut = (e: any) => {
    if (pressable) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
    onTouchEnd?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <AnimatedView
      style={[
        styles.container,
        {
          backgroundColor: intensityColors[intensity],
          borderRadius: theme.borderRadius.lg,
          borderWidth: noBorder ? 0 : 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
        theme.shadows.md,
        animatedStyle,
        style,
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      {...props}
    >
      {/* Glow Effect on Press */}
      {pressable && (
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
      )}
      <BlurView intensity={theme.blur[blur]} style={styles.blur} tint="dark">
        {children}
      </BlurView>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  blur: {
    padding: theme.spacing.lg,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: theme.borderRadius.lg,
  },
});
