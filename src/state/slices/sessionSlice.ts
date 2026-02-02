/**
 * Session Slice - Phase 1
 * Manages session lifecycle (create, host, discover, join, leave)
 * Integrated with mDNS + UDP discovery
 */

import { StateCreator } from "zustand";
import { discoveryManager, hostBroadcastService } from "../../network";
import type { MemberInfo } from "../../network/protocol";
import type { SessionAdvertisement } from "../../network/types";
import { WebSocketService } from "../../network/websocketClient";
import { WebSocketServer } from "../../network/websocketServer";
import type {
  ConnectionStatus,
  DiscoveredSession,
  LoudSyncStore,
  Session,
  SessionActions,
  SessionState,
} from "../types";

// Singleton instances for connection management
let wsClient: WebSocketService | null = null;
let wsServer: WebSocketServer | null = null;

export type SessionSlice = SessionState & SessionActions;

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Mock discovered sessions for testing
 */
const MOCK_SESSIONS: Session[] = [
  {
    id: "mock-session-1",
    name: "Alice's Party 🎉",
    hostId: "device-alice-123",
    hostName: "Alice's iPhone",
    hostAddress: "192.168.1.100:8080",
    createdAt: Date.now() - 300000, // 5 mins ago
    memberCount: 3,
    maxMembers: 10,
    isPasswordProtected: false,
    version: "1.0.0",
  },
  {
    id: "mock-session-2",
    name: "Bob's Jam Session",
    hostId: "device-bob-456",
    hostName: "Bob's Android",
    hostAddress: "192.168.1.101:8080",
    createdAt: Date.now() - 120000, // 2 mins ago
    memberCount: 1,
    maxMembers: 5,
    isPasswordProtected: false,
    version: "1.0.0",
  },
];

export const createSessionSlice: StateCreator<
  LoudSyncStore,
  [],
  [],
  SessionSlice
