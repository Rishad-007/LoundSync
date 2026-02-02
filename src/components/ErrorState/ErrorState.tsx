/**
 * ErrorState Component
 *
 * Friendly error state with icon, title, description, and retry action
 * Use for network errors, failed operations, sync issues, etc.
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../../theme";
import { AppText } from "../AppText/AppText";
import { GlassCard } from "../GlassCard/GlassCard";
import { GradientButton } from "../GradientButton/GradientButton";

type IconName = keyof typeof Ionicons.glyphMap;
type ErrorType = "network" | "sync" | "generic" | "permission";

export interface ErrorStateProps {
  type?: ErrorType;
  icon?: IconName;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
}

const errorDefaults: Record<
  ErrorType,
  { icon: IconName; title: string; description: string }
> = {
  network: {
    icon: "wifi-outline",
    title: "Connection Lost",
    description:
      "Unable to connect to the network. Check your internet connection and try again.",
  },
  sync: {
    icon: "sync-circle-outline",
    title: "Sync Error",
    description:
      "Failed to synchronize with other devices. Please check your connection and retry.",
  },
  generic: {
    icon: "alert-circle-outline",
    title: "Something Went Wrong",
    description:
      "An unexpected error occurred. Don't worry, we're working on it. Please try again.",
  },
  permission: {
    icon: "shield-outline",
    title: "Permission Required",
    description:
      "This feature requires additional permissions. Please grant access in your device settings.",
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = "generic",
  icon,
  title,
  description,
  retryLabel = "Try Again",
  onRetry,
  dismissLabel,
  onDismiss,
}) => {
  const defaults = errorDefaults[type];
  const finalIcon = icon || defaults.icon;
  const finalTitle = title || defaults.title;
  const finalDescription = description || defaults.description;

  // Pulse animation for error icon
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <GlassCard intensity="medium" style={styles.card}>
        <LinearGradient
          colors={[theme.colors.error + "40", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        />

        <View style={styles.content}>
          {/* Animated Error Icon */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
            style={styles.iconContainer}
          >
            <Animated.View style={[styles.iconCircle, pulseStyle]}>
              <LinearGradient
                colors={[theme.colors.error, theme.colors.neon.orange]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={finalIcon}
                  size={64}
                  color={theme.colors.white}
                />
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* Text Content */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600).springify()}
            style={styles.textContent}
          >
            <AppText variant="h3" weight="bold" center>
              {finalTitle}
            </AppText>
            <AppText
              variant="body"
              center
              color={theme.colors.text.secondary}
              style={styles.description}
            >
              {finalDescription}
            </AppText>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600).springify()}
            style={styles.actionContainer}
          >
            {onRetry && (
              <GradientButton
                title={retryLabel}
                gradient="sunset"
                size="md"
                fullWidth
                onPress={onRetry}
                icon={
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={theme.colors.white}
                  />
                }
              />
            )}
            {onDismiss && (
              <GradientButton
                title={dismissLabel || "Go Back"}
                gradient="accent"
                size="md"
                fullWidth
                onPress={onDismiss}
                icon={
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={theme.colors.white}
                  />
                }
              />
            )}
          </Animated.View>
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: theme.spacing["2xl"],
    alignItems: "center",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: "center",
    gap: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    ...theme.shadows.neon,
  },
  iconGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textContent: {
    gap: theme.spacing.md,
    alignItems: "center",
  },
  description: {
    maxWidth: 300,
    lineHeight: 22,
  },
  actionContainer: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
});
