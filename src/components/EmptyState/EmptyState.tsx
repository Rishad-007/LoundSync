/**
 * EmptyState Component
 *
 * Friendly empty state with icon, title, description, and optional action
 * Use when there's no content to display (no devices, no songs, etc.)
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { theme } from "../../theme";
import { AppText } from "../AppText/AppText";
import { GlassCard } from "../GlassCard/GlassCard";
import { GradientButton } from "../GradientButton/GradientButton";

type IconName = keyof typeof Ionicons.glyphMap;

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradient?: keyof typeof theme.gradients;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "albums-outline",
  title,
  description,
  actionLabel,
  onAction,
  gradient = "secondary",
  illustration,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description}`}
    >
      <GlassCard intensity="medium" style={styles.card}>
        <LinearGradient
          colors={[...theme.gradients[gradient], "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        />

        <View style={styles.content}>
          {/* Icon or Custom Illustration */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
            style={styles.iconContainer}
          >
            {illustration || (
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={theme.gradients[gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name={icon} size={64} color={theme.colors.white} />
                </LinearGradient>
              </View>
            )}
          </Animated.View>

          {/* Text Content */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600).springify()}
            style={styles.textContent}
          >
            <AppText variant="h3" weight="bold" center>
              {title}
            </AppText>
            <AppText
              variant="body"
              center
              color={theme.colors.text.secondary}
              style={styles.description}
            >
              {description}
            </AppText>
          </Animated.View>

          {/* Optional Action Button */}
          {actionLabel && onAction && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(600).springify()}
              style={styles.actionContainer}
            >
              <GradientButton
                title={actionLabel}
                gradient={gradient}
                size="md"
                onPress={onAction}
                icon={
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={theme.colors.white}
                  />
                }
              />
            </Animated.View>
          )}
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
    padding: theme.responsive.spacing(theme.spacing.xl),
  },
  card: {
    width: "100%",
    maxWidth: theme.responsive.maxContentWidth(),
    padding: theme.responsive.spacing(theme.spacing["2xl"]),
    alignItems: "center",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  content: {
    alignItems: "center",
    gap: theme.responsive.spacing(theme.spacing.xl),
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: theme.responsive.isTablet ? 180 : 140,
    height: theme.responsive.isTablet ? 180 : 140,
    borderRadius: theme.responsive.isTablet ? 90 : 70,
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
    maxWidth: theme.responsive.isTablet ? 400 : 300,
    lineHeight: theme.responsive.isTablet ? 26 : 22,
  },
  actionContainer: {
    marginTop: theme.spacing.md,
    minWidth: theme.responsive.isTablet ? 200 : 160,
  },
});
