import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInLeft,
} from "react-native-reanimated";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../src/components";
import { discoveryManager } from "../src/network/discoveryManager";
import type { DiscoveredSessionData } from "../src/network/types";
import { theme } from "../src/theme";

const AnimatedGlassCard = Animated.createAnimatedComponent(GlassCard);

export default function JoinSessionScreen() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [discoveredSessions, setDiscoveredSessions] = useState<
    DiscoveredSessionData[]
  >([]);
  const radarRotation = useRef(new RNAnimated.Value(0)).current;
  const pulseAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    // Radar rotation animation
    RNAnimated.loop(
      RNAnimated.timing(radarRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    ).start();

    // Pulse animation
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Start Discovery
    const initDiscovery = async () => {
      try {
        await discoveryManager.startDiscovery();
        setDiscoveredSessions(discoveryManager.getDiscoveredSessions());
      } catch (error) {
        console.warn("Discovery start failed:", error);
      }
    };

    initDiscovery();

    // Subscribe to updates
    const unsubscribe = discoveryManager.subscribe(
      () => setDiscoveredSessions(discoveryManager.getDiscoveredSessions()),
      () => setDiscoveredSessions(discoveryManager.getDiscoveredSessions()),
    );

    // Stop scanning animation after 5s
    const timer = setTimeout(() => setIsScanning(false), 5000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
      discoveryManager.stopDiscovery();
    };
  }, []);

  const radarRotate = radarRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  // Create animated style for pulse
  const pulseStyle = {
    transform: [{ scale: pulseScale }],
    opacity: pulseOpacity,
  };

  const handleJoinSession = (session?: DiscoveredSessionData) => {
    if (session) {
      router.push({
        pathname: "/player-room",
        params: {
          sessionId: session.advertisement.sessionId,
          sessionName: session.advertisement.sessionName,
          isHost: "false",
        },
      });
      return;
    }

    if (!sessionCode.trim()) {
      return;
    }

    // Strip dashes for ID
    const cleanId = sessionCode.replace(/[^A-Z0-9]/g, "");

    router.push({
      pathname: "/player-room",
      params: {
        sessionId: cleanId,
        sessionName: "Party Room",
        isHost: "false",
      },
    });
  };

  const formatSessionCode = (text: string) => {
    // Auto-format as XXX-XXX
    const cleaned = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length <= 3) {
      return cleaned;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
  };

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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              style={styles.header}
            >
              <IconButton
                icon={
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={theme.colors.white}
                  />
                }
                variant="ghost"
                size="md"
                onPress={() => router.back()}
                style={styles.backButton}
              />
              <AppText variant="h2" weight="bold">
                Join Session
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary}>
                Scan nearby or enter code
              </AppText>
            </Animated.View>

            {/* Animated Radar Scanner */}
            <Animated.View
              entering={FadeIn.delay(200).duration(800)}
              style={styles.radarSection}
            >
              <GlassCard intensity="heavy" style={styles.radarCard}>
                <LinearGradient
                  colors={[...theme.gradients.electric, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.radarGradient}
                />
                <View style={styles.radarContainer}>
                  {/* Pulse circles */}
                  <RNAnimated.View style={[styles.radarPulse, pulseStyle]} />
                  <View style={styles.radarCircle} />
                  <View style={[styles.radarCircle, styles.radarCircleMid]} />
                  <View style={[styles.radarCircle, styles.radarCircleInner]} />

                  {/* Rotating scan line */}
                  <RNAnimated.View
                    style={[
                      styles.radarScanLine,
                      { transform: [{ rotate: radarRotate }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        "transparent",
                        theme.colors.neon.cyan + "80",
                        "transparent",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.radarScanGradient}
                    />
                  </RNAnimated.View>

                  {/* Center icon */}
                  <View style={styles.radarCenter}>
                    <Ionicons
                      name="radio"
                      size={32}
                      color={theme.colors.neon.cyan}
                    />
                  </View>
                </View>
                <AppText variant="body" weight="semibold" center>
                  {isScanning
                    ? "Scanning nearby sessions..."
                    : discoveredSessions.length > 0
                      ? "Sessions Found"
                      : "Scan Complete"}
                </AppText>
                {!isScanning && discoveredSessions.length > 0 && (
                  <AppText
                    variant="caption"
                    center
                    color={theme.colors.neon.green}
                  >
                    {discoveredSessions.length} session
                    {discoveredSessions.length !== 1 ? "s" : ""} found
                  </AppText>
                )}
              </GlassCard>
            </Animated.View>

            {/* Nearby Sessions */}
            {(discoveredSessions.length > 0 || !isScanning) && (
              <Animated.View
                entering={FadeInUp.delay(100).duration(600).springify()}
                layout={Layout.springify()}
                style={styles.nearbySection}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="wifi"
                    size={20}
                    color={theme.colors.neon.cyan}
                  />
                  <AppText variant="h4" weight="bold">
                    Nearby Sessions
                  </AppText>
                </View>

                {discoveredSessions.length === 0 ? (
                  <GlassCard intensity="light" style={styles.sessionCard}>
                    <View style={{ padding: 20, alignItems: "center" }}>
                      <AppText
                        variant="body"
                        color={theme.colors.text.secondary}
                      >
                        No nearby sessions found.
                      </AppText>
                      <AppText
                        variant="caption"
                        color={theme.colors.text.tertiary}
                      >
                        Make sure you are on the same Wi-Fi.
                      </AppText>
                    </View>
                  </GlassCard>
                ) : (
                  discoveredSessions.map((session, index) => (
                    <Animated.View
                      key={session.advertisement.sessionId}
                      entering={SlideInLeft.delay(200 + index * 100)
                        .duration(600)
                        .springify()}
                      layout={Layout.springify()}
                    >
                      <GlassCard intensity="medium" style={styles.sessionCard}>
                        <LinearGradient
                          colors={[...theme.gradients.electric, "transparent"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.sessionGradient}
                        />
                        <View style={styles.sessionHeader}>
                          <View style={styles.sessionIconLarge}>
                            <Ionicons
                              name="musical-notes"
                              size={28}
                              color={theme.colors.neon.cyan}
                            />
                          </View>
                          <View style={styles.sessionInfo}>
                            <AppText variant="body" weight="bold">
                              {session.advertisement.sessionName}
                            </AppText>
                            <AppText variant="caption">
                              Host: {session.advertisement.hostName} •{" "}
                              {session.advertisement.memberCount}/
                              {session.advertisement.maxMembers}
                            </AppText>
                            <View style={styles.sessionMeta}>
                              <View style={styles.signalBadge}>
                                <Ionicons
                                  name="radio"
                                  size={12}
                                  color={theme.colors.neon.green}
                                />
                                <AppText
                                  variant="caption"
                                  style={styles.signalText}
                                >
                                  Detected
                                </AppText>
                              </View>
                            </View>
                          </View>
                          <GradientButton
                            title="Join"
                            gradient="secondary"
                            size="sm"
                            onPress={() => handleJoinSession(session)}
                          />
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ))
                )}
              </Animated.View>
            )}

            {/* Manual Code Input */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(600).springify()}
              style={styles.codeInputSection}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="keypad"
                  size={20}
                  color={theme.colors.neon.purple}
                />
                <AppText variant="h4" weight="bold">
                  Enter Code Manually
                </AppText>
              </View>
              <LinearGradient
                colors={theme.gradients.electric}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.codeInputGradient}
              >
                <View style={styles.codeInputInner}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="XXX-XXX"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={sessionCode}
                    onChangeText={(text) =>
                      setSessionCode(formatSessionCode(text))
                    }
                    maxLength={7}
                    autoCapitalize="characters"
                    textAlign="center"
                  />
                </View>
              </LinearGradient>
              <AppText
                variant="caption"
                center
                color={theme.colors.text.tertiary}
              >
                Get the code from your session host
              </AppText>
            </Animated.View>

            {/* Info Card */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(600).springify()}
            >
              <GlassCard intensity="light" pressable style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="help-circle"
                    size={24}
                    color={theme.colors.neon.purple}
                  />
                  <View style={styles.infoText}>
                    <AppText variant="body" weight="semibold">
                      How to join?
                    </AppText>
                    <AppText variant="caption">
                      Ask the host for the session code and enter it above.
                      You'll be connected instantly!
                    </AppText>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Join Button */}
            <Animated.View
              entering={FadeInUp.delay(500).duration(600).springify()}
              style={styles.actions}
            >
              <GradientButton
                title="Join Session"
                gradient="secondary"
                size="lg"
                fullWidth
                disabled={sessionCode.length < 7}
                icon={<Ionicons name="enter" size={24} color="white" />}
                onPress={() => handleJoinSession()}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing["2xl"],
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing.md,
  },
  radarSection: {
    marginBottom: theme.spacing.xl,
  },
  radarCard: {
    overflow: "hidden",
    paddingVertical: theme.spacing.xl,
  },
  radarGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  radarContainer: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  radarCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.neon.cyan + "30",
  },
  radarCircleMid: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  radarCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  radarPulse: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.neon.cyan,
  },
  radarScanLine: {
    position: "absolute",
    width: 100,
    height: 2,
    left: 100,
    top: 99,
  },
  radarScanGradient: {
    width: "100%",
    height: "100%",
  },
  radarCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.neon.cyan,
  },
  nearbySection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  codeInputSection: {
    marginBottom: theme.spacing.xl,
  },
  codeInputGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 3,
    width: "100%",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  codeInputInner: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  codeInput: {
    padding: theme.spacing.xl,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize["3xl"],
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 8,
  },
  quickJoinSection: {
    marginBottom: theme.spacing.xl,
  },
  sessionCard: {
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  sessionGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.glass.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionIconLarge: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.glass.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  signalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.glass.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  signalText: {
    fontSize: 11,
  },
  infoCard: {
    marginBottom: theme.spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  actions: {
    marginBottom: theme.spacing.xl,
  },
});
