/**
 * Network Slice - Phase 1
 * Manages network status and connection quality
 * MOCK IMPLEMENTATIONS - No real network yet
 */

import { StateCreator } from "zustand";
import type {
  ConnectionError,
  LoudSyncStore,
  NetworkActions,
  NetworkMetrics,
  NetworkQuality,
  NetworkState,
} from "../types";

export type NetworkSlice = NetworkState & NetworkActions;

const initialMetrics: NetworkMetrics = {
  latency: null,
  packetLoss: 0,
  lastHeartbeat: null,
  reconnectAttempts: 0,
  messagesReceived: 0,
  messagesSent: 0,
};

/**
 * Calculate network quality based on latency and packet loss
 */
function calculateQuality(
  latency: number | null,
  packetLoss: number,
): NetworkQuality {
  if (latency === null) return "poor";

  // Packet loss takes priority
  if (packetLoss > 10) return "critical";
  if (packetLoss > 5) return "poor";

  // Then check latency
  if (latency < 20) return "excellent";
  if (latency < 50) return "good";
  if (latency < 100) return "fair";
  if (latency < 200) return "poor";
  return "critical";
}

export const createNetworkSlice: StateCreator<
  LoudSyncStore,
  [],
  [],
  NetworkSlice
> = (set, get) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================
  isNetworkAvailable: true,
  networkType: "wifi",
  localIP: null,
  quality: "good",
  metrics: initialMetrics,
  lastError: null,

  // ============================================================================
  // NETWORK STATUS ACTIONS
  // ============================================================================

  /**
   * Set network availability
   */
  setNetworkAvailable: (available: boolean) => {
    set({ isNetworkAvailable: available });
    console.log("[NetworkSlice] Network available:", available);
  },

  /**
   * Set network type
   */
  setNetworkType: (type: "wifi" | "cellular" | "none") => {
    set({ networkType: type });
    console.log("[NetworkSlice] Network type:", type);
  },

  /**
   * Set local IP address
   */
  setLocalIP: (ip: string | null) => {
    set({ localIP: ip });
    console.log("[NetworkSlice] Local IP:", ip);
  },

  // ============================================================================
  // QUALITY & METRICS ACTIONS
  // ============================================================================

  /**
   * Set network quality manually
   */
  setNetworkQuality: (quality: NetworkQuality) => {
    set({ quality });
  },

  /**
   * Update network metrics
   * Automatically recalculates quality
   */
  updateMetrics: (updates: Partial<NetworkMetrics>) => {
    set((state) => {
      const newMetrics = {
        ...state.metrics,
        ...updates,
      };

      // Recalculate quality
      const quality = calculateQuality(
        newMetrics.latency,
        newMetrics.packetLoss,
      );

      return {
        metrics: newMetrics,
        quality,
      };
    });
  },

  /**
   * Reset metrics to initial state
   */
  resetMetrics: () => {
    set({
      metrics: initialMetrics,
      quality: "good",
    });
    console.log("[NetworkSlice] Metrics reset");
  },

  // ============================================================================
  // ERROR HANDLING ACTIONS
  // ============================================================================

  /**
   * Set last error
   */
  setNetworkError: (error: ConnectionError | null) => {
    set({ lastError: error });
    if (error) {
      console.error("[NetworkSlice] Connection error:", error);
    }
  },

  /**
   * Clear last error
   */
  clearNetworkError: () => {
    set({ lastError: null });
  },

  // ============================================================================
  // UTILITY ACTIONS
  // ============================================================================

  /**
   * Check network connectivity
   * MOCK: Always returns available
   */
  checkNetwork: async () => {
    try {
      console.log("[NetworkSlice] Checking network...");

      // TODO: Use @react-native-community/netinfo
      // const state = await NetInfo.fetch();

      // MOCK: Always connected via WiFi
      await new Promise((resolve) => setTimeout(resolve, 100));

      set({
        isNetworkAvailable: true,
        networkType: "wifi",
        localIP: "192.168.1.50", // Mock IP
      });

      console.log("[NetworkSlice] Network check complete: WiFi");
    } catch (error) {
      console.error("[NetworkSlice] Network check failed:", error);
      set({
        isNetworkAvailable: false,
        networkType: "none",
        lastError: "network_unreachable",
      });
    }
  },
});
