import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  AppText,
  GlassCard,
  GradientButton,
  IconButton,
} from "../../src/components";
import { theme } from "../../src/theme";

export default function DesignSystemExample() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Typography Section */}
      <View style={styles.section}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Typography
        </AppText>
        <AppText variant="h1">Heading 1</AppText>
        <AppText variant="h2">Heading 2</AppText>
        <AppText variant="h3">Heading 3</AppText>
        <AppText variant="h4">Heading 4</AppText>
        <AppText variant="bodyLarge">Body Large Text</AppText>
        <AppText variant="body">Body Text</AppText>
        <AppText variant="caption">Caption Text</AppText>
        <AppText variant="overline">Overline Text</AppText>
      </View>

      {/* Glass Cards Section */}
      <View style={styles.section}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Glass Cards
        </AppText>

        <GlassCard intensity="light" style={styles.card}>
          <AppText variant="h4">Light Glass Card</AppText>
          <AppText variant="body" color={theme.colors.text.secondary}>
            This is a light intensity glassmorphism card with blur effect.
          </AppText>
        </GlassCard>

        <GlassCard intensity="medium" style={styles.card}>
          <AppText variant="h4">Medium Glass Card</AppText>
          <AppText variant="body" color={theme.colors.text.secondary}>
            This is a medium intensity glassmorphism card.
          </AppText>
        </GlassCard>

        <GlassCard intensity="heavy" style={styles.card}>
          <AppText variant="h4">Heavy Glass Card</AppText>
          <AppText variant="body" color={theme.colors.text.secondary}>
            This is a heavy intensity glassmorphism card.
          </AppText>
        </GlassCard>
      </View>

      {/* Gradient Buttons Section */}
      <View style={styles.section}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Gradient Buttons
        </AppText>

        <GradientButton
          title="Primary Gradient"
          gradient="primary"
          onPress={() => console.log("Pressed")}
          fullWidth
        />

        <GradientButton
          title="Secondary Gradient"
          gradient="secondary"
          size="lg"
          onPress={() => console.log("Pressed")}
          fullWidth
          style={styles.button}
        />

        <GradientButton
          title="Party Gradient"
          gradient="party"
          size="md"
          onPress={() => console.log("Pressed")}
          fullWidth
          style={styles.button}
        />

        <GradientButton
          title="With Icon"
          gradient="electric"
          icon={<Ionicons name="musical-notes" size={20} color="white" />}
          onPress={() => console.log("Pressed")}
          fullWidth
          style={styles.button}
        />

        <GradientButton
          title="Loading"
          gradient="sunset"
          loading
          fullWidth
          style={styles.button}
        />

        <View style={styles.buttonRow}>
          <GradientButton
            title="Small"
            size="sm"
            gradient="lime"
            onPress={() => console.log("Pressed")}
          />
          <GradientButton
            title="Medium"
            size="md"
            gradient="fire"
            onPress={() => console.log("Pressed")}
          />
        </View>
      </View>

      {/* Icon Buttons Section */}
      <View style={styles.section}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Icon Buttons
        </AppText>

        <View style={styles.iconButtonRow}>
          <IconButton
            icon={<Ionicons name="play" size={24} color={theme.colors.white} />}
            variant="gradient"
            gradient="primary"
            size="lg"
            onPress={() => console.log("Play")}
          />

          <IconButton
            icon={
              <Ionicons name="pause" size={24} color={theme.colors.white} />
            }
            variant="solid"
            size="lg"
            onPress={() => console.log("Pause")}
          />

          <IconButton
            icon={
              <Ionicons name="heart" size={24} color={theme.colors.neon.pink} />
            }
            variant="outline"
            size="lg"
            onPress={() => console.log("Like")}
          />

          <IconButton
            icon={
              <Ionicons
                name="share-social"
                size={24}
                color={theme.colors.neon.cyan}
              />
            }
            variant="ghost"
            size="lg"
            onPress={() => console.log("Share")}
          />
        </View>

        <View style={styles.iconButtonRow}>
          <IconButton
            icon={<Ionicons name="add" size={20} color={theme.colors.white} />}
            variant="gradient"
            gradient="secondary"
            size="md"
            onPress={() => console.log("Add")}
          />

          <IconButton
            icon={
              <Ionicons name="search" size={20} color={theme.colors.white} />
            }
            variant="gradient"
            gradient="electric"
            size="md"
            onPress={() => console.log("Search")}
          />

          <IconButton
            icon={
              <Ionicons name="settings" size={20} color={theme.colors.white} />
            }
            variant="solid"
            size="md"
            onPress={() => console.log("Settings")}
          />
        </View>

        <View style={styles.iconButtonRow}>
          <IconButton
            icon={
              <Ionicons
                name="star"
                size={16}
                color={theme.colors.neon.yellow}
              />
            }
            variant="ghost"
            size="sm"
            onPress={() => console.log("Star")}
          />

          <IconButton
            icon={
              <Ionicons
                name="bookmark"
                size={16}
                color={theme.colors.neon.purple}
              />
            }
            variant="outline"
            size="sm"
            onPress={() => console.log("Bookmark")}
          />

          <IconButton
            icon={
              <Ionicons
                name="notifications"
                size={16}
                color={theme.colors.white}
              />
            }
            variant="gradient"
            gradient="sunset"
            size="sm"
            onPress={() => console.log("Notifications")}
          />
        </View>
      </View>

      {/* Color Palette Section */}
      <View style={styles.section}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Neon Colors
        </AppText>
        <View style={styles.colorGrid}>
          {Object.entries(theme.colors.neon).map(([name, color]) => (
            <View key={name} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: color }]} />
              <AppText variant="caption">{name}</AppText>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  iconButtonRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  colorItem: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
});
