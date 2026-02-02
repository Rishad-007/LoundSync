import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, View } from "react-native";
import { AppText, GlassCard, GradientButton } from "../src/components";
import { theme } from "../src/theme";

export default function HomeScreen() {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const float4 = useRef(new Animated.Value(0)).current;
  const float5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle floating animation for background elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Floating icons animations with different speeds
    Animated.loop(
      Animated.timing(float1, {
        toValue: 1,
        duration: 6000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(float2, {
        toValue: 1,
        duration: 8000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(float3, {
        toValue: 1,
        duration: 7000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(float4, {
        toValue: 1,
        duration: 9000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(float5, {
        toValue: 1,
        duration: 7500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    // Glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Initial fade in
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  // Floating icon animations
  const floatY1 = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const floatY2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const floatY3 = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const floatY4 = float4.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });

  const floatY5 = float5.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        {/* Animated glow orbs */}
        <Animated.View
          style={[
            styles.glowOrb1,
            {
              opacity: glowOpacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.neon.purple + "20", "transparent"]}
            style={styles.glowOrbGradient}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.glowOrb2,
            {
              opacity: glowOpacity,
              transform: [{ translateY: Animated.multiply(translateY, -1) }],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.neon.cyan + "15", "transparent"]}
            style={styles.glowOrbGradient}
          />
        </Animated.View>

        {/* Floating Party Icons */}
        <Animated.View
          style={[
            styles.floatingIcon,
            styles.floatingIcon1,
            {
              opacity: 0.15,
              transform: [{ translateY: floatY1 }],
            },
          ]}
        >
          <Ionicons name="balloon" size={60} color={theme.colors.neon.pink} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingIcon,
            styles.floatingIcon2,
            {
              opacity: 0.12,
              transform: [{ translateY: floatY2 }],
            },
          ]}
        >
          <Ionicons
            name="musical-notes"
            size={50}
            color={theme.colors.neon.purple}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingIcon,
            styles.floatingIcon3,
            {
              opacity: 0.18,
              transform: [{ translateY: floatY3 }],
            },
          ]}
        >
          <Ionicons name="mic" size={70} color={theme.colors.neon.cyan} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingIcon,
            styles.floatingIcon4,
            {
              opacity: 0.1,
              transform: [{ translateY: floatY4 }],
            },
          ]}
        >
          <Ionicons name="disc" size={55} color={theme.colors.neon.yellow} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingIcon,
            styles.floatingIcon5,
            {
              opacity: 0.14,
              transform: [{ translateY: floatY5 }],
            },
          ]}
        >
          <Ionicons name="sparkles" size={45} color={theme.colors.neon.green} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeInAnim }}>
            {/* Hero Section */}
            <View style={styles.hero}>
              {/* Animated logo */}
              <Animated.View
                style={[
                  styles.logoWrapper,
                  {
                    transform: [
                      { translateY: Animated.multiply(translateY, 0.5) },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={theme.gradients.party}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoCircle}
                >
                  <Ionicons
                    name="volume-high"
                    size={56}
                    color={theme.colors.white}
                  />
                </LinearGradient>
              </Animated.View>

              <AppText
                variant="h2"
                weight="black"
                center
                style={styles.appTitle}
              >
                LOUDSYNC
              </AppText>

              <AppText
                variant="body"
                color={theme.colors.text.secondary}
                center
                style={styles.tagline}
              >
                Turn phones into one loud speaker
              </AppText>
            </View>

            {/* Action Cards */}
            <View style={styles.actionCards}>
              {/* Create Session Card */}
              <GlassCard intensity="medium" noBorder style={styles.actionCard}>
                <LinearGradient
                  colors={[...theme.gradients.primary, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradientOverlay}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardIconWrapper}>
                    <LinearGradient
                      colors={theme.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardIcon}
                    >
                      <Ionicons
                        name="add-circle"
                        size={28}
                        color={theme.colors.white}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.cardInfo}>
                    <AppText variant="h4" weight="bold">
                      Create Session
                    </AppText>
                    <AppText
                      variant="caption"
                      color={theme.colors.text.secondary}
                    >
                      Host a party
                    </AppText>
                  </View>
                </View>
                <GradientButton
                  title="Start"
                  gradient="primary"
                  size="lg"
                  fullWidth
                  onPress={() => router.push("/create-session")}
                />
              </GlassCard>

              {/* Join Session Card */}
              <GlassCard intensity="medium" noBorder style={styles.actionCard}>
                <LinearGradient
                  colors={[...theme.gradients.secondary, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradientOverlay}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardIconWrapper}>
                    <LinearGradient
                      colors={theme.gradients.secondary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardIcon}
                    >
                      <Ionicons
                        name="enter"
                        size={28}
                        color={theme.colors.white}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.cardInfo}>
                    <AppText variant="h4" weight="bold">
                      Join Session
                    </AppText>
                    <AppText
                      variant="caption"
                      color={theme.colors.text.secondary}
                    >
                      Connect to a party
                    </AppText>
                  </View>
                </View>
                <GradientButton
                  title="Join"
                  gradient="secondary"
                  size="lg"
                  fullWidth
                  onPress={() => router.push("/join-session")}
                />
              </GlassCard>
            </View>

            {/* Feature Highlights */}
            <View style={styles.features}>
              <AppText
                variant="overline"
                color={theme.colors.neon.cyan}
                center
                style={styles.featuresLabel}
              >
                How it works
              </AppText>

              <View style={styles.featureGrid}>
                <View style={styles.featureItem}>
                  <View
                    style={[
                      styles.featureDot,
                      { backgroundColor: theme.colors.neon.pink },
                    ]}
                  />
                  <AppText variant="body" weight="semibold">
                    Sync Audio
                  </AppText>
                  <AppText variant="caption" center>
                    Perfect timing across all devices
                  </AppText>
                </View>

                <View style={styles.featureItem}>
                  <View
                    style={[
                      styles.featureDot,
                      { backgroundColor: theme.colors.neon.cyan },
                    ]}
                  />
                  <AppText variant="body" weight="semibold">
                    Low Latency
                  </AppText>
                  <AppText variant="caption" center>
                    Under 20ms response time
                  </AppText>
                </View>

                <View style={styles.featureItem}>
                  <View
                    style={[
                      styles.featureDot,
                      { backgroundColor: theme.colors.neon.purple },
                    ]}
                  />
                  <AppText variant="body" weight="semibold">
                    Easy Setup
                  </AppText>
                  <AppText variant="caption" center>
                    Connect in seconds
                  </AppText>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing["2xl"] + theme.spacing.xl,
    paddingBottom: theme.spacing["3xl"],
  },
  glowOrb1: {
    position: "absolute",
    top: 50,
    right: -120,
    width: 250,
    height: 250,
  },
  glowOrb2: {
    position: "absolute",
    bottom: 150,
    left: -120,
    width: 250,
    height: 250,
  },
  glowOrbGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 125,
  },
  hero: {
    alignItems: "center",
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  logoWrapper: {
    marginBottom: theme.spacing.sm,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.neon,
  },
  appTitle: {
    letterSpacing: 4,
  },
  tagline: {
    maxWidth: "90%",
    lineHeight: 24,
  },
  actionCards: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  actionCard: {
    overflow: "hidden",
  },
  cardGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  cardIconWrapper: {
    width: 56,
    height: 56,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  cardInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  features: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  featuresLabel: {
    marginBottom: theme.spacing.xs,
  },
  featureGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    width: "100%",
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  featureDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  floatingIcon: {
    position: "absolute",
    zIndex: 0,
  },
  floatingIcon1: {
    top: 120,
    right: 30,
  },
  floatingIcon2: {
    top: 250,
    left: 20,
  },
  floatingIcon3: {
    top: 400,
    right: 40,
  },
  floatingIcon4: {
    bottom: 200,
    left: 30,
  },
  floatingIcon5: {
    bottom: 350,
    right: 25,
  },
});
