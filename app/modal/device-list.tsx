import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../../src/components";
import { theme } from "../../src/theme";

export default function DeviceListModal() {
  const router = useRouter();
  const [devices] = useState([
    {
      id: "1",
      name: "iPhone 15 Pro",
      type: "phone",
      status: "connected",
      latency: 8,
    },
    {
      id: "2",
      name: "Samsung Galaxy S23",
      type: "phone",
      status: "connected",
      latency: 12,
    },
    {
      id: "3",
      name: "iPad Pro",
      type: "tablet",
      status: "connected",
      latency: 10,
    },
    {
      id: "4",
      name: "MacBook Pro",
      type: "laptop",
      status: "pending",
      latency: 0,
    },
  ]);

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
                {devices.map((device) => (
                  <GlassCard
                    key={device.id}
                    intensity="heavy"
                    style={styles.deviceCard}
                  >
                    <View style={styles.deviceRow}>
                      <View style={styles.deviceIconContainer}>
                        <Ionicons
                          name={getDeviceIcon(device.type) as any}
                          size={32}
                          color={theme.colors.neon.cyan}
                        />
                      </View>

                      <View style={styles.deviceInfo}>
                        <AppText variant="body" weight="semibold">
                          {device.name}
                        </AppText>
                        <View style={styles.deviceMeta}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: getStatusColor(device.status),
                              },
                            ]}
                          />
                          <AppText variant="caption">
                            {device.status === "connected"
                              ? `${device.latency}ms latency`
                              : "Connecting..."}
                          </AppText>
                        </View>
                      </View>

                      {device.status === "connected" && (
                        <IconButton
                          icon={
                            <Ionicons
                              name="ellipsis-horizontal"
                              size={20}
                              color={theme.colors.white}
                            />
                          }
                          variant="ghost"
                          size="sm"
                          onPress={() =>
                            console.log("Device options", device.id)
                          }
                        />
                      )}
                    </View>
                  </GlassCard>
                ))}
              </View>

              {/* Stats Section */}
              <View style={styles.statsSection}>
                <AppText variant="h4" style={styles.sectionTitle}>
                  Session Stats
                </AppText>

                <GlassCard intensity="medium">
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.colors.neon.green}
                      />
                      <AppText variant="h3" weight="bold">
                        3
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
                        1
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
                        10ms
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
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
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
  deviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
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
