import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../src/components";
import {
  useCurrentSession,
  useIsHost,
  useLoudSyncStore,
  useMembers,
} from "../src/state";
import { theme } from "../src/theme";

const AnimatedGlassCard = Animated.createAnimatedComponent(GlassCard);

export default function PlayerRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    sessionName: string;
    isHost: string;
  }>();

  // State integration
  const session = useCurrentSession();
  const members = useMembers();
  const isHost = useIsHost();
  const { leaveSession, stopHosting } = useLoudSyncStore();

  // Local state
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(0.75);
  const [progress, setProgress] = React.useState(0.35);

  // Derived state
  const connectedDevices = members.length;
  const syncHealth = React.useMemo(() => {
    // Calculate sync health based on latency variance
    if (members.length === 0) return 100;
    const latencies = members.map((m) => m.latency || 0).filter((l) => l > 0);
    if (latencies.length === 0) return 100;
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    // Simple heuristic: < 20ms = 100%, 100ms = 50%
    return Math.round(Math.max(0, Math.min(100, 100 - (avg - 20))));
  }, [members]);

  // Enhanced waveform animations with Reanimated
  const waveAnims = Array.from({ length: 20 }, () => useSharedValue(0.3));

  // Neon glow pulse
  const glowPulse = useSharedValue(0);

  // Party color pulse
  const colorPulse = useSharedValue(0);

  useEffect(() => {
    // Start glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    // Start color pulse
    colorPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  useEffect(() => {
    // Waveform animation
    if (isPlaying) {
      waveAnims.forEach((anim, index) => {
        anim.value = withRepeat(
          withSequence(
            withTiming(Math.random() * 0.8 + 0.4, {
              duration: 300 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(Math.random() * 0.5 + 0.2, {
              duration: 300 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          false,
        );
      });
    } else {
      waveAnims.forEach((anim) => {
        anim.value = withTiming(0.3, { duration: 300 });
      });
    }
  }, [isPlaying]);

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.5, 1]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.02]) }],
  }));

  const colorPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(colorPulse.value, [0, 1], [0.15, 0.35]),
  }));

  const handleLeaveSession = async () => {
    Alert.alert(
      isHost ? "End Session?" : "Leave Session?",
      isHost
        ? "This will disconnect all users and end the session."
        : "Are you sure you want to leave?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isHost ? "End Session" : "Leave",
          style: "destructive",
          onPress: async () => {
            if (isHost) {
              await stopHosting();
            } else {
              leaveSession();
            }
            router.replace("/home");
          },
        },
      ],
    );
  };

  const handleShareSession = async () => {
    if (!session) return;
    try {
      await Share.share({
        message: `Join my LOUDSYNC party! Code: ${session.id}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeviceList = () => {
    router.push("/modal/device-list");
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
        {/* Party Color Effects with Neon Glow */}
        <Animated.View
          style={[styles.colorEffect, styles.colorEffectTop, colorPulseStyle]}
        >
          <LinearGradient
            colors={[theme.colors.neon.pink + "60", "transparent"]}
            style={styles.colorGradient}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.colorEffect,
            styles.colorEffectBottom,
            colorPulseStyle,
          ]}
        >
          <LinearGradient
            colors={["transparent", theme.colors.neon.cyan + "60"]}
            style={styles.colorGradient}
          />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
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
                onPress={handleLeaveSession}
              />
              {isHost && (
                <View style={styles.hostBadge}>
                  <Ionicons
                    name="star"
                    size={16}
                    color={theme.colors.neon.yellow}
                  />
                  <AppText variant="caption" weight="bold">
                    HOST
                  </AppText>
                </View>
              )}
            </View>

            <AppText variant="h2" weight="bold" center>
              {session?.name || params.sessionName}
            </AppText>

            <View style={styles.sessionCodeContainer}>
              <AppText variant="body" color={theme.colors.text.secondary}>
                Session Code:
              </AppText>
              <Pressable onPress={handleShareSession}>
                <GlassCard intensity="light" style={styles.codeBadge}>
                  <AppText
                    variant="body"
                    weight="bold"
                    color={theme.colors.neon.cyan}
                  >
                    {session?.id || params.sessionId}
                  </AppText>
                  <Ionicons
                    name="share-outline"
                    size={16}
                    color={theme.colors.neon.cyan}
                    style={{ marginLeft: 8 }}
                  />
                </GlassCard>
              </Pressable>
            </View>
          </Animated.View>

          {/* Session Info with Sync Health */}
          <AnimatedGlassCard
            entering={FadeInUp.delay(100).duration(600).springify()}
            intensity="medium"
            pressable
            style={styles.infoCard}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="people"
                  size={24}
                  color={theme.colors.neon.cyan}
                />
                <AppText variant="h4">{connectedDevices}</AppText>
                <AppText variant="caption">Devices</AppText>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Ionicons
                  name="wifi"
                  size={24}
                  color={theme.colors.neon.green}
                />
                <AppText variant="h4">
                  {members.length > 0 ? members[0].latency || 0 : 0}ms
                </AppText>
                <AppText variant="caption">Latency</AppText>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Ionicons
                  name="pulse"
                  size={24}
                  color={
                    syncHealth >= 80
                      ? theme.colors.neon.green
                      : syncHealth >= 50
                        ? theme.colors.neon.yellow
                        : theme.colors.neon.orange
                  }
                />
                <AppText variant="h4">{syncHealth}%</AppText>
                <AppText variant="caption">Sync</AppText>
              </View>
            </View>

            {/* Sync Health Indicator */}
            <View style={styles.syncHealthBar}>
              <View style={styles.syncHealthTrack}>
                <LinearGradient
                  colors={
                    syncHealth >= 80
                      ? [theme.colors.neon.green, theme.colors.neon.cyan]
                      : syncHealth >= 50
                        ? [theme.colors.neon.yellow, theme.colors.neon.orange]
                        : [theme.colors.neon.orange, theme.colors.neon.pink]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.syncHealthFill, { width: `${syncHealth}%` }]}
                />
              </View>
              <AppText
                variant="caption"
                center
                color={theme.colors.text.tertiary}
              >
                {syncHealth >= 80
                  ? "Excellent"
                  : syncHealth >= 50
                    ? "Good"
                    : "Poor"}{" "}
                synchronization
              </AppText>
            </View>
          </AnimatedGlassCard>

          {/* Player Section */}
          <AnimatedGlassCard
            entering={FadeInUp.delay(200).duration(600).springify()}
            intensity="heavy"
            style={styles.playerCard}
          >
            {/* Now Playing Badge */}
            {isPlaying && (
              <View style={styles.nowPlayingBadge}>
                <LinearGradient
                  colors={theme.gradients.party}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nowPlayingGradient}
                >
                  <Ionicons name="radio" size={14} color={theme.colors.white} />
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={styles.nowPlayingText}
                  >
                    NOW PLAYING
                  </AppText>
                </LinearGradient>
              </View>
            )}

            {/* Album Art with Waveform Overlay */}
            <View style={styles.albumArtContainer}>
              <LinearGradient
                colors={theme.gradients.sunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.albumArt}
              >
                <Ionicons
                  name="disc"
                  size={64}
                  color={theme.colors.white}
                  style={isPlaying ? styles.spinningIcon : undefined}
                />
              </LinearGradient>

              {/* Animated Waveform with Neon Glow */}
              <Animated.View
                entering={FadeIn.delay(400).duration(800)}
                style={styles.waveformContainer}
              >
                {waveAnims.map((anim, index) => {
                  const waveStyle = useAnimatedStyle(() => ({
                    transform: [{ scaleY: anim.value }],
                  }));

                  return (
                    <Animated.View
                      key={index}
                      style={[styles.waveBar, waveStyle]}
                    />
                  );
                })}
              </Animated.View>
            </View>

            {/* Track Info */}
            <View style={styles.trackInfo}>
              <AppText variant="h3" weight="bold" center>
                {isPlaying ? "Summer Vibes Mix" : "Ready to Play"}
              </AppText>
              <AppText
                variant="body"
                color={theme.colors.text.secondary}
                center
              >
                {isPlaying
                  ? "Various Artists • 2024"
                  : "Select a track to begin"}
              </AppText>
            </View>

            {/* Seek Slider with Progress */}
            <View style={styles.progressContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={progress}
                onValueChange={setProgress}
                minimumTrackTintColor={theme.colors.neon.pink}
                maximumTrackTintColor={theme.colors.glass.light}
                thumbTintColor={theme.colors.neon.pink}
              />
              <View style={styles.progressTime}>
                <AppText variant="caption">
                  {Math.floor((progress * 242) / 60)}:
                  {String(Math.floor((progress * 242) % 60)).padStart(2, "0")}
                </AppText>
                <AppText variant="caption">4:02</AppText>
              </View>
            </View>

            {/* Player Controls */}
            <View style={styles.controls}>
              <IconButton
                icon={
                  <Ionicons
                    name="play-skip-back"
                    size={28}
                    color={theme.colors.white}
                  />
                }
                variant="ghost"
                size="lg"
                onPress={() => console.log("Previous")}
              />

              <IconButton
                icon={
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={36}
                    color={theme.colors.white}
                  />
                }
                variant="gradient"
                gradient="primary"
                size="lg"
                onPress={() => setIsPlaying(!isPlaying)}
              />

              <IconButton
                icon={
                  <Ionicons
                    name="play-skip-forward"
                    size={28}
                    color={theme.colors.white}
                  />
                }
                variant="ghost"
                size="lg"
                onPress={() => console.log("Next")}
              />
            </View>

            {/* Volume Slider */}
            <View style={styles.volumeContainer}>
              <Ionicons
                name="volume-low"
                size={20}
                color={theme.colors.text.secondary}
              />
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor={theme.colors.neon.purple}
                maximumTrackTintColor={theme.colors.glass.light}
                thumbTintColor={theme.colors.neon.purple}
              />
              <Ionicons
                name="volume-high"
                size={20}
                color={theme.colors.text.secondary}
              />
              <AppText variant="caption" style={styles.volumeText}>
                {Math.round(volume * 100)}%
              </AppText>
            </View>
          </AnimatedGlassCard>

          {/* Actions */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(600).springify()}
            style={styles.actions}
          >
            <GradientButton
              title={`View Devices (${connectedDevices})`}
              gradient="electric"
              size="md"
              fullWidth
              icon={<Ionicons name="phone-portrait" size={20} color="white" />}
              onPress={handleDeviceList}
            />

            {isHost && (
              <GradientButton
                title="Session Settings"
                gradient="accent"
                size="md"
                fullWidth
                icon={<Ionicons name="settings" size={20} color="white" />}
                onPress={() => console.log("Settings")}
              />
            )}

            <GradientButton
              title="Leave Session"
              gradient="sunset"
              size="md"
              fullWidth
              icon={<Ionicons name="exit" size={20} color="white" />}
              onPress={handleLeaveSession}
            />
          </Animated.View>

          {/* Connected Users - Device Grid */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600).springify()}
            style={styles.usersSection}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name="grid"
                  size={20}
                  color={theme.colors.neon.cyan}
                />
                <AppText variant="h4" weight="bold">
                  Device Grid
                </AppText>
              </View>
              <View style={styles.deviceCountBadge}>
                <AppText variant="caption" weight="bold">
                  {connectedDevices} / 8
                </AppText>
              </View>
            </View>

            <View style={styles.deviceGrid}>
              {members.map((member) => (
                <GlassCard
                  key={member.id}
                  intensity="medium"
                  style={styles.deviceCard}
                >
                  <LinearGradient
                    colors={
                      member.role === "host"
                        ? [...theme.gradients.party, "transparent"]
                        : [...theme.gradients.sunset, "transparent"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.deviceGradient}
                  />
                  <View style={styles.deviceContent}>
                    <View
                      style={[
                        styles.deviceAvatar,
                        {
                          backgroundColor:
                            member.role === "host"
                              ? theme.colors.neon.pink
                              : theme.colors.neon.cyan,
                        },
                      ]}
                    >
                      <AppText variant="body" weight="bold">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AppText>
                    </View>
                    <AppText variant="body" weight="semibold" numberOfLines={1}>
                      {member.name} {member.role === "host" && "👑"}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {member.role === "host" ? "Host" : "Client"}
                    </AppText>
                    <View style={styles.deviceStatus}>
                      <View
                        style={[
                          styles.statusDot,
                          member.connectionStatus === "connected"
                            ? styles.statusOnline
                            : { backgroundColor: theme.colors.neon.orange },
                        ]}
                      />
                      <AppText variant="caption" style={styles.statusText}>
                        {member.connectionStatus
                          ? member.connectionStatus.charAt(0).toUpperCase() +
                            member.connectionStatus.slice(1)
                          : "Unknown"}
                      </AppText>
                    </View>
                  </View>
                </GlassCard>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 8 - members.length) }).map(
                (_, index) => (
                  <GlassCard
                    key={`empty-${index}`}
                    intensity="light"
                    style={styles.deviceCard}
                  >
                    <View style={styles.deviceContent}>
                      <View style={styles.emptySlot}>
                        <Ionicons
                          name="add-circle-outline"
                          size={32}
                          color={theme.colors.text.tertiary}
                        />
                      </View>
                      <AppText
                        variant="caption"
                        color={theme.colors.text.tertiary}
                        center
                      >
                        {isHost ? "Scanning..." : "Waiting..."}
                      </AppText>
                    </View>
                  </GlassCard>
                ),
              )}
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
  colorEffect: {
    position: "absolute",
    width: "100%",
    height: "50%",
    zIndex: 0,
  },
  colorEffectTop: {
    top: 0,
  },
  colorEffectBottom: {
    bottom: 0,
  },
  colorGradient: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing["2xl"],
    zIndex: 1,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  sessionCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.glass.medium,
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.glass.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.neon.yellow,
  },
  infoCard: {
    marginBottom: theme.spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.glass.light,
  },
  syncHealthBar: {
    gap: theme.spacing.sm,
  },
  syncHealthTrack: {
    height: 6,
    backgroundColor: theme.colors.glass.light,
    borderRadius: 3,
    overflow: "hidden",
  },
  syncHealthFill: {
    height: "100%",
  },
  playerCard: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
    overflow: "hidden",
  },
  nowPlayingBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
    zIndex: 10,
  },
  nowPlayingGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  nowPlayingText: {
    color: theme.colors.white,
    fontSize: 11,
  },
  albumArtContainer: {
    position: "relative",
    alignItems: "center",
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.xl,
  },
  spinningIcon: {
    // Add rotation animation in useEffect if needed
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 60,
    marginTop: theme.spacing.md,
  },
  waveBar: {
    width: 4,
    height: 60,
    backgroundColor: theme.colors.neon.cyan,
    borderRadius: 2,
  },
  trackInfo: {
    gap: theme.spacing.xs,
    width: "100%",
  },
  progressContainer: {
    width: "100%",
    gap: theme.spacing.sm,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  progressTime: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xl,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    width: "100%",
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  volumeText: {
    minWidth: 40,
    textAlign: "right",
  },
  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  usersSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  deviceCountBadge: {
    backgroundColor: theme.colors.glass.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  deviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  deviceCard: {
    width: "47%",
    overflow: "hidden",
  },
  deviceGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  deviceContent: {
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  deviceAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  deviceStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: theme.colors.neon.green,
  },
  statusText: {
    fontSize: 11,
  },
  emptySlot: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.glass.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
});
