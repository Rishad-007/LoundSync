import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { AppText } from "../src/components";
import { theme } from "../src/theme";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for logo (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Subtle rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to home after delay
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={[
        theme.colors.background.primary,
        theme.colors.neon.purple + "20",
        theme.colors.neon.pink + "20",
      ]}
      locations={[0, 0.6, 1]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Rotating gradient ring */}
        <Animated.View
          style={[
            styles.ringOuter,
            {
              transform: [{ rotate: spin }, { scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              theme.colors.neon.pink,
              theme.colors.neon.purple,
              theme.colors.neon.cyan,
              theme.colors.neon.pink,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ring}
          />
        </Animated.View>

        {/* Logo circle with pulse */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={theme.gradients.party}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Ionicons name="volume-high" size={64} color={theme.colors.white} />
          </LinearGradient>
        </Animated.View>

        <AppText variant="h1" weight="black" center style={styles.title}>
          LOUDSYNC
        </AppText>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: theme.spacing.xl,
  },
  ringOuter: {
    position: "absolute",
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.3,
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.neon,
  },
  title: {
    marginTop: theme.spacing.xl,
    letterSpacing: 4,
  },
});
