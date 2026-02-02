/**
 * Responsive utilities for tablet and different screen sizes
 */

import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Breakpoints
export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Device detection
export const isPhone = SCREEN_WIDTH < breakpoints.tablet;
export const isTablet =
  SCREEN_WIDTH >= breakpoints.tablet && SCREEN_WIDTH < breakpoints.desktop;
export const isDesktop = SCREEN_WIDTH >= breakpoints.desktop;

// Orientation
export const isPortrait = SCREEN_HEIGHT > SCREEN_WIDTH;
export const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

// Platform checks
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";

/**
 * Responsive spacing - scales based on screen size
 * @param size Base size for phone
 * @returns Scaled size for current device
 */
export const responsiveSpacing = (size: number): number => {
  if (isTablet) return size * 1.3;
  if (isDesktop) return size * 1.5;
  return size;
};

/**
 * Responsive font size
 * @param size Base font size for phone
 * @returns Scaled font size for current device
 */
export const responsiveFontSize = (size: number): number => {
  if (isTablet) return size * 1.15;
  if (isDesktop) return size * 1.25;
  return size;
};

/**
 * Get responsive width percentage
 * @param percentage Width percentage (0-100)
 * @returns Pixel width
 */
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Get responsive height percentage
 * @param percentage Height percentage (0-100)
 * @returns Pixel height
 */
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Get max content width for different devices
 */
export const getMaxContentWidth = (): number => {
  if (isPhone) return SCREEN_WIDTH - 32; // 16px padding on each side
  if (isTablet) return 600; // Max width for tablet
  return 800; // Max width for desktop
};

/**
 * Get column count for grid layouts
 */
export const getGridColumns = (): number => {
  if (isPhone) return 2;
  if (isTablet) return 3;
  return 4;
};

/**
 * Platform-specific padding for safe areas
 */
export const getSafeAreaPadding = () => ({
  paddingTop: Platform.select({ ios: 50, android: 20, default: 20 }),
  paddingBottom: Platform.select({ ios: 34, android: 20, default: 20 }),
});

/**
 * Responsive card width for lists
 */
export const getCardWidth = (): number => {
  const columns = getGridColumns();
  const spacing = 16;
  const totalSpacing = spacing * (columns + 1);
  return (SCREEN_WIDTH - totalSpacing) / columns;
};

export const responsive = {
  breakpoints,
  isPhone,
  isTablet,
  isDesktop,
  isPortrait,
  isLandscape,
  spacing: responsiveSpacing,
  fontSize: responsiveFontSize,
  wp,
  hp,
  maxContentWidth: getMaxContentWidth,
  gridColumns: getGridColumns,
  safeAreaPadding: getSafeAreaPadding,
  cardWidth: getCardWidth,
} as const;

export type Responsive = typeof responsive;
