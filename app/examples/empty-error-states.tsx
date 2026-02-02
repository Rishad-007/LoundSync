/**
 * Example: Empty & Error States Usage
 *
 * Demonstrates all empty and error state variations for LOUDSYNC
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  AppText,
  EmptyState,
  ErrorState,
  GradientButton,
  IconButton,
} from "../../src/components";
import { theme } from "../../src/theme";

export default function EmptyErrorStatesExample() {
  const router = useRouter();
  const [selectedState, setSelectedState] = useState<string>("no-devices");

  const renderState = () => {
    switch (selectedState) {
      case "no-devices":
        return (
          <EmptyState
            icon="phone-portrait-outline"
            title="No Devices Connected"
            description="Invite friends to join your session! Share the session code to start the party together."
            actionLabel="Share Session Code"
            onAction={() => console.log("Share")}
            gradient="electric"
          />
        );

      case "no-song":
        return (
          <EmptyState
            icon="musical-notes-outline"
            title="No Song Selected"
            description="Choose a track to get the party started. Upload an MP3 or paste a song URL to begin."
            actionLabel="Add Music"
            onAction={() => console.log("Add music")}
            gradient="party"
          />
        );

      case "no-sessions":
        return (
          <EmptyState
            icon="radio-outline"
            title="No Sessions Found"
            description="No nearby sessions detected. Make sure you're on the same network or create your own session."
            actionLabel="Create Session"
            onAction={() => router.push("/create-session")}
            gradient="secondary"
          />
        );

      case "no-recent":
        return (
          <EmptyState
            icon="time-outline"
            title="No Recent Sessions"
            description="Your recently joined sessions will appear here. Join or create a session to get started!"
            gradient="lime"
          />
        );

      case "network-error":
        return (
          <ErrorState
            type="network"
            onRetry={() => console.log("Retry connection")}
            onDismiss={() => console.log("Go back")}
          />
        );

      case "sync-error":
        return (
          <ErrorState type="sync" onRetry={() => console.log("Retry sync")} />
        );

      case "generic-error":
        return (
          <ErrorState
            type="generic"
            onRetry={() => console.log("Retry")}
            dismissLabel="Contact Support"
            onDismiss={() => console.log("Support")}
          />
        );

      case "permission-error":
        return (
          <ErrorState
            type="permission"
            retryLabel="Open Settings"
            onRetry={() => console.log("Open settings")}
            onDismiss={() => router.back()}
          />
        );

      case "custom-empty":
        return (
          <EmptyState
            illustration={
              <View style={styles.customIllustration}>
                <Ionicons
                  name="planet"
                  size={80}
                  color={theme.colors.neon.cyan}
                />
                <Ionicons
                  name="star"
                  size={20}
                  color={theme.colors.neon.yellow}
                  style={styles.star1}
                />
                <Ionicons
                  name="star"
                  size={16}
                  color={theme.colors.neon.pink}
                  style={styles.star2}
                />
              </View>
            }
            title="Nothing Here Yet"
            description="This is a custom empty state with a unique illustration. Perfect for creative scenarios!"
            actionLabel="Explore"
            onAction={() => console.log("Explore")}
            gradient="sunset"
          />
        );

      case "custom-error":
        return (
          <ErrorState
            icon="flash-off-outline"
            title="Sync Failed"
            description="Devices are out of sync by more than 500ms. This might affect playback quality."
            retryLabel="Force Resync"
            onRetry={() => console.log("Force resync")}
            dismissLabel="Continue Anyway"
            onDismiss={() => console.log("Continue")}
          />
        );

      default:
        return null;
    }
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
        {/* Header */}
        <View style={styles.header}>
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
          />
          <AppText variant="h2" weight="bold">
            Empty & Error States
          </AppText>
          <AppText variant="body" color={theme.colors.text.secondary}>
            Preview all state variations
          </AppText>
        </View>

        {/* State Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selector}
          contentContainerStyle={styles.selectorContent}
        >
          {[
            { id: "no-devices", label: "No Devices" },
            { id: "no-song", label: "No Song" },
            { id: "no-sessions", label: "No Sessions" },
            { id: "no-recent", label: "No Recent" },
            { id: "network-error", label: "Network" },
            { id: "sync-error", label: "Sync Error" },
            { id: "generic-error", label: "Generic" },
            { id: "permission-error", label: "Permission" },
            { id: "custom-empty", label: "Custom Empty" },
            { id: "custom-error", label: "Custom Error" },
          ].map((state) => (
            <GradientButton
              key={state.id}
              title={state.label}
              gradient={selectedState === state.id ? "party" : "accent"}
              size="sm"
              onPress={() => setSelectedState(state.id)}
            />
          ))}
        </ScrollView>

        {/* Render Selected State */}
        <View style={styles.stateContainer}>{renderState()}</View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  selector: {
    maxHeight: 60,
  },
  selectorContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  stateContainer: {
    flex: 1,
  },
  customIllustration: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  star1: {
    position: "absolute",
    top: 10,
    right: 20,
  },
  star2: {
    position: "absolute",
    bottom: 20,
    left: 15,
  },
});
