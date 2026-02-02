import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { theme } from "../../theme";

type GlassIntensity = "light" | "medium" | "heavy";

interface GlassCardProps extends ViewProps {
  intensity?: GlassIntensity;
  blur?: keyof typeof theme.blur;
  noBorder?: boolean;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = "medium",
  blur = "md",
  noBorder = false,
  style,
  children,
  ...props
}) => {
  const intensityColors = {
    light: theme.colors.glass.light,
    medium: theme.colors.glass.medium,
    heavy: theme.colors.glass.heavy,
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: intensityColors[intensity],
          borderRadius: theme.borderRadius.lg,
          borderWidth: noBorder ? 0 : 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
        theme.shadows.md,
        style,
      ]}
      {...props}
    >
      <BlurView intensity={theme.blur[blur]} style={styles.blur} tint="dark">
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  blur: {
    padding: theme.spacing.lg,
  },
});
