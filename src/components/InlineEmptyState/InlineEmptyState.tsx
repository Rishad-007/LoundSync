/**
 * InlineEmptyState Component
 *
 * Compact empty state for inline use within sections/cards
 * Perfect for "no items in list" or "no results" scenarios
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { theme } from "../../theme";
import { AppText } from "../AppText/AppText";

type IconName = keyof typeof Ionicons.glyphMap;

export interface InlineEmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  iconColor?: string;
  compact?: boolean;
}

export const InlineEmptyState: React.FC<InlineEmptyStateProps> = ({
  icon = "folder-open-outline",
  title,
  description,
  iconColor = theme.colors.neon.cyan,
  compact = false,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, compact && styles.compact]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={description ? `${title}. ${description}` : title}
    >
      <Ionicons
        name={icon}
        size={compact ? 32 : 48}
        color={iconColor}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <AppText
          variant={compact ? "body" : "h4"}
          weight="semibold"
          center
          color={theme.colors.text.primary}
        >
          {title}
        </AppText>
        {description && (
          <AppText
            variant="caption"
            center
            color={theme.colors.text.tertiary}
            style={styles.description}
          >
            {description}
          </AppText>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.responsive.spacing(theme.spacing["2xl"]),
    paddingHorizontal: theme.responsive.spacing(theme.spacing.lg),
    alignItems: "center",
    justifyContent: "center",
  },
  compact: {
    paddingVertical: theme.responsive.spacing(theme.spacing.xl),
  },
  icon: {
    opacity: 0.5,
    marginBottom: theme.spacing.md,
  },
  textContainer: {
    gap: theme.spacing.xs,
    alignItems: "center",
  },
  description: {
    maxWidth: theme.responsive.isTablet ? 350 : 250,
    lineHeight: theme.responsive.isTablet ? 22 : 18,
  },
});
