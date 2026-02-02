import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Animated, StyleSheet } from "react-native";
import { AppText } from "../src/components";
import { theme } from "../src/theme";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate splash screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to home after delay
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[
        theme.colors.background.primary,
        theme.colors.background.secondary,
      ]}
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
        <LinearGradient
          colors={theme.gradients.party}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoCircle}
        />
        <AppText variant="h1" weight="black" center style={styles.title}>
          LOUDSYNC
        </AppText>
        <AppText variant="body" color={theme.colors.text.secondary} center>
          Sync Your Party Vibes
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
    gap: theme.spacing.lg,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.neon,
  },
  title: {
    marginTop: theme.spacing.md,
  },
});
