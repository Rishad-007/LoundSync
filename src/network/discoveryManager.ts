/**
 * Discovery Manager
 * Orchestrates mDNS + UDP with deduplication, timeout, and expiry handling
 */

import { mdnsService } from "./mdnsDiscovery";
import type { DiscoveredSessionData, DiscoveryOptions } from "./types";
import { udpService } from "./udpDiscovery";

/**
 * Session with expiry tracking
 */
interface CachedSession {
  data: DiscoveredSessionData;
  expiresAt: number;
}

/**
 * Discovery Manager
 * Manages both mDNS and UDP discovery with deduplication and expiry
 */
export class DiscoveryManager {
  private sessions: Map<string, CachedSession> = new Map();
  private isScanning = false;
  private expiryInterval: ReturnType<typeof setInterval> | null = null;
  private sessionExpiryMs = 15000; // Sessions expire after 15 seconds of no updates
  private listeners: Array<{
    onFound: (session: DiscoveredSessionData) => void;
    onLost: (sessionId: string) => void;
  }> = [];

  /**
   * Start discovery with optional fallback
   */
  async startDiscovery(options: DiscoveryOptions = {}): Promise<void> {
    if (this.isScanning) {
      console.warn("[DiscoveryManager] Scan already in progress");
      return;
    }

    this.isScanning = true;
    this.sessions.clear();
    this.startExpiryCheck();

    console.log("[DiscoveryManager] Starting discovery...");

    const method = options.method || "mdns";
    const useFallback = options.useFallback !== false;

    try {
      if (method === "mdns") {
        await this.runMDNSDiscovery(options);
      } else if (method === "udp") {
        await this.runUDPDiscovery(options);
      } else {
        // Default: try mDNS first, fall back to UDP
        try {
          await this.runMDNSDiscovery(options);
        } catch (error) {
          if (useFallback) {
            console.log("[DiscoveryManager] mDNS failed, trying UDP fallback");
            await this.runUDPDiscovery(options);
          } else {
            throw error;
          }
        }
      }

      console.log(
        `[DiscoveryManager] Discovery complete. Found ${this.sessions.size} sessions`,
      );
    } catch (error) {
      console.error("[DiscoveryManager] Discovery failed:", error);
      this.isScanning = false;
      this.stopExpiryCheck();

      // Don't throw if it's just a native module issue - UDP will be used as fallback
      if (useFallback && method !== "udp") {
        console.log("[DiscoveryManager] Attempting UDP fallback...");
        try {
          await this.runUDPDiscovery(options);
        } catch (udpError) {
          console.error(
            "[DiscoveryManager] UDP fallback also failed:",
            udpError,
          );
        }
      }
    }
  }

  /**
   * Run mDNS discovery
   */
  private async runMDNSDiscovery(options: DiscoveryOptions): Promise<void> {
    await mdnsService.startScan(
      (session) => this.addSession(session),
      (sessionId) => this.removeSession(sessionId),
      options,
    );
  }

  /**
   * Run UDP discovery
   */
  private async runUDPDiscovery(options: DiscoveryOptions): Promise<void> {
    await udpService.startScan(
      (session) => this.addSession(session),
      (sessionId) => this.removeSession(sessionId),
      options,
    );
  }

  /**
   * Add or update discovered session
   */
  private addSession(data: DiscoveredSessionData): void {
    const sessionId = data.advertisement.sessionId;

    // Deduplicate: if we've seen this session, update timestamp only
    if (this.sessions.has(sessionId)) {
      const cached = this.sessions.get(sessionId)!;
      cached.data.lastSeen = data.lastSeen;
      cached.expiresAt = Date.now() + this.sessionExpiryMs;

      // Update signal strength if this method is more reliable
      if (
        data.discoveryMethod === "mdns" &&
        cached.data.discoveryMethod === "udp"
      ) {
        cached.data.discoveryMethod = "mdns";
        cached.data.signalStrength = 100;
      }

      return;
    }

    // New session
    console.log(
      `[DiscoveryManager] New session: ${sessionId} (${data.advertisement.sessionName})`,
    );

    this.sessions.set(sessionId, {
      data,
      expiresAt: Date.now() + this.sessionExpiryMs,
    });

    // Notify listeners
    this.listeners.forEach((listener) => listener.onFound(data));
  }

  /**
   * Remove session
   */
  private removeSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      console.log(`[DiscoveryManager] Session removed: ${sessionId}`);
      this.sessions.delete(sessionId);

      // Notify listeners
      this.listeners.forEach((listener) => listener.onLost(sessionId));
    }
  }

  /**
   * Check for expired sessions periodically
   */
  private startExpiryCheck(): void {
    this.expiryInterval = setInterval(() => {
      const now = Date.now();
      const expiredIds: string[] = [];

      this.sessions.forEach((cached, sessionId) => {
        if (now > cached.expiresAt) {
          expiredIds.push(sessionId);
        }
      });

      expiredIds.forEach((sessionId) => {
        console.log(`[DiscoveryManager] Session expired: ${sessionId}`);
        this.removeSession(sessionId);
      });
    }, 1000); // Check every second
  }

  /**
   * Stop expiry check
   */
  private stopExpiryCheck(): void {
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
  }

  /**
   * Stop discovery
   */
  stopDiscovery(): void {
    if (!this.isScanning) return;

    console.log("[DiscoveryManager] Stopping discovery");

    mdnsService.stopScan();
    udpService.stopScan();
    this.stopExpiryCheck();

    this.isScanning = false;
  }

  /**
   * Get all currently discovered sessions
   */
  getDiscoveredSessions(): DiscoveredSessionData[] {
    return Array.from(this.sessions.values()).map((cached) => cached.data);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): DiscoveredSessionData | undefined {
    return this.sessions.get(sessionId)?.data;
  }

  /**
   * Subscribe to discovery events
   */
  subscribe(
    onFound: (session: DiscoveredSessionData) => void,
    onLost: (sessionId: string) => void,
  ): () => void {
    const listener = { onFound, onLost };
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Check if scanning
   */
  isActive(): boolean {
    return this.isScanning;
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Set session expiry time
   */
  setSessionExpiry(ms: number): void {
    this.sessionExpiryMs = ms;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopDiscovery();
    mdnsService.destroy();
    udpService.destroy();
  }
}

/**
 * Singleton instance
 */
export const discoveryManager = new DiscoveryManager();
