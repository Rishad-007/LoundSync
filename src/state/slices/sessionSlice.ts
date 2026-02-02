/**
 * Session Slice - Phase 1
 * Manages session lifecycle (create, host, discover, join, leave)
 * Integrated with mDNS + UDP discovery
 */

import { StateCreator } from "zustand";
import type {
  ConnectionStatus,
  DiscoveredSession,
  LoudSyncStore,
  Session,
  SessionActions,
  SessionState,
} from "../types";
import { discoveryManager, hostBroadcastService } from "../../network";
import type { SessionAdvertisement } from "../../network/types";

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
   * Calls network layer to start mDNS + UDP broadcasts
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
   * Stops network broadcasts and disconnects all clients
   */
  stopHosting: async () => {
    try {
      console.log("[SessionSlice] Stopping host...");

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
        method: 'mdns',
        useFallback: true,
      });

      console.log(`[SessionSlice] Discovered ${get().discoveredSessions.length} sessions`);
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
   * Connects to host via TCP (planned for Phase 1.2)
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

      // Simulate connection delay (in Phase 1.2, this will be real TCP connection)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      set({
        status: "connected",
        role: "client",
        currentSession: discovered.session,
        connectedAt: Date.now(),
        discoveredSessions: [], // Clear discovery list
      });

      // Add self as member
      get().addMember({
        id: localDevice.id,
        name: localDevice.name,
        role: "client",
        connectionStatus: "connected",
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        address: "192.168.1.50", // TODO: Get local IP from network utils
        latency: Math.floor(Math.random() * 50) + 10, // 10-60ms
      });

      // Add host as member
      get().addMember({
        id: discovered.session.hostId,
        name: discovered.session.hostName,
        role: "host",
        connectionStatus: "connected",
        joinedAt: discovered.session.createdAt,
        lastSeen: Date.now(),
        address: discovered.session.hostAddress.split(":")[0],
        latency: null,
      });

      get().setHost({
        id: discovered.session.hostId,
        name: discovered.session.hostName,
        role: "host",
        connectionStatus: "connected",
        joinedAt: discovered.session.createdAt,
        lastSeen: Date.now(),
        address: discovered.session.hostAddress.split(":")[0],
        latency: null,
      });

      console.log("[SessionSlice] Successfully joined session");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      set({ error: message, status: "idle" });
      console.error("[SessionSlice] Failed to join session:", message);
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
      // Client leaving = disconnect
      // TODO: Notify host we're leaving
      // NetworkLayer.disconnect();

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
