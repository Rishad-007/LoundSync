/**
 * UDP Broadcast Discovery (Fallback)
 * Works when mDNS is unavailable
 */

import UDP, { type DatagramSocket } from 'react-native-udp';
import type { DiscoveredSessionData, SessionAdvertisement, DiscoveryOptions } from './types';

const UDP_BROADCAST_PORT = 9876;
const BROADCAST_ADDRESS = '255.255.255.255';
const DISCOVERY_MESSAGE = 'LOUDSYNC_DISCOVER';
const RESPONSE_PREFIX = 'LOUDSYNC_RESPONSE:';

/**
 * UDP Broadcast Discovery Service
 * Fallback when mDNS unavailable
 */
export class UDPDiscoveryService {
  private socket: DatagramSocket | null = null;
  private isScanning = false;
  private sessions: Map<string, DiscoveredSessionData> = new Map();
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start scanning via UDP broadcast
   */
  async startScan(
    onSessionFound: (session: DiscoveredSessionData) => void,
    onSessionLost: (sessionId: string) => void,
    options: DiscoveryOptions = {}
  ): Promise<void> {
    if (this.isScanning) {
      console.warn('[UDP] Scan already in progress');
      return;
    }

    const timeout = options.timeout || 5000;
    this.isScanning = true;
    this.sessions.clear();

    console.log('[UDP] Starting UDP broadcast discovery...');

    return new Promise((resolve, reject) => {
      try {
        // Create UDP socket
        this.socket = UDP.createSocket({
          type: 'udp4',
        });

        // Listen for responses
        this.socket.on('message', (msg: Buffer, rinfo: any) => {
          this.handleBroadcastResponse(
            msg.toString(),
            rinfo.address,
            onSessionFound
          );
        });

        this.socket.on('error', (error: any) => {
          console.error('[UDP] Socket error:', error);
        });

        this.socket.bind(UDP_BROADCAST_PORT, '0.0.0.0', () => {
          // Enable broadcast
          this.socket?.setBroadcast(true);

          // Send discovery requests periodically
          this.broadcastInterval = setInterval(() => {
            this.sendDiscoveryBroadcast();
          }, 500);
        });

        // Auto-stop after timeout
        this.scanTimeout = setTimeout(() => {
          this.stopScan();
          resolve();
        }, timeout);
      } catch (error) {
        console.error('[UDP] Scan setup failed:', error);
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

    console.log('[UDP] Stopping UDP discovery');

    if (this.broadcastInterval) clearInterval(this.broadcastInterval);
    if (this.scanTimeout) clearTimeout(this.scanTimeout);

    try {
      this.socket?.close();
      this.socket = null;
      this.isScanning = false;
    } catch (error) {
      console.error('[UDP] Error stopping scan:', error);
    }
  }

  /**
   * Send discovery broadcast
   */
  private sendDiscoveryBroadcast(): void {
    try {
      const message = Buffer.from(DISCOVERY_MESSAGE);
      this.socket?.send(
        message,
        0,
        message.length,
        UDP_BROADCAST_PORT,
        BROADCAST_ADDRESS,
        (error: any) => {
          if (error) {
            console.error('[UDP] Broadcast send error:', error);
          }
        }
      );
    } catch (error) {
      console.error('[UDP] Error sending broadcast:', error);
    }
  }

  /**
   * Handle broadcast response from host
   */
  private handleBroadcastResponse(
    message: string,
    fromAddress: string,
    onSessionFound: (session: DiscoveredSessionData) => void
  ): void {
    try {
      if (!message.startsWith(RESPONSE_PREFIX)) return;

      const jsonStr = message.substring(RESPONSE_PREFIX.length);
      const advertisement = JSON.parse(jsonStr) as SessionAdvertisement;

      // Ignore self-responses
      if (advertisement.hostAddress === fromAddress) {
        return;
      }

      const discoveredSession: DiscoveredSessionData = {
        advertisement,
        discoveryMethod: 'udp',
        signalStrength: 75, // UDP is less reliable than mDNS
        lastSeen: Date.now(),
      };

      const sessionId = advertisement.sessionId;

      // Check if we've seen this session before
      if (!this.sessions.has(sessionId)) {
        console.log(
          `[UDP] Found new session: ${sessionId} from ${fromAddress}`
        );
        onSessionFound(discoveredSession);
      }

      this.sessions.set(sessionId, discoveredSession);
    } catch (error) {
      console.error('[UDP] Error parsing broadcast response:', error);
    }
  }

  /**
   * Get all discovered sessions
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
  }
}

/**
 * Singleton instance
 */
export const udpService = new UDPDiscoveryService();
