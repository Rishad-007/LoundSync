/**
 * LOUDSYNC Animation Presets
 *
 * Reanimated animation configurations for consistent microinteractions
 * across the entire app. Use these presets for button presses, screen
 * transitions, card interactions, and more.
 */

import {
  Easing,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Spring Physics Presets
 * Use for natural, bouncy animations (buttons, cards)
 */
export const springPresets = {
  // Gentle bounce - cards, modals
  gentle: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  // Snappy - buttons, quick interactions
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.5,
  },
  // Bouncy - celebratory, attention-grabbing
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },
  // Smooth - large content, drawers
  smooth: {
    damping: 25,
    stiffness: 250,
    mass: 1,
  },
};

/**
 * Timing Easing Presets
 * Use for precise, controlled animations
 */
export const easingPresets = {
  // Smooth in-out - general purpose
  smooth: Easing.inOut(Easing.ease),
  // Quick fade in - entrance animations
  fadeIn: Easing.out(Easing.cubic),
  // Quick fade out - exit animations
  fadeOut: Easing.in(Easing.cubic),
  // Elastic - playful animations
  elastic: Easing.elastic(1.5),
  // Bounce - attention grabbing
  bounce: Easing.bounce,
};

/**
 * Button Press Animation
 * Scale down on press, spring back on release
 */
export const buttonPress = {
  scale: (pressed: boolean) =>
    withSpring(pressed ? 0.95 : 1, springPresets.snappy),
};

/**
 * Card Press Animation
 * Subtle scale with opacity change
 */
export const cardPress = {
  scale: (pressed: boolean) =>
    withSpring(pressed ? 0.98 : 1, springPresets.gentle),
  opacity: (pressed: boolean) =>
    withTiming(pressed ? 0.8 : 1, { duration: 150 }),
};

/**
 * Neon Glow Pulse
 * Continuous pulsing glow effect for neon elements
 */
export const neonGlowPulse = (duration = 2000) =>
  withRepeat(
    withSequence(
      withTiming(1, { duration, easing: easingPresets.smooth }),
      withTiming(0.5, { duration, easing: easingPresets.smooth }),
    ),
    -1, // infinite
    false,
  );

/**
 * Ripple Effect
 * Expanding circle from press point
 */
export const rippleEffect = {
  scale: () =>
    withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(2, { duration: 600, easing: easingPresets.fadeOut }),
    ),
  opacity: () =>
    withSequence(
      withTiming(0.5, { duration: 0 }),
      withTiming(0, { duration: 600, easing: easingPresets.fadeOut }),
    ),
};

/**
 * Waveform Bar Animation
 * Reactive waveform bars
 */
export const waveformBar = (isPlaying: boolean, randomOffset = 0) => {
  if (isPlaying) {
    return withDelay(
      randomOffset,
      withRepeat(
        withSequence(
          withTiming(Math.random() * 0.8 + 0.4, {
            duration: 300 + Math.random() * 200,
            easing: easingPresets.smooth,
          }),
          withTiming(Math.random() * 0.5 + 0.2, {
            duration: 300 + Math.random() * 200,
            easing: easingPresets.smooth,
          }),
        ),
        -1,
        false,
      ),
    );
  }
  return withTiming(0.3, { duration: 300 });
};

/**
 * Floating Animation
 * Gentle up-down floating motion
 */
export const floating = (duration = 4000, distance = 15) =>
  withRepeat(
    withSequence(
      withTiming(-distance, { duration, easing: easingPresets.smooth }),
      withTiming(0, { duration, easing: easingPresets.smooth }),
    ),
    -1,
    false,
  );

/**
 * Shimmer Effect
 * Horizontal shimmer for loading states
 */
export const shimmer = (duration = 1500) =>
  withRepeat(
    withSequence(
      withTiming(-100, { duration: 0 }),
      withTiming(100, { duration, easing: Easing.linear }),
    ),
    -1,
    false,
  );

/**
 * Fade In Animation
 * Standard fade in with delay support
 */
export const fadeIn = (delay = 0, duration = 600) =>
  withDelay(delay, withTiming(1, { duration, easing: easingPresets.fadeIn }));

/**
 * Fade Out Animation
 * Standard fade out
 */
export const fadeOut = (duration = 300) =>
  withTiming(0, { duration, easing: easingPresets.fadeOut });

/**
 * Slide In Animation
 * Slide from direction with spring
 */
export const slideIn = (
  from: "left" | "right" | "top" | "bottom",
  delay = 0,
) => {
  return withDelay(delay, withSpring(0, springPresets.smooth));
};

/**
 * Rotation Animation
 * Continuous rotation (for loading spinners, radars)
 */
export const rotation = (duration = 3000) =>
  withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false);

/**
 * Scale Pulse Animation
 * Quick scale up then down
 */
export const scalePulse = (delay = 0) =>
  withDelay(
    delay,
    withSequence(
      withSpring(1.1, springPresets.snappy),
      withSpring(1, springPresets.snappy),
    ),
  );

/**
 * Shake Animation
 * Horizontal shake for errors or attention
 */
export const shake = () =>
  withSequence(
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(0, { duration: 50 }),
  );

export default {
  springPresets,
  easingPresets,
  buttonPress,
  cardPress,
  neonGlowPulse,
  rippleEffect,
  waveformBar,
  floating,
  shimmer,
  fadeIn,
  fadeOut,
  slideIn,
  rotation,
  scalePulse,
  shake,
};
