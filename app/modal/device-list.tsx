import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../../src/components";
import {
  useIsHost,
  useLocalDevice,
  useMembers,
  useSessionActions,
} from "../../src/state";
import { theme } from "../../src/theme";

export default function DeviceListModal() {
  const router = useRouter();
  const members = useMembers(); // Real members from Zustand
  const isHost = useIsHost(); // Real host check
  const sessionActions = useSessionActions();
  const localDevice = useLocalDevice();

  // Volume state (local only for now)
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});

  // Slide-in animation for cards
  // Note: Using dynamic refs for list animation is tricky with changing lists
  // Simplified for now to just animate in once
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleVolumeChange = (deviceId: string, newVolume: number) => {
    setVolumes((prev) => ({ ...prev, [deviceId]: newVolume }));
  };

  const handleKickDevice = (deviceId: string, deviceName: string) => {
    // In a real app, you'd send a "kick" message via websocket
    // For now, we'll just remove them locally
    console.log("Kick device:", deviceId, deviceName);
  };

  const getLatencyColor = (latency: number) => {
    if (latency === 0) return theme.colors.text.tertiary;
    if (latency < 15) return theme.colors.neon.green;
    if (latency < 30) return theme.colors.neon.yellow;
    return theme.colors.neon.orange;
  };

  const getLatencyLabel = (latency: number) => {
    if (latency === 0) return "N/A";
    if (latency < 15) return "Excellent";
    if (latency < 30) return "Good";
    return "Poor";
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "phone":
        return "phone-portrait";
      case "tablet":
        return "tablet-portrait";
      case "laptop":
        return "laptop";
      default:
        return "hardware-chip";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return theme.colors.neon.green;
      case "pending":
        return theme.colors.neon.yellow;
      case "disconnected":
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={styles.blur}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <AppText variant="h3" weight="bold">
                  Connected Devices
                </AppText>
                <IconButton
                  icon={
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.white}
                    />
                  }
                  variant="ghost"
                  size="md"
                  onPress={() => router.back()}
                />
              </View>
              <AppText variant="body" color={theme.colors.text.secondary}>
                Manage devices in this session
              </AppText>
            </View>

            {/* Devices List */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.devicesList}>
                {members.map((member, index) => {
                  const isLocal = member.id === localDevice?.id;
                  const latency = member.latency || 0;
                  const volume = volumes[member.id] || 0.8; // Default volume

                  return (
                    <Animated.View
                      key={member.id}
                      style={{ opacity: fadeAnim }}
                    >
                      <GlassCard intensity="heavy" style={styles.deviceCard}>
                        {/* Device Header Row */}
                        <View style={styles.deviceRow}>
                          <View style={styles.deviceIconContainer}>
                            <Ionicons
                              name={
                                member.role === "host"
                                  ? "hardware-chip"
                                  : "phone-portrait"
                              }
                              size={32}
                              color={theme.colors.neon.cyan}
                            />
                          </View>

                          <View style={styles.deviceInfo}>
                            <View style={styles.deviceNameRow}>
                              <AppText variant="body" weight="bold">
                                {member.name} {isLocal && "(You)"}
                              </AppText>
                              {member.role === "host" && (
                                <View style={styles.hostBadge}>
                                  <Ionicons
                                    name="star"
                                    size={14}
                                    color={theme.colors.neon.yellow}
                                  />
                                  <AppText
                                    variant="caption"
                                    weight="bold"
                                    style={styles.hostText}
                                  >
                                    HOST
                                  </AppText>
                                </View>
                              )}
                            </View>
                            <AppText
                              variant="caption"
                              color={theme.colors.text.secondary}
                            >
                              {member.address || "Unknown Device"}
                            </AppText>

                            {/* Latency Badge */}
                            {member.connectionStatus === "connected" && (
                              <View style={styles.latencyBadge}>
                                <Ionicons
                                  name="speedometer"
                                  size={12}
                                  color={getLatencyColor(latency)}
                                />
                                <AppText
                                  variant="caption"
                                  style={[
                                    styles.latencyText,
                                    { color: getLatencyColor(latency) },
                                  ]}
                                >
                                  {latency}ms • {getLatencyLabel(latency)}
                                </AppText>
                              </View>
                            )}

                            {(member.connectionStatus === "reconnecting" ||
                              member.connectionStatus === "disconnected") && (
                              <View style={styles.pendingBadge}>
                                <View style={styles.pendingDot} />
                                <AppText
                                  variant="caption"
                                  color={theme.colors.neon.yellow}
                                >
                                  {member.connectionStatus === "reconnecting"
                                    ? "Reconnecting..."
                                    : "Disconnected"}
                                </AppText>
                              </View>
                            )}
                          </View>

                          {/* Kick Button (Host Only, can't kick self) */}
                          {isHost && !isLocal && (
                            <IconButton
                              icon={
                                <Ionicons
                                  name="close-circle"
                                  size={20}
                                  color={theme.colors.error}
                                />
                              }
                              variant="ghost"
                              size="sm"
                              onPress={() =>
                                handleKickDevice(member.id, member.name)
                              }
                            />
                          )}
                        </View>

                        {/* Volume Control per Device */}
                        {member.connectionStatus === "connected" && (
                          <View style={styles.volumeSection}>
                            <View style={styles.volumeHeader}>
                              <Ionicons
                                name="volume-medium"
                                size={16}
                                color={theme.colors.neon.purple}
                              />
                              <AppText variant="caption" weight="semibold">
                                Device Volume
                              </AppText>
                            </View>
                            <View style={styles.volumeControl}>
                              <Ionicons
                                name="volume-low"
                                size={16}
                                color={theme.colors.text.tertiary}
                              />
                              <Slider
                                style={styles.volumeSlider}
                                minimumValue={0}
                                maximumValue={1}
                                value={volume}
                                onValueChange={(value) =>
                                  handleVolumeChange(member.id, value)
                                }
                                minimumTrackTintColor={theme.colors.neon.purple}
                                maximumTrackTintColor={theme.colors.glass.light}
                                thumbTintColor={theme.colors.neon.purple}
                                disabled={!isHost}
                              />
                              <Ionicons
                                name="volume-high"
                                size={16}
                                color={theme.colors.text.tertiary}
                              />
                              <AppText
                                variant="caption"
                                style={styles.volumeValue}
                              >
                                {Math.round(volume * 100)}%
                              </AppText>
                            </View>
                          </View>
                        )}
                      </GlassCard>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Stats Section */}
              <View style={styles.statsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons
                    name="stats-chart"
                    size={20}
                    color={theme.colors.neon.cyan}
                  />
                  <AppText variant="h4" weight="bold">
                    Session Stats
                  </AppText>
                </View>

                <GlassCard intensity="medium">
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.colors.neon.green}
                      />
                      <AppText variant="h3" weight="bold">
                        {
                          members.filter(
                            (m) => m.connectionStatus === "connected",
                          ).length
                        }
                      </AppText>
                      <AppText variant="caption">Active</AppText>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                      <Ionicons
                        name="time"
                        size={24}
                        color={theme.colors.neon.yellow}
                      />
                      <AppText variant="h3" weight="bold">
                        {
                          members.filter(
                            (m) => m.connectionStatus === "reconnecting",
                          ).length
                        }
                      </AppText>
                      <AppText variant="caption">Pending</AppText>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                      <Ionicons
                        name="flash"
                        size={24}
                        color={theme.colors.neon.cyan}
                      />
                      <AppText variant="h3" weight="bold">
                        {Math.round(
                          members
                            .filter((m) => m.connectionStatus === "connected")
                            .reduce((sum, m) => sum + (m.latency || 0), 0) /
                            members.filter(
                              (m) => m.connectionStatus === "connected",
                            ).length || 1,
                        )}
                        ms
                      </AppText>
                      <AppText variant="caption">Avg Latency</AppText>
                    </View>
                  </View>
                </GlassCard>
              </View>

              {/* Info Card */}
              <GlassCard intensity="light" style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="information-circle"
                    size={24}
                    color={theme.colors.neon.purple}
                  />
                  <View style={styles.infoText}>
                    <AppText variant="body" weight="semibold">
                      Device Sync
                    </AppText>
                    <AppText variant="caption">
                      All devices are automatically synchronized for seamless
                      playback
                    </AppText>
                  </View>
                </View>
              </GlassCard>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <GradientButton
                title="Refresh Devices"
                gradient="electric"
                size="md"
                fullWidth
                icon={<Ionicons name="refresh" size={20} color="white" />}
                onPress={() => console.log("Refresh")}
              />
            </View>
          </View>
        </BlurView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  blur: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  devicesList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  deviceCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  deviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.glass.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  deviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.neon.yellow + "20",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.neon.yellow,
  },
  hostText: {
    color: theme.colors.neon.yellow,
    fontSize: 10,
  },
  latencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.glass.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.neon.yellow,
  },
  volumeSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.light,
    gap: theme.spacing.sm,
  },
  volumeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  volumeControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
  volumeValue: {
    minWidth: 36,
    textAlign: "right",
    fontWeight: "600",
  },
  statsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.md,
  },
  statItem: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.glass.light,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
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
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.light,
  },
});