> = (set, get) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================
  status: "idle",
  role: null,
  currentSession: null,
  discoveredSessions: [],
  connectedAt: null,
  error: null,

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Create a new session (Step 1: Create session object)
   * In real implementation, this would initialize session metadata
   */
  createSession: async (name: string) => {
    try {
      const localDevice = get().localDevice;
      if (!localDevice) {
        throw new Error(
          "No local device set. Please complete onboarding first.",
        );
      }

      console.log("[SessionSlice] Creating session:", name);

      const session: Session = {
        id: generateSessionId(),
        name,
        hostId: localDevice.id,
        hostName: localDevice.name,
        hostAddress: "0.0.0.0:8080", // Will be set by network layer
        createdAt: Date.now(),
        memberCount: 1,
        maxMembers: 10,
        isPasswordProtected: false,
        version: "1.0.0",
      };

      set({
        currentSession: session,
        status: "idle", // Session created but not broadcasting yet
        role: "host",
        connectedAt: Date.now(),
        error: null,
      });

      console.log("[SessionSlice] Session created:", session.id);

      // Add self as first member
      get().addMember({
        id: localDevice.id,
        name: localDevice.name,
        role: "host",
        connectionStatus: "connected",
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        address: "127.0.0.1",
        latency: 0,
      });

      get().setHost({
        id: localDevice.id,
        name: localDevice.name,
        role: "host",
        connectionStatus: "connected",
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        address: "127.0.0.1",
        latency: 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      set({ error: message, status: "idle" });
      console.error("[SessionSlice] Failed to create session:", message);
      throw error;
    }
  },

  /**
   * Start hosting (Step 2: Begin broadcasting session)
   * Starts mDNS + UDP broadcasts AND WebSocket server
   */
  startHosting: async () => {
    try {
      const session = get().currentSession;
      const localDevice = get().localDevice;

      if (!session) {
        throw new Error("No session to host. Call createSession first.");
      }

      if (!localDevice) {
        throw new Error("No local device set");
      }

      if (get().role !== "host") {
        throw new Error("Only hosts can start hosting");
      }

      console.log("[SessionSlice] Starting to host session:", session.name);

      // Create session advertisement for network layer
      const advertisement: SessionAdvertisement = {
        sessionId: session.id,
        sessionName: session.name,
        hostId: localDevice.id,
        hostName: localDevice.name,
        hostAddress: "192.168.1.100", // TODO: Get local IP from network utils
        port: 8080,
        memberCount: get().members.length,
        maxMembers: session.maxMembers,
        isPasswordProtected: session.isPasswordProtected,
        version: session.version,
        timestamp: Date.now(),
      };

      // Start network broadcasts (mDNS + UDP)
      await hostBroadcastService.startBroadcast(advertisement, "192.168.1.100");

      // Start WebSocket server for client connections
      wsServer = new WebSocketServer({
        port: 8080,
        sessionId: session.id,
        sessionName: session.name,
        hostId: localDevice.id,
        hostName: localDevice.name,
        maxMembers: session.maxMembers,
      });

      // Setup server event handlers
      wsServer.setHandlers({
        onClientJoined: (client) => {
          console.log("[SessionSlice] Client joined:", client.deviceName);

          // Add client to member list
          get().addMember({
            id: client.deviceId,
            name: client.deviceName,
            role: "client",
            connectionStatus: "connected",
            joinedAt: client.joinedAt,
            lastSeen: Date.now(),
            address: client.address || "unknown",
            latency: null,
          });
        },
        onClientLeft: (deviceId, reason) => {
          console.log("[SessionSlice] Client left:", deviceId, reason);
          get().removeMember(deviceId);
        },
        onMemberListChanged: (members) => {
          console.log("[SessionSlice] Member list updated:", members.length);
          // Update session member count
          if (get().currentSession) {
            get().setCurrentSession({
              ...get().currentSession!,
              memberCount: members.length,
            });
          }
        },
      });

      await wsServer.start();

      set({
        status: "hosting",
        error: null,
      });

      console.log("[SessionSlice] Now hosting session:", session.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      set({ error: message });
      console.error("[SessionSlice] Failed to start hosting:", message);
      throw error;
    }
  },

  /**
   * Stop hosting and close session
   * Stops network broadcasts AND WebSocket server
   */
  stopHosting: async () => {
    try {
      console.log("[SessionSlice] Stopping host...");

      // Stop WebSocket server
      if (wsServer) {
        await wsServer.stop();
        wsServer = null;
      }

      // Stop network broadcasts
      hostBroadcastService.stopBroadcast();

      set({
        status: "idle",
        role: null,
        currentSession: null,
        connectedAt: null,
        error: null,
      });

      get().clearMembers();

      console.log("[SessionSlice] Hosting stopped");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[SessionSlice] Error stopping host:", message);
      throw error;
    }
  },

  /**
   * Discover available sessions on the network
   * Uses mDNS with UDP fallback
   */
  discoverSessions: async () => {
    try {
      console.log("[SessionSlice] Starting discovery...");

      set({
        status: "discovering",
        discoveredSessions: [],
        error: null,
      });

      // Use discovery manager to scan for sessions
      discoveryManager.subscribe(
        (session) => {
          // Map network discovery to state
          const discovered: DiscoveredSession = {
            session: {
              id: session.advertisement.sessionId,
              name: session.advertisement.sessionName,
              hostId: session.advertisement.hostId,
              hostName: session.advertisement.hostName,
              hostAddress: `${session.advertisement.hostAddress}:${session.advertisement.port}`,
              createdAt: session.advertisement.timestamp,
              memberCount: session.advertisement.memberCount,
              maxMembers: session.advertisement.maxMembers,
              isPasswordProtected: session.advertisement.isPasswordProtected,
              version: session.advertisement.version,
            },
            signalStrength: session.signalStrength,
            discoveredAt: session.lastSeen,
            isReachable: true,
            lastSeen: session.lastSeen,
          };

          get().addDiscoveredSession(discovered);
        },
        (sessionId) => {
          // Session disappeared
          set((state) => ({
            discoveredSessions: state.discoveredSessions.filter(
              (d) => d.session.id !== sessionId,
            ),
          }));
        },
      );

      // Start discovery with timeout
      await discoveryManager.startDiscovery({
        timeout: 5000,
        method: "mdns",
        useFallback: true,
      });

      console.log(
        `[SessionSlice] Discovered ${get().discoveredSessions.length} sessions`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      set({ error: message, status: "idle" });
      console.error("[SessionSlice] Discovery failed:", message);
    }
  },

  /**
   * Stop discovering sessions
   */
  stopDiscovery: () => {
    console.log("[SessionSlice] Stopping discovery");

    discoveryManager.stopDiscovery();

    set({
      status: "idle",
      discoveredSessions: [],
    });
  },

  /**
   * Join a discovered session
   * Connects to host via WebSocket
   */
  joinSession: async (sessionId: string) => {
    try {
      const localDevice = get().localDevice;
      if (!localDevice) {
        throw new Error("No local device set");
      }

      const discovered = get().discoveredSessions.find(
        (d) => d.session.id === sessionId,
      );

      if (!discovered) {
        throw new Error("Session not found");
      }

      console.log("[SessionSlice] Joining session:", discovered.session.name);

      set({
        status: "joining",
        error: null,
      });

      // Extract host IP and port from hostAddress (format: "IP:PORT")
      const [hostIP, portStr] = discovered.session.hostAddress.split(":");
      const port = parseInt(portStr, 10) || 8080;

      // Create WebSocket client
      wsClient = new WebSocketService({
        host: `${hostIP}:${port}`,
        sessionId,
        deviceId: localDevice.id,
        deviceName: localDevice.name,
      });

      // Setup message handlers
      wsClient.setHandlers({
        onWelcome: (message) => {
          console.log("[SessionSlice] Received WELCOME");

          set({
            status: "connected",
            role: "client",
            currentSession: discovered.session,
            connectedAt: message.payload.connectedAt,
            discoveredSessions: [],
          });

          // Add self as member
          get().addMember({
            id: localDevice.id,
            name: localDevice.name,
            role: "client",
            connectionStatus: "connected",
            joinedAt: Date.now(),
            lastSeen: Date.now(),
            address: hostIP,
            latency: wsClient?.getLatency() || null,
          });
        },
        onMemberList: (message) => {
          console.log(
            "[SessionSlice] Received MEMBER_LIST:",
            message.payload.totalCount,
          );

          // Clear and rebuild member list
          get().clearMembers();

          message.payload.members.forEach((member: MemberInfo) => {
            get().addMember({
              id: member.id,
              name: member.name,
              role: member.role,
              connectionStatus: member.connectionStatus,
              joinedAt: member.joinedAt,
              lastSeen: member.lastSeen,
              address: member.address,
              latency: member.latency,
            });

            // Set host
            if (member.role === "host") {
              get().setHost({
                id: member.id,
                name: member.name,
                role: "host",
                connectionStatus: member.connectionStatus,
                joinedAt: member.joinedAt,
                lastSeen: member.lastSeen,
                address: member.address,
                latency: null,
              });
            }
          });
        },
        onMemberJoined: (message) => {
          console.log(
            "[SessionSlice] Member joined:",
            message.payload.member.name,
          );
          const member = message.payload.member;

          get().addMember({
            id: member.id,
            name: member.name,
            role: member.role,
            connectionStatus: member.connectionStatus,
            joinedAt: member.joinedAt,
            lastSeen: member.lastSeen,
            address: member.address,
            latency: member.latency,
          });
        },
        onMemberLeft: (message) => {
          console.log("[SessionSlice] Member left:", message.payload.deviceId);
          get().removeMember(message.payload.deviceId);
        },
        onKicked: (message) => {
          console.log("[SessionSlice] Kicked:", message.payload.reason);
          set({
            error: `Kicked: ${message.payload.reason}`,
            status: "idle",
            role: null,
            currentSession: null,
          });
          get().clearMembers();
        },
        onSessionClosed: (message) => {
          console.log("[SessionSlice] Session closed:", message.payload.reason);
          set({
            error: `Session closed: ${message.payload.reason}`,
            status: "idle",
            role: null,
            currentSession: null,
          });
          get().clearMembers();
        },
        onError: (message) => {
          console.error(
            "[SessionSlice] Error from host:",
            message.payload.message,
          );
          set({
            error: message.payload.message,
            status: "idle",
          });
        },
      });

      // Connect to host
      await wsClient.connectToHost();

      console.log("[SessionSlice] Successfully connected to host");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      set({ error: message, status: "idle" });
      console.error("[SessionSlice] Failed to join session:", message);

      // Cleanup on failure
      if (wsClient) {
        wsClient.disconnect();
        wsClient = null;
      }

      throw error;
    }
  },

  /**
   * Leave current session
   * Works for both host and client
   */
  leaveSession: () => {
    const role = get().role;

    console.log(`[SessionSlice] Leaving session as ${role}`);

    if (role === "host") {
      // Host leaving = stop hosting
      get().stopHosting();
    } else {
      // Client leaving = disconnect WebSocket
      if (wsClient) {
        wsClient.disconnect("User left session");
        wsClient = null;
      }

      set({
        status: "idle",
        role: null,
        currentSession: null,
        connectedAt: null,
        error: null,
      });

      get().clearMembers();
    }

    console.log("[SessionSlice] Left session");
  },

  /**
   * Set connection status manually
   */
  setStatus: (status: ConnectionStatus) => {
    set({ status });
  },

  /**
   * Set current session manually
   */
  setCurrentSession: (session: Session | null) => {
    set({ currentSession: session });
  },

  /**
   * Add a discovered session to the list
   * Called by network layer when a session is found
   */
  addDiscoveredSession: (discovered: DiscoveredSession) => {
    set((state) => {
      // Check if already exists
      const exists = state.discoveredSessions.some(
        (d) => d.session.id === discovered.session.id,
      );

      if (exists) {
        // Update existing
        return {
          discoveredSessions: state.discoveredSessions.map((d) =>
            d.session.id === discovered.session.id ? discovered : d,
          ),
        };
      }

      // Add new
      return {
        discoveredSessions: [...state.discoveredSessions, discovered],
      };
    });
  },

  /**
   * Clear all discovered sessions
   */
  clearDiscoveredSessions: () => {
    set({ discoveredSessions: [] });
  },

  /**
   * Set error message
   */
  setSessionError: (error: string | null) => {
    set({ error });
  },
});
