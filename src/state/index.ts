/**
 * State Layer Public API
 * Phase 1: Session Hosting & Joining
 */

// Main store and hooks
export { useLoudSyncStore } from "./store";

// Selector hooks
export {
  useConnectedCount,
  useCurrentSession,
  useDiscoveredSessions,
  useHost,
  useIsHost,
  useIsOnboarded,
  // User
  useLocalDevice,
  // Members
  useMembers,
  // Network
  useNetworkAvailable,
  useNetworkError,
  useNetworkMetrics,
  useNetworkQuality,
  useNetworkType,
  usePendingRequests,
  useSessionError,
  useSessionRole,
  // Session
  useSessionStatus,
} from "./store";

// Action hooks
export {
  useMemberActions,
  useNetworkActions,
  useSessionActions,
  useUserActions,
} from "./store";

// Types
export type {
  // Network
  ConnectionError,
  // Session
  ConnectionStatus,
  DeviceActions,
  // Member/Device
  DeviceConnectionStatus,
  DeviceHelpers,
  DeviceState,
  DiscoveredSession,
  // User
  LocalDevice,
  // Store
  LoudSyncStore,
  Member,
  NetworkActions,
  NetworkMetrics,
  NetworkQuality,
  NetworkState,
  PersistedState,
  Session,
  SessionActions,
  SessionState,
  UserActions,
  UserState,
} from "./types";
