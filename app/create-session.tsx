import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../src/components";
import { theme } from "../src/theme";

export default function CreateSessionScreen() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState("");
  const [hostName, setHostName] = useState("");
  const [maxDevices, setMaxDevices] = useState("8");
  const [songUrl, setSongUrl] = useState("");
  const [uploadedSong, setUploadedSong] = useState<{
    name: string;
    duration: string;
  } | null>(null);

  const handleUploadMP3 = () => {
    // Mock file upload
    setUploadedSong({
      name: "Summer Vibes Mix.mp3",
      duration: "3:45",
    });
  };

  const handleCreateSession = () => {
    // Generate a mock session ID
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();

    router.push({
      pathname: "/player-room",
      params: {
        sessionId,
        sessionName: sessionName || "My Party",
        isHost: "true",
      },
    });
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
                style={styles.backButton}
              />
              <AppText variant="h2" weight="bold">
                Create Session
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary}>
                Set up your party room
              </AppText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <GlassCard intensity="medium">
                <View style={styles.inputGroup}>
                  <AppText
                    variant="body"
                    weight="semibold"
                    style={styles.label}
                  >
                    Session Name
                  </AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="My Awesome Party"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={sessionName}
                    onChangeText={setSessionName}
                  />
                </View>
              </GlassCard>

              <GlassCard intensity="medium">
                <View style={styles.inputGroup}>
                  <AppText
                    variant="body"
                    weight="semibold"
                    style={styles.label}
                  >
                    Max Devices
                  </AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="8"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={maxDevices}
                    onChangeText={setMaxDevices}
                    keyboardType="number-pad"
                  />
                </View>
              </GlassCard>
            </View>

            {/* Session Info */}
            <GlassCard intensity="light" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={theme.colors.neon.cyan}
                />
                <View style={styles.infoText}>
                  <AppText variant="body" weight="semibold">
                    Session Code
                  </AppText>
                  <AppText variant="caption">
                    A unique code will be generated to share with friends
                  </AppText>
                </View>
              </View>
            </GlassCard>

            {/* Settings Preview */}
            <View style={styles.settingsPreview}>
              <AppText variant="h4" style={styles.sectionTitle}>
                Quick Settings
              </AppText>

              <GlassCard intensity="medium" style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={24}
                    color={theme.colors.neon.green}
                  />
                  <AppText variant="body">Host Controls Enabled</AppText>
                </View>
              </GlassCard>

              <GlassCard intensity="medium" style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <Ionicons
                    name="wifi"
                    size={24}
                    color={theme.colors.neon.blue}
                  />
                  <AppText variant="body">Low Latency Mode</AppText>
                </View>
              </GlassCard>
            </View>

            {/* Create Button */}
            <View style={styles.actions}>
              <GradientButton
                title="Create Session"
                gradient="party"
                size="lg"
                fullWidth
                icon={<Ionicons name="rocket" size={24} color="white" />}
                onPress={handleCreateSession}
              />
            </View>
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
    marginBottom: theme.spacing["2xl"],
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing.md,
  },
  form: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    borderWidth: 1,
    borderColor: theme.colors.glass.light,
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
  settingsPreview: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  settingCard: {
    marginBottom: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  actions: {
    marginBottom: theme.spacing.xl,
  },
});
