/**
 * Network Layer Types
 * Phase 1: Session Discovery Only
 */

/**
 * Discovery method used
 */
export type DiscoveryMethod = 'mdns' | 'udp' | 'manual';

/**
 * Network service info returned by mDNS
 */
export interface NetworkServiceInfo {
  name: string;
  host: string;
  port: number;
  addresses: string[];
  txt?: Record<string, string>;
}

/**
 * Session advertisement data structure
 * Sent over network during discovery
 */
export interface SessionAdvertisement {
  sessionId: string;
  sessionName: string;
  hostId: string;
  hostName: string;
  hostAddress: string;
  port: number;
  memberCount: number;
  maxMembers: number;
  isPasswordProtected: boolean;
  version: string;
  timestamp: number;
}

/**
 * Discovered session with metadata
 */
export interface DiscoveredSessionData {
  advertisement: SessionAdvertisement;
  discoveryMethod: DiscoveryMethod;
  signalStrength: number;
  lastSeen: number;
}

/**
 * Discovery options
 */
export interface DiscoveryOptions {
  /**
   * How long to scan for sessions (ms)
   * Default: 5000
   */
  timeout?: number;

  /**
   * Preferred discovery method
   * Default: 'mdns'
   */
  method?: DiscoveryMethod;

  /**
   * Use fallback methods if primary fails
   * Default: true
   */
  useFallback?: boolean;
}

/**
 * Broadcast options for host
 */
export interface BroadcastOptions {
  /**
   * Interval between broadcasts (ms)
   * Default: 3000
   */
  interval?: number;

  /**
   * UDP broadcast port
   * Default: 9876
   */
  port?: number;
}
