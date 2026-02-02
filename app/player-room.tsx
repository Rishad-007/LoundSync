import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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

          {/* Session Info */}
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
                  name="volume-high"
                  size={24}
                  color={theme.colors.neon.purple}
                />
                <AppText variant="h4">85%</AppText>
                <AppText variant="caption">Sync</AppText>
              </View>
            </View>
          </GlassCard>

          {/* Player Section */}
          <GlassCard intensity="heavy" style={styles.playerCard}>
            {/* Album Art Placeholder */}
            <LinearGradient
              colors={theme.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.albumArt}
            >
              <Ionicons
                name="musical-notes"
                size={64}
                color={theme.colors.white}
              />
            </LinearGradient>

            {/* Track Info */}
            <View style={styles.trackInfo}>
              <AppText variant="h3" weight="bold" center>
                {isPlaying ? "Now Playing" : "Ready to Play"}
              </AppText>
              <AppText
                variant="body"
                color={theme.colors.text.secondary}
                center
              >
                {isPlaying ? "Summer Vibes Mix" : "Select a track to begin"}
              </AppText>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: "35%" }]}
                />
              </View>
              <View style={styles.progressTime}>
                <AppText variant="caption">1:24</AppText>
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

          {/* Connected Users */}
          <View style={styles.usersSection}>
            <AppText variant="h4" style={styles.sectionTitle}>
              Connected Users
            </AppText>

            <GlassCard intensity="medium" style={styles.userCard}>
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.userAvatar,
                    { backgroundColor: theme.colors.neon.pink },
                  ]}
                >
                  <AppText variant="body" weight="bold">
                    YO
                  </AppText>
                </View>
                <View style={styles.userInfo}>
                  <AppText variant="body" weight="semibold">
                    You {isHost && "(Host)"}
                  </AppText>
                  <AppText variant="caption">iPhone 15 Pro</AppText>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.neon.green}
                />
              </View>
            </GlassCard>

            <GlassCard intensity="medium" style={styles.userCard}>
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.userAvatar,
                    { backgroundColor: theme.colors.neon.cyan },
                  ]}
                >
                  <AppText variant="body" weight="bold">
                    JD
                  </AppText>
                </View>
                <View style={styles.userInfo}>
                  <AppText variant="body" weight="semibold">
                    John Doe
                  </AppText>
                  <AppText variant="caption">Samsung Galaxy S23</AppText>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.neon.green}
                />
              </View>
            </GlassCard>

            <GlassCard intensity="medium" style={styles.userCard}>
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.userAvatar,
                    { backgroundColor: theme.colors.neon.purple },
                  ]}
                >
                  <AppText variant="body" weight="bold">
                    AS
                  </AppText>
                </View>
                <View style={styles.userInfo}>
                  <AppText variant="body" weight="semibold">
                    Alex Smith
                  </AppText>
                  <AppText variant="caption">iPad Pro</AppText>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.neon.green}
                />
              </View>
            </GlassCard>
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing["2xl"],
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
  },
  infoItem: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.glass.light,
  },
  playerCard: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.xl,
  },
  trackInfo: {
    gap: theme.spacing.xs,
    width: "100%",
  },
  progressContainer: {
    width: "100%",
    gap: theme.spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.glass.light,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
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
  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  usersSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  userCard: {
    marginBottom: theme.spacing.sm,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
});
