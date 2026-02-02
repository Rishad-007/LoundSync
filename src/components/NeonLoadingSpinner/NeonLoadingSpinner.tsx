/**
 * NeonLoadingSpinner
 *
 * Animated loading indicator with neon glow effect
 * Uses Reanimated for smooth 60fps animations
 */

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../../theme";

interface NeonLoadingSpinnerProps {
  size?: number;
  color?: readonly [string, string, ...string[]];
}

export const NeonLoadingSpinner: React.FC<NeonLoadingSpinnerProps> = ({
  size = 40,
  color = theme.gradients.primary,
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    // Pulse effect
    scale.value = withRepeat(
      withTiming(1.1, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  // Create 8 dots in a circle
  const dots = Array.from({ length: 8 });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.spinner, animatedStyle]}>
        {dots.map((_, index) => {
          const angle = (index * 360) / 8;
          const opacity = interpolate(rotation.value, [0, 360], [0.3, 1]);

          return (
            <View
              key={index}
              style={[
                styles.dotContainer,
                {
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: -size / 3 },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={color}
                style={[
                  styles.dot,
                  {
                    width: size / 6,
                    height: size / 6,
                    opacity: 1 - index * 0.1,
                  },
                ]}
              />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dotContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    borderRadius: 999,
    ...theme.shadows.neon,
  },
});
