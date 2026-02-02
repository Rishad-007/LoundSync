import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppText, GlassCard, GradientButton } from "../src/components";
import { theme } from "../src/theme";

export default function HomeScreen() {
  const router = useRouter();

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
            <LinearGradient
              colors={theme.gradients.party}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            />
            <AppText variant="h2" weight="black" center>
              LOUDSYNC
            </AppText>
            <AppText variant="body" color={theme.colors.text.secondary} center>
              Create or join a party session
            </AppText>
          </View>

          {/* Main Actions */}
          <View style={styles.actions}>
            <GradientButton
              title="Create Session"
              gradient="primary"
              size="lg"
              fullWidth
              icon={<Ionicons name="add-circle" size={24} color="white" />}
              onPress={() => router.push("/create-session")}
            />

            <GradientButton
              title="Join Session"
              gradient="secondary"
              size="lg"
              fullWidth
              icon={<Ionicons name="enter" size={24} color="white" />}
              onPress={() => router.push("/join-session")}
            />
          </View>

          {/* Features Section */}
          <View style={styles.features}>
            <AppText variant="h4" style={styles.featuresTitle}>
              Features
            </AppText>

            <GlassCard intensity="medium" style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="musical-notes"
                  size={32}
                  color={theme.colors.neon.pink}
                />
              </View>
              <AppText variant="h4">Sync Music</AppText>
              <AppText
                variant="body"
                color={theme.colors.text.secondary}
                center
              >
                Play music in perfect sync across all connected devices
              </AppText>
            </GlassCard>

            <GlassCard intensity="medium" style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="people"
                  size={32}
                  color={theme.colors.neon.cyan}
                />
              </View>
              <AppText variant="h4">Party Together</AppText>
              <AppText
                variant="body"
                color={theme.colors.text.secondary}
                center
              >
                Connect multiple devices for an immersive experience
              </AppText>
            </GlassCard>

            <GlassCard intensity="medium" style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="volume-high"
                  size={32}
                  color={theme.colors.neon.purple}
                />
              </View>
              <AppText variant="h4">Studio Quality</AppText>
              <AppText
                variant="body"
                color={theme.colors.text.secondary}
                center
              >
                Crystal clear audio with minimal latency
              </AppText>
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
    paddingTop: theme.spacing["3xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing["2xl"],
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.neon,
  },
  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  features: {
    gap: theme.spacing.md,
  },
  featuresTitle: {
    marginBottom: theme.spacing.md,
  },
  featureCard: {
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  featureIcon: {
    marginBottom: theme.spacing.sm,
  },
});
