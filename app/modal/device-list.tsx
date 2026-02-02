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
import { theme } from "../../src/theme";

export default function DeviceListModal() {
  const router = useRouter();
  const [isHost] = useState(true); // Mock host status
  const [devices, setDevices] = useState([
    {
      id: "1",
      name: "You",
      userName: "Alex",
      deviceName: "iPhone 15 Pro",
      type: "phone",
      status: "connected",
      latency: 8,
      volume: 0.85,
      isHost: true,
    },
    {
      id: "2",
      name: "John Doe",
      userName: "John",
      deviceName: "Samsung Galaxy S23",
      type: "phone",
      status: "connected",
      latency: 12,
      volume: 0.75,
      isHost: false,
    },
    {
      id: "3",
      name: "Alex Smith",
      userName: "Alex S",
      deviceName: "iPad Pro",
      type: "tablet",
      status: "connected",
      latency: 10,
      volume: 0.9,
      isHost: false,
    },
    {
      id: "4",
      name: "Sarah Johnson",
      userName: "Sarah",
      deviceName: "MacBook Pro",
      type: "laptop",
      status: "pending",
      latency: 0,
      volume: 0.0,
      isHost: false,
    },
  ]);

  // Slide-in animation for cards
  const slideAnims = useRef(devices.map(() => new Animated.Value(50))).current;
  const fadeAnims = useRef(devices.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = devices.map((_, index) =>
      Animated.parallel([
        Animated.timing(slideAnims[index], {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(50, animations).start();
  }, []);

  const handleVolumeChange = (deviceId: string, newVolume: number) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.id === deviceId ? { ...device, volume: newVolume } : device,
      ),
    );
  };

  const handleKickDevice = (deviceId: string, deviceName: string) => {
    // Animate out before removing
    const index = devices.findIndex((d) => d.id === deviceId);
    Animated.parallel([
      Animated.timing(slideAnims[index], {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnims[index], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDevices((prevDevices) => prevDevices.filter((d) => d.id !== deviceId));
    });
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
                {devices.map((device, index) => (
                  <Animated.View
                    key={device.id}
                    style={{
                      transform: [{ translateY: slideAnims[index] }],
                      opacity: fadeAnims[index],
                    }}
                  >
                    <GlassCard intensity="heavy" style={styles.deviceCard}>
                      {/* Device Header Row */}
                      <View style={styles.deviceRow}>
                        <View style={styles.deviceIconContainer}>
                          <Ionicons
                            name={getDeviceIcon(device.type) as any}
                            size={32}
                            color={theme.colors.neon.cyan}
                          />
                        </View>

                        <View style={styles.deviceInfo}>
                          <View style={styles.deviceNameRow}>
                            <AppText variant="body" weight="bold">
                              {device.name}
                            </AppText>
                            {device.isHost && (
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
                            {device.deviceName}
                          </AppText>

                          {/* Latency Badge */}
                          {device.status === "connected" && (
                            <View style={styles.latencyBadge}>
                              <Ionicons
                                name="speedometer"
                                size={12}
                                color={getLatencyColor(device.latency)}
                              />
                              <AppText
                                variant="caption"
                                style={[
                                  styles.latencyText,
                                  { color: getLatencyColor(device.latency) },
                                ]}
                              >
                                {device.latency}ms •{" "}
                                {getLatencyLabel(device.latency)}
                              </AppText>
                            </View>
                          )}

                          {device.status === "pending" && (
                            <View style={styles.pendingBadge}>
                              <View style={styles.pendingDot} />
                              <AppText
                                variant="caption"
                                color={theme.colors.neon.yellow}
                              >
                                Connecting...
                              </AppText>
                            </View>
                          )}
                        </View>

                        {/* Kick Button (Host Only) */}
                        {isHost &&
                          !device.isHost &&
                          device.status === "connected" && (
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
                                handleKickDevice(device.id, device.name)
                              }
                            />
                          )}
                      </View>

                      {/* Volume Control per Device */}
                      {device.status === "connected" && (
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
                              value={device.volume}
                              onValueChange={(value) =>
                                handleVolumeChange(device.id, value)
                              }
                              minimumTrackTintColor={theme.colors.neon.purple}
                              maximumTrackTintColor={theme.colors.glass.light}
                              thumbTintColor={theme.colors.neon.purple}
                              disabled={!isHost && !device.isHost}
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
                              {Math.round(device.volume * 100)}%
                            </AppText>
                          </View>
                        </View>
                      )}
                    </GlassCard>
                  </Animated.View>
                ))}
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
                        {devices.filter((d) => d.status === "connected").length}
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
                        {devices.filter((d) => d.status === "pending").length}
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
                          devices
                            .filter((d) => d.status === "connected")
                            .reduce((sum, d) => sum + d.latency, 0) /
                            devices.filter((d) => d.status === "connected")
                              .length,
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
