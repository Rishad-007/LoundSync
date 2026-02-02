/**
 * Host Broadcast Service
 * Advertises session on LAN for discovery
 */

import UDP, { type DatagramSocket } from 'react-native-udp';
import { Zeroconf } from 'react-native-zeroconf';
import type { SessionAdvertisement, BroadcastOptions } from './types';

const UDP_BROADCAST_PORT = 9876;
const BROADCAST_ADDRESS = '255.255.255.255';
const RESPONSE_PREFIX = 'LOUDSYNC_RESPONSE:';
const LOUDSYNC_SERVICE_TYPE = '_loudsync._tcp';
const LOUDSYNC_DOMAIN = '.local.';

/**
 * Host Broadcast Service
 * Advertises session so clients can discover it
 */
export class HostBroadcastService {
  private udpSocket: DatagramSocket | null = null;
  private zeroconf: Zeroconf | null = null;
  private isBroadcasting = false;
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;
  private advertisement: SessionAdvertisement | null = null;
  private localIP: string = '0.0.0.0';

  /**
   * Start broadcasting session
   */
  async startBroadcast(
    advertisement: SessionAdvertisement,
    localIP: string,
    options: BroadcastOptions = {}
  ): Promise<void> {
    if (this.isBroadcasting) {
      console.warn('[HostBroadcast] Already broadcasting');
      return;
    }

    const interval = options.interval || 3000;
    const port = options.port || UDP_BROADCAST_PORT;

    this.advertisement = advertisement;
    this.localIP = localIP;
    this.isBroadcasting = true;

    console.log(`[HostBroadcast] Starting broadcast for session: ${advertisement.sessionId}`);

    try {
      // Setup mDNS advertisement
      await this.startMDNSAdvertisement(advertisement, port);

      // Setup UDP broadcast as fallback
      this.startUDPBroadcast(advertisement, interval);
    } catch (error) {
      console.error('[HostBroadcast] Setup failed:', error);
      this.isBroadcasting = false;
      throw error;
    }
  }

  /**
   * Start mDNS service advertisement
   */
  private async startMDNSAdvertisement(
    advertisement: SessionAdvertisement,
    port: number
  ): Promise<void> {
    try {
      this.zeroconf = new Zeroconf();

      const serviceName = `loudsync-${advertisement.sessionId}`;
      const addresses = [this.localIP];

      // TXT records contain session metadata
      const txtRecord = {
        session_name: advertisement.sessionName,
        host_id: advertisement.hostId,
        host_name: advertisement.hostName,
        member_count: advertisement.memberCount.toString(),
        max_members: advertisement.maxMembers.toString(),
        password_protected: advertisement.isPasswordProtected.toString(),
        version: advertisement.version,
        timestamp: Date.now().toString(),
      };

      await this.zeroconf.registerService({
        name: serviceName,
        type: LOUDSYNC_SERVICE_TYPE,
        domain: LOUDSYNC_DOMAIN,
        protocol: 'tcp',
        port,
        addresses,
        txt: txtRecord,
      });

      console.log('[HostBroadcast] mDNS service registered');
    } catch (error) {
      console.warn('[HostBroadcast] mDNS registration failed (UDP will be used):', error);
    }
  }

  /**
   * Start UDP broadcast as fallback
   */
  private startUDPBroadcast(
    advertisement: SessionAdvertisement,
    interval: number
  ): void {
    try {
      this.udpSocket = UDP.createSocket({
        type: 'udp4',
      });

      // Listen for discovery requests
      this.udpSocket.on('message', (msg: Buffer, rinfo: any) => {
        const message = msg.toString();
        if (message === 'LOUDSYNC_DISCOVER') {
          this.sendUDPResponse(advertisement, rinfo.address);
        }
      });

this.udpSocket.on('error', (error: any) => {
        console.error('[HostBroadcast] UDP error:', error);
      });

      this.udpSocket.bind(UDP_BROADCAST_PORT, '0.0.0.0', () => {
        this.udpSocket?.setBroadcast(true);

        // Proactive broadcast every interval
        this.broadcastInterval = setInterval(() => {
          this.sendProactiveBroadcast(advertisement);
        }, interval);

        console.log('[HostBroadcast] UDP broadcast started');
      });
    } catch (error) {
      console.error('[HostBroadcast] UDP setup failed:', error);
    }
  }

  /**
   * Send response to discovery request
   */
  private sendUDPResponse(
    advertisement: SessionAdvertisement,
    targetAddress: string
  ): void {
    try {
      const message = Buffer.from(RESPONSE_PREFIX + JSON.stringify(advertisement));

      this.udpSocket?.send(
        message,
        0,
        message.length,
        UDP_BROADCAST_PORT,
        targetAddress,
        (error: any) => {
          if (error) {
            console.error('[HostBroadcast] Response send error:', error);
          }
        }
      );
    } catch (error) {
      console.error('[HostBroadcast] Error sending response:', error);
    }
  }

  /**
   * Send proactive broadcast
   */
  private sendProactiveBroadcast(advertisement: SessionAdvertisement): void {
    try {
      const message = Buffer.from(RESPONSE_PREFIX + JSON.stringify(advertisement));

      this.udpSocket?.send(
        message,
        0,
        message.length,
        UDP_BROADCAST_PORT,
        BROADCAST_ADDRESS,
        (error: any) => {
          if (error) {
            console.error('[HostBroadcast] Broadcast error:', error);
          }
        }
      );
    } catch (error) {
      console.error('[HostBroadcast] Error sending broadcast:', error);
    }
  }

  /**
   * Update session advertisement (e.g., member count changed)
   */
  updateAdvertisement(advertisement: SessionAdvertisement): void {
    this.advertisement = advertisement;
    console.log('[HostBroadcast] Advertisement updated');
  }

  /**
   * Stop broadcasting
   */
  stopBroadcast(): void {
    if (!this.isBroadcasting) return;

    console.log('[HostBroadcast] Stopping broadcast');

    if (this.broadcastInterval) clearInterval(this.broadcastInterval);

    try {
      this.udpSocket?.close();
      this.udpSocket = null;
    } catch (error) {
      console.error('[HostBroadcast] Error closing UDP:', error);
    }

    try {
      this.zeroconf?.unregisterService({
        name: `loudsync-${this.advertisement?.sessionId}`,
        type: LOUDSYNC_SERVICE_TYPE,
        domain: LOUDSYNC_DOMAIN,
      });
      this.zeroconf?.stop();
      this.zeroconf = null;
    } catch (error) {
      console.warn('[HostBroadcast] Error unregistering mDNS:', error);
    }

    this.isBroadcasting = false;
  }

  /**
   * Check if currently broadcasting
   */
  isActive(): boolean {
    return this.isBroadcasting;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopBroadcast();
  }
}

/**
 * Singleton instance
 */
export const hostBroadcastService = new HostBroadcastService();
