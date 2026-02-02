/**
 * Simulated Discovery Service
 * For testing in Expo Go when native modules (mDNS/UDP) are not available
 * Simulates local network discovery by polling the session registry
 */

import { sessionRegistry } from "./sessionRegistry";
import type { DiscoveredSessionData } from "./types";

export class SimulatedDiscoveryService {
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private onSessionFound: ((session: DiscoveredSessionData) => void) | null =
    null;
  private onSessionLost: ((sessionId: string) => void) | null = null;
  private lastSeenSessions: Set<string> = new Set();

  /**
   * Start simulated scan - polls session registry
   */
  startScan(
    onFound: (session: DiscoveredSessionData) => void,
    onLost: (sessionId: string) => void,
    intervalMs: number = 2000,
  ): void {
    console.log("[SimulatedDiscovery] Starting simulated scan (Expo Go mode)");

    this.onSessionFound = onFound;
    this.onSessionLost = onLost;

    // Poll registry for active sessions
    this.scanInterval = setInterval(() => {
      this.pollRegistry();
    }, intervalMs);

    // Initial scan
    this.pollRegistry();
  }

  /**
   * Poll session registry for active sessions
   */
  private pollRegistry(): void {
    const activeSessions = sessionRegistry.getAllActiveSessions();
    const currentSessionIds = new Set<string>();

    // Report found sessions
    activeSessions.forEach((sessionData) => {
      const sessionId = sessionData.sessionId;
      currentSessionIds.add(sessionId);

      // Only report as "found" if this is a new session
      if (!this.lastSeenSessions.has(sessionId)) {
        console.log(`[SimulatedDiscovery] Found session: ${sessionId}`);

        const discoveredSession: DiscoveredSessionData = {
          advertisement: {
            sessionId: sessionData.sessionId,
            sessionName: sessionData.sessionName,
            hostId: sessionData.hostId,
            hostName: sessionData.hostName,
            memberCount: sessionData.members?.size || 1,
            maxMembers: sessionData.maxMembers || 8,
            isPasswordProtected: false,
            version: "1.0.0",
          },
          discoveryMethod: "simulated",
          lastSeen: Date.now(),
          signalStrength: 100, // Simulate perfect signal
          ipAddress: "127.0.0.1", // Localhost for simulation
          port: 8080,
        };

        this.onSessionFound?.(discoveredSession);
      }
    });

    // Report lost sessions (sessions that were seen before but are no longer active)
    this.lastSeenSessions.forEach((sessionId) => {
      if (!currentSessionIds.has(sessionId)) {
        console.log(`[SimulatedDiscovery] Lost session: ${sessionId}`);
        this.onSessionLost?.(sessionId);
      }
    });

    // Update tracking
    this.lastSeenSessions = currentSessionIds;
  }

  /**
   * Stop simulated scan
   */
  stopScan(): void {
    console.log("[SimulatedDiscovery] Stopping simulated scan");

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    this.lastSeenSessions.clear();
    this.onSessionFound = null;
    this.onSessionLost = null;
  }

  /**
   * Check if scan is active
   */
  isScanning(): boolean {
    return this.scanInterval !== null;
  }
}

// Export singleton instance
export const simulatedDiscovery = new SimulatedDiscoveryService();
