/**
 * User Slice - Phase 1
 * Manages local device identity
 */

import { StateCreator } from "zustand";
import type {
  LocalDevice,
  LoudSyncStore,
  UserActions,
  UserState,
} from "../types";

export type UserSlice = UserState & UserActions;

/**
 * Generate a unique device ID
 * Format: loudsync_<timestamp>_<random>
 */
const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `loudsync_${timestamp}_${random}`;
};

/**
 * Get a default device name based on platform
 */
const getDefaultDeviceName = (): string => {
  // In a real app, you'd use react-native-device-info
  // For now, return a placeholder
  return `Device ${Math.floor(Math.random() * 1000)}`;
};

export const createUserSlice: StateCreator<LoudSyncStore, [], [], UserSlice> = (
  set,
  get,
) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================
  localDevice: null,
  isOnboarded: false,

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Set the local device info
   * Called during onboarding or when restoring persisted state
   */
  setLocalDevice: (device: LocalDevice) => {
    set({ localDevice: device });
    console.log("[UserSlice] Local device set:", device.name);
  },

  /**
   * Update the device name only
   * User can change their device name in settings
   */
  updateDeviceName: (name: string) => {
    const current = get().localDevice;
    if (!current) {
      console.warn("[UserSlice] Cannot update device name: no device set");
      return;
    }

    set({
      localDevice: {
        ...current,
        name,
      },
    });
    console.log("[UserSlice] Device name updated to:", name);
  },

  /**
   * Generate a new device ID
   * Called on first launch
   */
  generateDeviceId: () => {
    const device: LocalDevice = {
      id: generateUniqueId(),
      name: getDefaultDeviceName(),
      createdAt: Date.now(),
    };

    set({ localDevice: device });
    console.log("[UserSlice] Generated new device ID:", device.id);
  },

  /**
   * Mark onboarding as complete
   */
  setOnboarded: (value: boolean) => {
    set({ isOnboarded: value });
    console.log("[UserSlice] Onboarded:", value);
  },

  /**
   * Clear user data (logout/reset)
   */
  clearUser: () => {
    set({
      localDevice: null,
      isOnboarded: false,
    });
    console.log("[UserSlice] User data cleared");
  },
});
