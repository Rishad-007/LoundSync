import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../src/components";
import { theme } from "../src/theme";

export default function PlayerRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    sessionName: string;
    isHost: string;
  }>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [connectedDevices] = useState(3);
  const [volume, setVolume] = useState(0.75);
  const [progress, setProgress] = useState(0.35);
  const [syncHealth, setSyncHealth] = useState(92); // 92% sync health

  // Waveform animations
  const waveAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.3)),
  ).current;

  // Party color pulse animation
  const colorPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Waveform animation
    if (isPlaying) {
      const animations = waveAnims.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 0.7 + 0.3,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: Math.random() * 0.4 + 0.2,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ]),
        ),
      );
      Animated.stagger(50, animations).start();
    } else {
      waveAnims.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }

    // Color pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(colorPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [isPlaying]);

  const colorPulseOpacity = colorPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const isHost = params.isHost === "true";

  const handleLeaveSession = () => {
    router.push("/home");
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
        {/* Party Color Effects */}
        <Animated.View
          style={[
            styles.colorEffect,
            styles.colorEffectTop,
            { opacity: colorPulseOpacity },
          ]}
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
            { opacity: colorPulseOpacity },
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
          <View style={styles.header}>
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
              {params.sessionName}
            </AppText>
            <AppText variant="body" color={theme.colors.text.secondary} center>
              Session: {params.sessionId}
            </AppText>
          </View>

          {/* Session Info with Sync Health */}
          <GlassCard intensity="medium" style={styles.infoCard}>
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
                <AppText variant="h4">12ms</AppText>
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
          </GlassCard>

          {/* Player Section */}
          <GlassCard intensity="heavy" style={styles.playerCard}>
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

              {/* Animated Waveform */}
              <View style={styles.waveformContainer}>
                {waveAnims.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveBar,
                      {
                        transform: [
                          {
                            scaleY: anim,
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
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
          </GlassCard>

          {/* Actions */}
          <View style={styles.actions}>
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
          </View>

          {/* Connected Users - Device Grid */}
          <View style={styles.usersSection}>
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
              <GlassCard intensity="medium" style={styles.deviceCard}>
                <LinearGradient
                  colors={[...theme.gradients.party, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.deviceGradient}
                />
                <View style={styles.deviceContent}>
                  <View
                    style={[
                      styles.deviceAvatar,
                      { backgroundColor: theme.colors.neon.pink },
                    ]}
                  >
                    <AppText variant="body" weight="bold">
                      YO
                    </AppText>
                  </View>
                  <AppText variant="body" weight="semibold" numberOfLines={1}>
                    You {isHost && "👑"}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    iPhone 15 Pro
                  </AppText>
                  <View style={styles.deviceStatus}>
                    <View style={[styles.statusDot, styles.statusOnline]} />
                    <AppText variant="caption" style={styles.statusText}>
                      Online
                    </AppText>
                  </View>
                </View>
              </GlassCard>

              <GlassCard intensity="medium" style={styles.deviceCard}>
                <LinearGradient
                  colors={[...theme.gradients.sunset, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.deviceGradient}
                />
                <View style={styles.deviceContent}>
                  <View
                    style={[
                      styles.deviceAvatar,
                      { backgroundColor: theme.colors.neon.cyan },
                    ]}
                  >
                    <AppText variant="body" weight="bold">
                      JD
                    </AppText>
                  </View>
                  <AppText variant="body" weight="semibold" numberOfLines={1}>
                    John Doe
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    Galaxy S23
                  </AppText>
                  <View style={styles.deviceStatus}>
                    <View style={[styles.statusDot, styles.statusOnline]} />
                    <AppText variant="caption" style={styles.statusText}>
                      Online
                    </AppText>
                  </View>
                </View>
              </GlassCard>

              <GlassCard intensity="medium" style={styles.deviceCard}>
                <LinearGradient
                  colors={[...theme.gradients.lime, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.deviceGradient}
                />
                <View style={styles.deviceContent}>
                  <View
                    style={[
                      styles.deviceAvatar,
                      { backgroundColor: theme.colors.neon.purple },
                    ]}
                  >
                    <AppText variant="body" weight="bold">
                      AS
                    </AppText>
                  </View>
                  <AppText variant="body" weight="semibold" numberOfLines={1}>
                    Alex Smith
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    iPad Pro
                  </AppText>
                  <View style={styles.deviceStatus}>
                    <View style={[styles.statusDot, styles.statusOnline]} />
                    <AppText variant="caption" style={styles.statusText}>
                      Online
                    </AppText>
                  </View>
                </View>
              </GlassCard>

              {/* Empty slots */}
              {Array.from({ length: 5 }).map((_, index) => (
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
                      Empty Slot
                    </AppText>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>
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
