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

export default function JoinSessionScreen() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");

  const handleJoinSession = () => {
    if (!sessionCode.trim()) {
      return;
    }

    router.push({
      pathname: "/player-room",
      params: {
        sessionId: sessionCode.toUpperCase(),
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
                Join Session
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary}>
                Enter the session code to join
              </AppText>
            </View>

            {/* Code Input */}
            <View style={styles.codeInputSection}>
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
              <AppText variant="caption" center>
                Get the code from your session host
              </AppText>
            </View>

            {/* Quick Join Section */}
            <View style={styles.quickJoinSection}>
              <AppText variant="h4" style={styles.sectionTitle}>
                Recent Sessions
              </AppText>

              <GlassCard intensity="medium" style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionIcon}>
                    <Ionicons
                      name="musical-notes"
                      size={24}
                      color={theme.colors.neon.pink}
                    />
                  </View>
                  <View style={styles.sessionInfo}>
                    <AppText variant="body" weight="semibold">
                      Weekend Party
                    </AppText>
                    <AppText variant="caption">Last joined 2 days ago</AppText>
                  </View>
                  <IconButton
                    icon={
                      <Ionicons
                        name="enter"
                        size={20}
                        color={theme.colors.white}
                      />
                    }
                    variant="gradient"
                    gradient="secondary"
                    size="sm"
                    onPress={() => {
                      setSessionCode("ABC-123");
                    }}
                  />
                </View>
              </GlassCard>

              <GlassCard intensity="medium" style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionIcon}>
                    <Ionicons
                      name="people"
                      size={24}
                      color={theme.colors.neon.cyan}
                    />
                  </View>
                  <View style={styles.sessionInfo}>
                    <AppText variant="body" weight="semibold">
                      Study Session
                    </AppText>
                    <AppText variant="caption">Last joined 1 week ago</AppText>
                  </View>
                  <IconButton
                    icon={
                      <Ionicons
                        name="enter"
                        size={20}
                        color={theme.colors.white}
                      />
                    }
                    variant="gradient"
                    gradient="secondary"
                    size="sm"
                    onPress={() => {
                      setSessionCode("XYZ-789");
                    }}
                  />
                </View>
              </GlassCard>
            </View>

            {/* Info Card */}
            <GlassCard intensity="light" style={styles.infoCard}>
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
                    Ask the host for the session code and enter it above. You'll
                    be connected instantly!
                  </AppText>
                </View>
              </View>
            </GlassCard>

            {/* Join Button */}
            <View style={styles.actions}>
              <GradientButton
                title="Join Session"
                gradient="secondary"
                size="lg"
                fullWidth
                disabled={sessionCode.length < 7}
                icon={<Ionicons name="enter" size={24} color="white" />}
                onPress={handleJoinSession}
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
  codeInputSection: {
    alignItems: "center",
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.sm,
  },
  codeInputGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 3,
    width: "100%",
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
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  sessionCard: {
    marginBottom: theme.spacing.sm,
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
  sessionInfo: {
    flex: 1,
    gap: theme.spacing.xs,
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
