/**
 * LOUDSYNC State Types
 * Phase 1: Session Hosting & Joining Only
 * No audio, no sync, no playback
 */

// ============================================================================
// USER / LOCAL DEVICE TYPES
// ============================================================================

/**
 * Local device/user information
 * Represents the current device running the app
 */
export interface LocalDevice {
  id: string; // UUID v4 - persisted across app launches
  name: string; // User-set device name (e.g., "Alice's iPhone")
  createdAt: number; // When this device ID was first created
}

export interface UserState {
  localDevice: LocalDevice | null;
  isOnboarded: boolean; // Has user completed onboarding?
}

export interface UserActions {
  setLocalDevice: (device: LocalDevice) => void;
  updateDeviceName: (name: string) => void;
  generateDeviceId: () => void;
  setOnboarded: (value: boolean) => void;
  clearUser: () => void;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Connection lifecycle status
 * Maps to state machine in SESSION-ARCHITECTURE.md
 */
export type ConnectionStatus =
  | "idle" // Not in any session
  | "hosting" // Currently hosting a session
  | "discovering" // Scanning for available sessions
  | "joining" // Attempting to join a session
  | "connected" // Successfully joined as client
  | "disconnected"; // Lost connection (temporary state)

/**
 * Session metadata
 * Broadcast by host, received by clients
 */
export interface Session {
  id: string; // UUID v4
  name: string; // Human-readable session name
  hostId: string; // Host's device ID
  hostName: string; // Host's device name
  hostAddress: string; // "IP:PORT" for connection
  createdAt: number; // Unix timestamp (ms)
  memberCount: number; // Current number of connected members
  maxMembers: number; // Maximum allowed members
  isPasswordProtected: boolean; // Future feature flag
  version: string; // Protocol version (e.g., "1.0.0")
}

/**
 * Discovered session during scanning
 */
export interface DiscoveredSession {
  session: Session;
  signalStrength: number; // 0-100 (WiFi indicator)
  discoveredAt: number; // When we found it
  isReachable: boolean; // Can we ping it?
  lastSeen: number; // Last advertisement received
}

export interface SessionState {
  // Current lifecycle status
  status: ConnectionStatus;

  // Role in current session (null if idle)
  role: "host" | "client" | null;

  // Current session info (null if not in session)
  currentSession: Session | null;

  // Discovered sessions (populated during 'discovering' state)
  discoveredSessions: DiscoveredSession[];

  // When did we join/create this session?
  connectedAt: number | null;

  // Last error message
  error: string | null;
}

export interface SessionActions {
  // Host actions
  createSession: (name: string) => Promise<void>;
  startHosting: () => Promise<void>;
  stopHosting: () => Promise<void>;

  // Client actions
  discoverSessions: () => Promise<void>;
  stopDiscovery: () => void;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => void;

  // State setters
  setStatus: (status: ConnectionStatus) => void;
  setCurrentSession: (session: Session | null) => void;
  addDiscoveredSession: (discovered: DiscoveredSession) => void;
  clearDiscoveredSessions: () => void;
  setSessionError: (error: string | null) => void;
}

// ============================================================================
// DEVICE / MEMBER TYPES
// ============================================================================

/**
 * Connection state for a device
 */
export type DeviceConnectionStatus =
  | "connected" // Active connection
  | "disconnected" // Lost connection
  | "reconnecting" // Attempting to reconnect
  | "pending"; // Join request pending approval

/**
 * Member/Device in a session
 * Represents any device (host or client) in the session
 */
export interface Member {
  id: string; // Device UUID
  name: string; // Device name
  role: "host" | "client";
  connectionStatus: DeviceConnectionStatus;
  joinedAt: number; // Unix timestamp (ms)
  lastSeen: number; // Last heartbeat timestamp
  address: string; // IP address
  latency: number | null; // Ping latency in ms
}

export interface DeviceState {
  // All members in current session (including self)
  members: Member[];

  // Host device (null if not in session)
  host: Member | null;

  // Number of connected members
  connectedCount: number;

  // Pending join requests (host only)
  pendingRequests: Member[];
}

export interface DeviceActions {
  // Member management
  addMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  setHost: (member: Member | null) => void;
  clearMembers: () => void;

  // Join request handling (host only)
  addPendingRequest: (member: Member) => void;
  acceptRequest: (memberId: string) => Promise<void>;
  rejectRequest: (memberId: string) => Promise<void>;
  kickMember: (memberId: string) => Promise<void>;
}

export interface DeviceHelpers {
  getMember: (memberId: string) => Member | undefined;
  getAllMembers: () => Member[];
  getConnectedMembers: () => Member[];
  getClientMembers: () => Member[];
  isHost: () => boolean;
  isMemberInSession: (memberId: string) => boolean;
}

// ============================================================================
// NETWORK TYPES
// ============================================================================

/**
 * Network connection error types
 */
export type ConnectionError =
  | "network_unreachable"
  | "session_full"
  | "session_not_found"
  | "rejected_by_host"
  | "timeout"
  | "protocol_mismatch"
  | "kicked"
  | "host_disconnected"
  | "unknown";

/**
 * Network quality indicator
 */
export type NetworkQuality =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "critical";

/**
 * Network connection metrics
 */
export interface NetworkMetrics {
  latency: number | null; // Average latency in ms
  packetLoss: number; // Percentage 0-100
  lastHeartbeat: number | null; // Last heartbeat timestamp
  reconnectAttempts: number; // Number of reconnection attempts
  messagesReceived: number; // Total messages received
  messagesSent: number; // Total messages sent
}

export interface NetworkState {
  // Network availability
  isNetworkAvailable: boolean;
  networkType: "wifi" | "cellular" | "none";
  localIP: string | null;

  // Connection quality
  quality: NetworkQuality;
  metrics: NetworkMetrics;

  // Error tracking
  lastError: ConnectionError | null;
}

export interface NetworkActions {
  // Network status
  setNetworkAvailable: (available: boolean) => void;
  setNetworkType: (type: "wifi" | "cellular" | "none") => void;
  setLocalIP: (ip: string | null) => void;

  // Quality & metrics
  setNetworkQuality: (quality: NetworkQuality) => void;
  updateMetrics: (updates: Partial<NetworkMetrics>) => void;
  resetMetrics: () => void;

  // Error handling
  setNetworkError: (error: ConnectionError | null) => void;
  clearNetworkError: () => void;

  // Utilities
  checkNetwork: () => Promise<void>;
}

// ============================================================================
// COMBINED STORE TYPE
// ============================================================================

export type LoudSyncStore = UserState &
  UserActions &
  SessionState &
  SessionActions &
  DeviceState &
  DeviceActions &
  DeviceHelpers &
  NetworkState &
  NetworkActions & {
    // Global reset
    reset: () => void;
  };

// ============================================================================
// PERSISTED STATE TYPE
// ============================================================================

/**
 * Only persist essential data
 */
export interface PersistedState {
  localDevice: LocalDevice | null;
  isOnboarded: boolean;
}
