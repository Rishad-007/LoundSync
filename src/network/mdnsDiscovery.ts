/**
 * mDNS Discovery Service
 * Primary discovery method using Zeroconf
 */

import { Zeroconf } from 'react-native-zeroconf';
import type { DiscoveredSessionData, SessionAdvertisement, DiscoveryOptions } from './types';

const LOUDSYNC_SERVICE_TYPE = '_loudsync._tcp';
const LOUDSYNC_DOMAIN = '.local.';

/**
 * mDNS Discovery Service
 * Uses Zeroconf for automatic service discovery
 */
export class MDNSDiscoveryService {
  private zeroconf: Zeroconf;
  private isScanning = false;
  private sessions: Map<string, DiscoveredSessionData> = new Map();
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.zeroconf = new Zeroconf();
  }

  /**
   * Start scanning for LOUDSYNC sessions
   * Returns discovered sessions as they're found
   */
  async startScan(
    onSessionFound: (session: DiscoveredSessionData) => void,
    onSessionLost: (sessionId: string) => void,
    options: DiscoveryOptions = {}
  ): Promise<void> {
    if (this.isScanning) {
      console.warn('[mDNS] Scan already in progress');
      return;
    }

    const timeout = options.timeout || 5000;
    this.isScanning = true;
    this.sessions.clear();

    console.log('[mDNS] Starting scan for LOUDSYNC sessions...');

    return new Promise((resolve, reject) => {
      try {
        // Listen for services found
        this.zeroconf.on('found', (key: string, result: any) => {
          this.handleServiceFound(result, onSessionFound);
        });

        // Listen for services lost
        this.zeroconf.on('lost', (key: string, result: any) => {
          const sessionId = this.extractSessionId(result.name);
          console.log(`[mDNS] Session lost: ${sessionId}`);
          this.sessions.delete(sessionId);
          onSessionLost(sessionId);
        });

        // Start scan
        this.zeroconf.scan(LOUDSYNC_SERVICE_TYPE, LOUDSYNC_DOMAIN, 5000);

        // Auto-stop after timeout
        this.scanTimeout = setTimeout(() => {
          this.stopScan();
          resolve();
        }, timeout);
      } catch (error) {
        console.error('[mDNS] Scan failed:', error);
        this.isScanning = false;
        reject(error);
      }
    });
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    if (!this.isScanning) return;

    console.log('[mDNS] Stopping scan');
    if (this.scanTimeout) clearTimeout(this.scanTimeout);

    try {
      this.zeroconf.stop();
      this.isScanning = false;
    } catch (error) {
      console.error('[mDNS] Failed to stop scan:', error);
    }
  }

  /**
   * Handle discovered service
   */
  private handleServiceFound(
    result: any,
    onSessionFound: (session: DiscoveredSessionData) => void
  ): void {
    try {
      const sessionId = this.extractSessionId(result.name);
      const hostAddress = result.addresses?.[0] || result.host;

      if (!hostAddress) {
        console.warn('[mDNS] No address found for service');
        return;
      }

      // Parse TXT records to get session advertisement
      const advertisement = this.parseTxtRecords(
        result.txt || {},
        sessionId,
        hostAddress,
        result.port
      );

      const discoveredSession: DiscoveredSessionData = {
        advertisement,
        discoveryMethod: 'mdns',
        signalStrength: 100, // mDNS is reliable, assume 100%
        lastSeen: Date.now(),
      };

      console.log(`[mDNS] Found session: ${sessionId}`);
      this.sessions.set(sessionId, discoveredSession);
      onSessionFound(discoveredSession);
    } catch (error) {
      console.error('[mDNS] Error handling found service:', error);
    }
  }

  /**
   * Extract session ID from mDNS service name
   * Format: loudsync-{sessionId}.{serviceType}
   */
  private extractSessionId(serviceName: string): string {
    const match = serviceName.match(/loudsync-([a-z0-9]+)/i);
    return match ? match[1] : serviceName;
  }

  /**
   * Parse TXT records into session advertisement
   */
  private parseTxtRecords(
    txt: Record<string, string>,
    sessionId: string,
    hostAddress: string,
    port: number
  ): SessionAdvertisement {
    return {
      sessionId,
      sessionName: txt['session_name'] || 'Unknown Session',
      hostId: txt['host_id'] || 'unknown',
      hostName: txt['host_name'] || 'Unknown Host',
      hostAddress,
      port,
      memberCount: parseInt(txt['member_count'] || '1', 10),
      maxMembers: parseInt(txt['max_members'] || '8', 10),
      isPasswordProtected: txt['password_protected'] === 'true',
      version: txt['version'] || '1.0.0',
      timestamp: parseInt(txt['timestamp'] || Date.now().toString(), 10),
    };
  }

  /**
   * Get all currently discovered sessions
   */
  getDiscoveredSessions(): DiscoveredSessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Check if still scanning
   */
  isActive(): boolean {
    return this.isScanning;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopScan();
    try {
      this.zeroconf.stop();
    } catch (error) {
      console.error('[mDNS] Error destroying:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const mdnsService = new MDNSDiscoveryService();
