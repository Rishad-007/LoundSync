/**
 * Session Server Manager
 * High-level API for managing WebSocket session server
 *
 * Responsibilities:
 * - Create/destroy server
 * - Accept/reject clients based on validation rules
 * - Track connected members
 * - Broadcast member list updates
 * - Handle disconnections gracefully
 * - Integrate with Zustand state
 */

import type { ClientInfo, MemberInfo } from "./protocol";
import { sessionRegistry } from "./sessionRegistry";
import { WebSocketServer, type ServerOptions } from "./websocketServer";

/**
 * Server event callbacks
 */
export interface SessionServerCallbacks {
  onMemberJoined?: (member: MemberInfo) => void;
  onMemberLeft?: (deviceId: string, reason?: string) => void;
  onMemberListChanged?: (members: MemberInfo[]) => void;
  onServerStarted?: () => void;
  onServerStopped?: () => void;
  onServerError?: (error: Error) => void;
}

/**
 * Server creation options
 */
export interface CreateServerOptions {
  sessionId: string;
  sessionName: string;
  hostId: string;
  hostName: string;
  maxMembers?: number;
  port?: number;
}

/**
 * Session Server Manager
 * High-level abstraction over WebSocketServer
 */
export class SessionServerManager {
  private server: WebSocketServer | null = null;
  private callbacks: SessionServerCallbacks = {};
  private options: CreateServerOptions | null = null;
  private static instance: SessionServerManager | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): SessionServerManager {
    if (!SessionServerManager.instance) {
      SessionServerManager.instance = new SessionServerManager();
    }
    return SessionServerManager.instance;
  }

  /**
   * Create and start WebSocket server
   */
  async createServer(options: CreateServerOptions): Promise<void> {
    if (this.server && this.server.isActive()) {
      console.warn("[SessionServerManager] Server already running");
      throw new Error("Server already running. Stop existing server first.");
    }

    console.log("[SessionServerManager] Creating server...", options);

    this.options = options;

    // Validate session exists in registry
    const session = sessionRegistry.getSession(options.sessionId);
    if (!session) {
      throw new Error(
        `Session ${options.sessionId} not found in registry. Register session first.`,
      );
    }

    try {
      // Create WebSocket server instance
      const serverOptions: ServerOptions = {
        port: options.port || 8080,
        sessionId: options.sessionId,
        sessionName: options.sessionName,
        hostId: options.hostId,
        hostName: options.hostName,
        maxMembers: options.maxMembers || 8,
        heartbeatTimeout: 15000, // 15 seconds
      };

      this.server = new WebSocketServer(serverOptions);

      // Set up event handlers
      this.server.setHandlers({
        onClientJoined: (client) => this.handleClientJoined(client),
        onClientLeft: (deviceId, reason) =>
          this.handleClientLeft(deviceId, reason),
        onMemberListChanged: (members) => this.handleMemberListChanged(members),
      });

      // Start server
      await this.server.start();

      console.log(
        `[SessionServerManager] ✅ Server started on port ${serverOptions.port}`,
      );

      // Notify callback
      this.callbacks.onServerStarted?.();
    } catch (error) {
      console.error("[SessionServerManager] Failed to create server:", error);
      this.server = null;
      this.callbacks.onServerError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop server and disconnect all clients
   */
  async stopServer(): Promise<void> {
    if (!this.server) {
      console.warn("[SessionServerManager] No server to stop");
      return;
    }

    console.log("[SessionServerManager] Stopping server...");

    try {
      await this.server.stop();
      this.server = null;
      this.options = null;

      console.log("[SessionServerManager] ✅ Server stopped");

      // Notify callback
      this.callbacks.onServerStopped?.();
    } catch (error) {
      console.error("[SessionServerManager] Error stopping server:", error);
      this.callbacks.onServerError?.(error as Error);
      throw error;
    }
  }

  /**
   * Accept client connection
   * Returns true if accepted, false if rejected
   *
   * Validation checks:
   * 1. Session exists
   * 2. Session code valid
   * 3. Not already connected (duplicate)
   * 4. Session not full
   */
  acceptClient(deviceId: string, deviceName: string): boolean {
    if (!this.server || !this.options) {
      console.error("[SessionServerManager] Server not running");
      return false;
    }

    console.log(
      `[SessionServerManager] Evaluating client: ${deviceName} (${deviceId})`,
    );

    // Check 1: Validate session still exists
    const session = sessionRegistry.getSession(this.options.sessionId);
    if (!session) {
      console.warn(
        `[SessionServerManager] ❌ Session ${this.options.sessionId} not found`,
      );
      return false;
    }

    // Check 2: Duplicate check - already connected?
    const existingClients = this.server.getClients();
    const isDuplicate = existingClients.some((c) => c.deviceId === deviceId);
    if (isDuplicate) {
      console.warn(
        `[SessionServerManager] ❌ Client ${deviceId} already connected`,
      );
      return false;
    }

    // Check 3: Session full?
    const currentMembers = this.getMemberCount();
    const maxMembers = this.options.maxMembers || 8;
    if (currentMembers >= maxMembers) {
      console.warn(
        `[SessionServerManager] ❌ Session full (${currentMembers}/${maxMembers})`,
      );
      return false;
    }

    // All checks passed
    console.log(`[SessionServerManager] ✅ Client accepted: ${deviceId}`);
    return true;
  }

  /**
   * Register member in session registry
   * Called after client connection is accepted
   */
  registerMember(deviceId: string, deviceName: string): boolean {
    if (!this.options) {
      console.error("[SessionServerManager] No session configured");
      return false;
    }

    const success = sessionRegistry.addMember(this.options.sessionId, deviceId);

    if (success) {
      console.log(
        `[SessionServerManager] ✅ Member registered: ${deviceName} (${deviceId})`,
      );
    } else {
      console.warn(
        `[SessionServerManager] ❌ Failed to register member: ${deviceId}`,
      );
    }

    return success;
  }

  /**
   * Remove member from session
   * Called on disconnect or kick
   */
  removeMember(deviceId: string, reason?: string): void {
    if (!this.options) {
      console.error("[SessionServerManager] No session configured");
      return;
    }

    console.log(
      `[SessionServerManager] Removing member: ${deviceId}${reason ? ` (${reason})` : ""}`,
    );

    // Remove from session registry
    sessionRegistry.removeMember(this.options.sessionId, deviceId);

    console.log(`[SessionServerManager] ✅ Member removed: ${deviceId}`);
  }

  /**
   * Kick member from session
   */
  kickMember(deviceId: string, reason: string): void {
    if (!this.server) {
      console.error("[SessionServerManager] Server not running");
      return;
    }

    console.log(
      `[SessionServerManager] Kicking member: ${deviceId} - ${reason}`,
    );

    this.server.kickClient(deviceId, reason);
    this.removeMember(deviceId, reason);
  }

  /**
   * Broadcast current member list to all connected clients
   */
  broadcastMembers(): void {
    if (!this.server) {
      console.error("[SessionServerManager] Server not running");
      return;
    }

    const members = this.server.getMemberList();
    console.log(
      `[SessionServerManager] Broadcasting member list (${members.length} members)`,
    );

    // WebSocketServer handles broadcasting internally
    // This method is for explicit manual triggers if needed
  }

  /**
   * Get current members
   */
  getMembers(): MemberInfo[] {
    if (!this.server) {
      return [];
    }
    return this.server.getMemberList();
  }

  /**
   * Get member count
   */
  getMemberCount(): number {
    return this.getMembers().length;
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server?.isActive() || false;
  }

  /**
   * Get server options
   */
  getOptions(): CreateServerOptions | null {
    return this.options;
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: SessionServerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // ============================================================================
  // PRIVATE: Event Handlers
  // ============================================================================

  /**
   * Handle client joined event from WebSocketServer
   */
  private handleClientJoined(client: ClientInfo): void {
    console.log(
      `[SessionServerManager] 📥 Client joined: ${client.deviceName} (${client.deviceId})`,
    );

    // Register in session registry
    this.registerMember(client.deviceId, client.deviceName);

    // Get full member info
    const members = this.getMembers();
    const member = members.find((m) => m.id === client.deviceId);

    if (member) {
      // Notify callback
      this.callbacks.onMemberJoined?.(member);
    }
  }

  /**
   * Handle client left event from WebSocketServer
   */
  private handleClientLeft(deviceId: string, reason?: string): void {
    console.log(
      `[SessionServerManager] 📤 Client left: ${deviceId}${reason ? ` (${reason})` : ""}`,
    );

    // Remove from session registry
    this.removeMember(deviceId, reason);

    // Notify callback
    this.callbacks.onMemberLeft?.(deviceId, reason);
  }

  /**
   * Handle member list changed event from WebSocketServer
   */
  private handleMemberListChanged(members: MemberInfo[]): void {
    console.log(
      `[SessionServerManager] 👥 Member list updated: ${members.length} members`,
    );

    // Notify callback
    this.callbacks.onMemberListChanged?.(members);
  }
}

/**
 * Singleton instance export
 */
export const sessionServerManager = SessionServerManager.getInstance();
