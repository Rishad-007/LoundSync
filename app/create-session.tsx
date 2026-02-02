import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  ZoomIn,
} from "react-native-reanimated";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../src/components";
import {
  useSessionActions,
  useSessionError,
  useSessionStatus,
} from "../src/state";
import { theme } from "../src/theme";

const AnimatedGlassCard = Animated.createAnimatedComponent(GlassCard);

export default function CreateSessionScreen() {
  const router = useRouter();

  // Zustand state
  const { createSession, startHosting } = useSessionActions();
  const sessionStatus = useSessionStatus();
  const sessionError = useSessionError();

  // Local state
  const [sessionName, setSessionName] = useState("");
  const [hostName, setHostName] = useState("");
  const [maxDevices, setMaxDevices] = useState("8");
  const [songUrl, setSongUrl] = useState("");
  const [uploadedSong, setUploadedSong] = useState<{
    name: string;
    duration: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleUploadMP3 = () => {
    // Mock file upload
    setUploadedSong({
      name: "Summer Vibes Mix.mp3",
      duration: "3:45",
    });
  };


  const handleCreateSession = async () => {
    try {
      setIsCreating(true);

      const finalSessionName = sessionName.trim() || "My Party";
      const finalMaxDevices = parseInt(maxDevices) || 8;

      console.log("[CreateSession] Creating session:", finalSessionName);

      // Step 1: Create session in Zustand store
      await createSession(finalSessionName);

      console.log("[CreateSession] ✅ Session created, starting host...");

      // Step 2: Start hosting (starts WebSocket server + broadcasts)
      await startHosting();

      console.log(
        "[CreateSession] ✅ Hosting started, navigating to player room",
      );

      // Step 3: Navigate to player room
      router.push("/player-room");
    } catch (error) {
      console.error("[CreateSession] Failed to create session:", error);
      setIsCreating(false);

      Alert.alert(
        "Failed to Create Session",
        error instanceof Error ? error.message : "Unknown error",
        [{ text: "OK" }],
      );
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
                Create Session
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary}>
                Set up your party room
              </AppText>
            </Animated.View>

            {/* Form */}
            <View style={styles.form}>
              {/* Session Details Card */}
              <AnimatedGlassCard
                entering={FadeInUp.delay(100).duration(600).springify()}
                layout={Layout.springify()}
                intensity="medium"
                pressable
                style={styles.sectionCard}
              >
                <LinearGradient
                  colors={[...theme.gradients.primary, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                />
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="people-circle"
                    size={24}
                    color={theme.colors.neon.pink}
                  />
                  <AppText variant="h4" weight="bold">
                    Session Details
                  </AppText>
                </View>

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

                <View style={styles.inputGroup}>
                  <AppText
                    variant="body"
                    weight="semibold"
                    style={styles.label}
                  >
                    Host Name
                  </AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={hostName}
                    onChangeText={setHostName}
                  />
                </View>

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
              </AnimatedGlassCard>

              {/* Music Source Card */}
              <AnimatedGlassCard
                entering={FadeInUp.delay(200).duration(600).springify()}
                layout={Layout.springify()}
                intensity="medium"
                pressable
                style={styles.sectionCard}
              >
                <LinearGradient
                  colors={[...theme.gradients.secondary, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                />
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="musical-notes"
                    size={24}
                    color={theme.colors.neon.cyan}
                  />
                  <AppText variant="h4" weight="bold">
                    Music Source
                  </AppText>
                </View>

                <View style={styles.musicOptions}>
                  <GradientButton
                    title="Upload MP3"
                    gradient="electric"
                    size="md"
                    fullWidth
                    icon={
                      <Ionicons name="cloud-upload" size={20} color="white" />
                    }
                    onPress={handleUploadMP3}
                  />

                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <AppText
                      variant="caption"
                      color={theme.colors.text.tertiary}
                    >
                      OR
                    </AppText>
                    <View style={styles.divider} />
                  </View>

                  <View style={styles.inputGroup}>
                    <AppText
                      variant="body"
                      weight="semibold"
                      style={styles.label}
                    >
                      Paste Song URL
                    </AppText>
                    <TextInput
                      style={styles.input}
                      placeholder="https://example.com/song.mp3"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={songUrl}
                      onChangeText={setSongUrl}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </AnimatedGlassCard>

              {/* Song Preview Card */}
              {uploadedSong && (
                <AnimatedGlassCard
                  entering={ZoomIn.duration(400).springify()}
                  layout={Layout.springify()}
                  intensity="heavy"
                  pressable
                  style={styles.songPreviewCard}
                >
                  <LinearGradient
                    colors={theme.gradients.sunset}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.songPreviewGradient}
                  >
                    <View style={styles.songPreview}>
                      <View style={styles.songArtwork}>
                        <Ionicons
                          name="musical-note"
                          size={40}
                          color={theme.colors.white}
                        />
                      </View>
                      <View style={styles.songInfo}>
                        <AppText variant="body" weight="bold">
                          {uploadedSong.name}
                        </AppText>
                        <AppText
                          variant="caption"
                          color={theme.colors.text.secondary}
                        >
                          Duration: {uploadedSong.duration}
                        </AppText>
                        <View style={styles.songTags}>
                          <View style={styles.tag}>
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={theme.colors.neon.green}
                            />
                            <AppText variant="caption">Ready</AppText>
                          </View>
                        </View>
                      </View>
                      <IconButton
                        icon={
                          <Ionicons
                            name="close"
                            size={20}
                            color={theme.colors.white}
                          />
                        }
                        variant="ghost"
                        size="sm"
                        onPress={() => setUploadedSong(null)}
                      />
                    </View>
                  </LinearGradient>
                </AnimatedGlassCard>
              )}
            </View>

            {/* Settings Card */}
            <AnimatedGlassCard
              entering={FadeInUp.delay(300).duration(600).springify()}
              layout={Layout.springify()}
              intensity="medium"
              pressable
              style={styles.sectionCard}
            >
              <LinearGradient
                colors={[...theme.gradients.lime, "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.cardHeader}>
                <Ionicons
                  name="settings"
                  size={24}
                  color={theme.colors.neon.green}
                />
                <AppText variant="h4" weight="bold">
                  Session Settings
                </AppText>
              </View>

              <GlassCard intensity="light" style={styles.settingItem}>
                <View style={styles.settingRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={22}
                    color={theme.colors.neon.green}
                  />
                  <AppText variant="body">Host Controls Enabled</AppText>
                </View>
              </GlassCard>

              <GlassCard intensity="light" style={styles.settingItem}>
                <View style={styles.settingRow}>
                  <Ionicons
                    name="wifi"
                    size={22}
                    color={theme.colors.neon.blue}
                  />
                  <AppText variant="body">Low Latency Mode</AppText>
                </View>
              </GlassCard>

              <GlassCard intensity="light" style={styles.settingItem}>
                <View style={styles.settingRow}>
                  <Ionicons
                    name="sync"
                    size={22}
                    color={theme.colors.neon.purple}
                  />
                  <AppText variant="body">Auto-sync Enabled</AppText>
                </View>
              </GlassCard>
            </AnimatedGlassCard>

            {/* Info Card */}
            <AnimatedGlassCard
              entering={SlideInRight.delay(400).duration(600).springify()}
              intensity="light"
              pressable
              style={styles.infoCard}
            >
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
            </AnimatedGlassCard>

            {/* Status Indicator */}
            {isCreating && (
              <AnimatedGlassCard
                entering={FadeInUp.duration(400)}
                intensity="medium"
                style={styles.statusCard}
              >
                <View style={styles.statusContent}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.neon.cyan}
                  />
                  <AppText variant="body" weight="semibold">
                    {sessionStatus === "hosting"
                      ? "Starting host..."
                      : "Creating session..."}
                  </AppText>
                </View>
              </AnimatedGlassCard>
            )}

            {/* Error Display */}
            {sessionError && !isCreating && (
              <AnimatedGlassCard
                entering={FadeInUp.duration(400)}
                intensity="medium"
                style={styles.errorCard}
              >
                <View style={styles.statusContent}>
                  <Ionicons
                    name="alert-circle"
                    size={24}
                    color={theme.colors.error}
                  />
                  <AppText variant="body" color={theme.colors.error}>
                    {sessionError}
                  </AppText>
                </View>
              </AnimatedGlassCard>
            )}

            {/* Start Session Button */}
            <Animated.View
              entering={FadeInUp.delay(500).duration(600).springify()}
              style={styles.actions}
            >
              <GradientButton
                title={isCreating ? "Creating..." : "Start Session"}
                gradient="party"
                size="lg"
                fullWidth
                disabled={isCreating}
                icon={
                  isCreating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="rocket" size={24} color="white" />
                  )
                }
                onPress={handleCreateSession}
              />
              <AppText
                variant="caption"
                center
                color={theme.colors.text.tertiary}
              >
                You can invite friends after creating the session
              </AppText>
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
    marginBottom: theme.spacing["2xl"],
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing.md,
  },
  form: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionCard: {
    overflow: "hidden",
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
  musicOptions: {
    gap: theme.spacing.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.glass.light,
  },
  songPreviewCard: {
    overflow: "hidden",
  },
  songPreviewGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  songPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  songArtwork: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  songInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  songTags: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  settingItem: {
    marginBottom: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
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
  statusCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  errorCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  actions: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
});
