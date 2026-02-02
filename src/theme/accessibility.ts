/**
 * Accessibility utilities and WCAG compliance helpers
 */

import { AccessibilityProps } from "react-native";

/**
 * WCAG 2.1 AA contrast ratio requirements
 * - Normal text: 4.5:1
 * - Large text (18pt+): 3:1
 * - UI components: 3:1
 */

export const accessibilityRoles = {
  button: "button",
  link: "link",
  header: "header",
  text: "text",
  image: "image",
  imagebutton: "imagebutton",
  search: "search",
  none: "none",
  adjustable: "adjustable",
  alert: "alert",
  checkbox: "checkbox",
  combobox: "combobox",
  menu: "menu",
  menubar: "menubar",
  menuitem: "menuitem",
  progressbar: "progressbar",
  radio: "radio",
  radiogroup: "radiogroup",
  scrollbar: "scrollbar",
  spinbutton: "spinbutton",
  switch: "switch",
  tab: "tab",
  tablist: "tablist",
  timer: "timer",
  toolbar: "toolbar",
} as const;

/**
 * Create accessible button props
 */
export const createButtonA11yProps = (
  label: string,
  hint?: string,
  disabled?: boolean,
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: "button",
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: { disabled: disabled || false },
});

/**
 * Create accessible text input props
 */
export const createTextInputA11yProps = (
  label: string,
  value?: string,
  hint?: string,
): AccessibilityProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityValue: value ? { text: value } : undefined,
  accessibilityHint: hint,
});

/**
 * Create accessible slider props
 */
export const createSliderA11yProps = (
  label: string,
  currentValue: number,
  min: number = 0,
  max: number = 100,
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: "adjustable",
  accessibilityLabel: label,
  accessibilityValue: {
    min,
    max,
    now: currentValue,
  },
});

/**
 * Create accessible image props
 */
export const createImageA11yProps = (
  description: string,
  isDecorative: boolean = false,
): AccessibilityProps => ({
  accessible: !isDecorative,
  accessibilityRole: isDecorative ? "none" : "image",
  accessibilityLabel: isDecorative ? undefined : description,
});

/**
 * Create accessible header props
 */
export const createHeaderA11yProps = (
  text: string,
  level: number = 1,
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: "header",
  accessibilityLabel: text,
  // Note: accessibilityLevel is iOS-only and not in React Native types
  // Use semantic heading components instead
});

/**
 * Create accessible loading state props
 */
export const createLoadingA11yProps = (
  loadingText: string = "Loading",
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: "progressbar",
  accessibilityLabel: loadingText,
  accessibilityLiveRegion: "polite",
});

/**
 * Create accessible alert props
 */
export const createAlertA11yProps = (
  message: string,
  isError: boolean = false,
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: "alert",
  accessibilityLabel: message,
  accessibilityLiveRegion: isError ? "assertive" : "polite",
});

/**
 * Minimum touch target size (44x44 for iOS, 48x48 for Android)
 */
export const MIN_TOUCH_TARGET = {
  ios: 44,
  android: 48,
  default: 44,
} as const;

/**
 * Get minimum touch target size for current platform
 */
export const getMinTouchTarget = (): number => {
  return MIN_TOUCH_TARGET.default;
};

/**
 * Focus management utilities
 */
export const focusStyles = {
  outline: {
    borderWidth: 2,
    borderColor: "#3A86FF", // High contrast blue
  },
  glow: {
    shadowColor: "#3A86FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

/**
 * Semantic color helpers for accessibility
 */
export const semanticColors = {
  focus: "#3A86FF",
  error: "#FF006E",
  success: "#06FFA5",
  warning: "#FFBE0B",
  info: "#3A86FF",
} as const;

export const accessibility = {
  roles: accessibilityRoles,
  button: createButtonA11yProps,
  textInput: createTextInputA11yProps,
  slider: createSliderA11yProps,
  image: createImageA11yProps,
  header: createHeaderA11yProps,
  loading: createLoadingA11yProps,
  alert: createAlertA11yProps,
  minTouchTarget: getMinTouchTarget,
  focusStyles,
  semanticColors,
} as const;

export type Accessibility = typeof accessibility;
