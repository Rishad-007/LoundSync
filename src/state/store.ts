/**
 * LOUDSYNC Main Store
 * Phase 1: Session Hosting & Joining Only
 * Combines all slices with persistence
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createDeviceSlice } from "./slices/deviceSlice";
import { createNetworkSlice } from "./slices/networkSlice";
import { createSessionSlice } from "./slices/sessionSlice";
import { createUserSlice } from "./slices/userSlice";
import type { LoudSyncStore, PersistedState } from "./types";

/**
 * Main LOUDSYNC Store
 * Combines all slices into a single store with persistence
 */
export const useLoudSyncStore = create<LoudSyncStore>()(
  persist(
    (set, get, api) => ({
      // Combine Phase 1 slices
      ...createUserSlice(set, get, api),
      ...createSessionSlice(set, get, api),
      ...createDeviceSlice(set, get, api),
      ...createNetworkSlice(set, get, api),

      /**
       * Global reset action
       * Resets entire store to initial state
       */
      reset: () => {
        console.log("[LoudSyncStore] Resetting store...");

        // Leave any active session
        if (get().status !== "idle") {
          get().leaveSession();
        }

        // Clear all state
        get().clearUser();
        get().clearMembers();
        get().resetMetrics();
        get().clearDiscoveredSessions();
        get().clearNetworkError();

        console.log("[LoudSyncStore] Store reset complete");
      },
    }),
    {
      name: "loudsync-storage",
      storage: createJSONStorage(() => AsyncStorage),

      /**
       * Partialize: Select which parts of state to persist
       * Only persist essential device info and onboarding status
       */
      partialize: (state): PersistedState => ({
        localDevice: state.localDevice,
        isOnboarded: state.isOnboarded,
      }),

      /**
       * Version for migration support
       * Increment when making breaking changes to persisted state
       */
      version: 1,

      /**
       * Merge persisted state with initial state
       */
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          localDevice: persistedState?.localDevice,
          isOnboarded: persistedState?.isOnboarded,
        };
      },
    },
  ),
);

/**
 * Selector Hooks
 * Optimized hooks for specific slices to avoid unnecessary re-renders
 */

// User/Device selectors
export const useLocalDevice = () =>
  useLoudSyncStore((state) => state.localDevice);
export const useIsOnboarded = () =>
  useLoudSyncStore((state) => state.isOnboarded);

// Session selectors
export const useSessionStatus = () => useLoudSyncStore((state) => state.status);
export const useSessionRole = () => useLoudSyncStore((state) => state.role);
export const useCurrentSession = () =>
  useLoudSyncStore((state) => state.currentSession);
export const useDiscoveredSessions = () =>
  useLoudSyncStore((state) => state.discoveredSessions);
export const useSessionError = () => useLoudSyncStore((state) => state.error);

// Member/Device selectors
export const useMembers = () => useLoudSyncStore((state) => state.members);
export const useHost = () => useLoudSyncStore((state) => state.host);
export const useConnectedCount = () =>
  useLoudSyncStore((state) => state.connectedCount);
export const usePendingRequests = () =>
  useLoudSyncStore((state) => state.pendingRequests);
export const useIsHost = () => useLoudSyncStore((state) => state.isHost());

// Network selectors
export const useNetworkAvailable = () =>
  useLoudSyncStore((state) => state.isNetworkAvailable);
export const useNetworkType = () =>
  useLoudSyncStore((state) => state.networkType);
export const useNetworkQuality = () =>
  useLoudSyncStore((state) => state.quality);
export const useNetworkMetrics = () =>
  useLoudSyncStore((state) => state.metrics);
export const useNetworkError = () =>
  useLoudSyncStore((state) => state.lastError);

/**
 * Action Hooks
 * Expose actions as hooks for easy consumption
 */

// User actions
export const useUserActions = () =>
  useLoudSyncStore((state) => ({
    setLocalDevice: state.setLocalDevice,
    updateDeviceName: state.updateDeviceName,
    generateDeviceId: state.generateDeviceId,
    setOnboarded: state.setOnboarded,
  }));

// Session actions
export const useSessionActions = () =>
  useLoudSyncStore((state) => ({
    createSession: state.createSession,
    startHosting: state.startHosting,
    stopHosting: state.stopHosting,
    discoverSessions: state.discoverSessions,
    stopDiscovery: state.stopDiscovery,
    joinSession: state.joinSession,
    leaveSession: state.leaveSession,
  }));

// Member actions
export const useMemberActions = () =>
  useLoudSyncStore((state) => ({
    addMember: state.addMember,
    removeMember: state.removeMember,
    updateMember: state.updateMember,
    acceptRequest: state.acceptRequest,
    rejectRequest: state.rejectRequest,
    kickMember: state.kickMember,
  }));

// Network actions
export const useNetworkActions = () =>
  useLoudSyncStore((state) => ({
    checkNetwork: state.checkNetwork,
    setNetworkAvailable: state.setNetworkAvailable,
    updateMetrics: state.updateMetrics,
  }));

/**
 * Developer tools
 * Helper to get entire store state (use sparingly)
 */
export const useStoreState = () => useLoudSyncStore((state) => state);

/**
 * Dev-only: Log store state
 */
if (__DEV__) {
  // Subscribe to all changes in dev mode
  useLoudSyncStore.subscribe((state) => {
    console.log("[Store Update]", {
      status: state.status,
      role: state.role,
      memberCount: state.members.length,
      sessionName: state.currentSession?.name,
    });
  });
}

/**
 * Export store for direct access (use in services/middleware)
 */
export const getStoreState = () => useLoudSyncStore.getState();
