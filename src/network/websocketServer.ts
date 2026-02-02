/**
 * WebSocket Server (Host Side)
 * Manages server-side WebSocket connections from clients
 *
 * Note: This uses Node.js 'ws' library for the server.
 * For React Native, this would run as a background service or use a native module.
 */

import {
  ErrorCode,
  MessageBuilder,
  MessageType,
  type ClientInfo,
  type HeartbeatMessage,
  type JoinMessage,
  type LeaveMessage,
  type MemberInfo,
  type ProtocolMessage,
} from "./protocol";

/**
 * Server options
 */
export interface ServerOptions {
  /**
   * Port to listen on
   * Default: 8080
   */
  port?: number;

  /**
   * Session info
   */
  sessionId: string;
  sessionName: string;
  hostId: string;
  hostName: string;

  /**
   * Max members
   * Default: 10
   */
  maxMembers?: number;

  /**
   * Heartbeat timeout (ms)
   * If no heartbeat received for this duration, client is considered disconnected
   * Default: 15000 (15 seconds)
   */
  heartbeatTimeout?: number;
}

/**
 * Connected client
 */
interface ConnectedClient {
  ws: any; // WebSocket instance
  info: ClientInfo;
  lastHeartbeat: number;
  latency: number | null;
}

/**
 * Server event handlers
 */
export interface ServerEventHandlers {
  onClientJoined?: (client: ClientInfo) => void;
  onClientLeft?: (deviceId: string, reason?: string) => void;
  onMemberListChanged?: (members: MemberInfo[]) => void;
}

/**
 * WebSocket Server Service
 * Handles host-side connections from clients
 */
export class WebSocketServer {
  private server: any | null = null; // ws.Server instance
  private clients: Map<string, ConnectedClient> = new Map();
  private options: Required<ServerOptions>;
  private handlers: ServerEventHandlers = {};
  private heartbeatCheckInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(options: ServerOptions) {
    this.options = {
      ...options,
      port: options.port || 8080,
      maxMembers: options.maxMembers || 10,
      heartbeatTimeout: options.heartbeatTimeout || 15000,
    };
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("[WebSocketServer] Server already running");
      return;
    }

    console.log(
      `[WebSocketServer] Starting server on port ${this.options.port}...`,
    );

    return new Promise((resolve, reject) => {
      try {
        // NOTE: In React Native, you would use a native module or background service
        // For now, this assumes Node.js environment for testing

        // Dynamic import for ws (would be native module in RN)
        let WebSocket;
        try {
          WebSocket = require("ws");
        } catch (e) {
          console.warn(
            "[WebSocketServer] 'ws' module not found. Starting in simulation mode.",
          );
        }

        if (WebSocket && WebSocket.Server) {
          this.server = new WebSocket.Server({ port: this.options.port });

          this.server.on("listening", () => {
            console.log(
              `[WebSocketServer] Server listening on port ${this.options.port}`,
            );
            this.isRunning = true;
            this.startHeartbeatCheck();
            resolve();
          });

          this.server.on("connection", (ws: any, req: any) => {
            const clientAddress = req.socket.remoteAddress;
            console.log(
              `[WebSocketServer] New connection from ${clientAddress}`,
            );

            this.handleConnection(ws, clientAddress);
          });

          this.server.on("error", (error: Error) => {
            console.error("[WebSocketServer] Server error:", error);
            reject(error);
          });
        } else {
          // Simulation mode for Expo Go / No Native Modules
          console.log(
            "[WebSocketServer] Simulating server start in mocked mode",
          );
          this.isRunning = true;
          this.server = {
            close: (cb: any) => cb && cb(),
            clients: new Set(),
          };
          // Simulate successful start
          setTimeout(() => {
            console.log(
              `[WebSocketServer] Mock Server 'listening' on port ${this.options.port}`,
            );
            resolve();
          }, 100);
        }
      } catch (error) {
        console.error("[WebSocketServer] Failed to start server:", error);
        reject(error);
      }
    });
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("[WebSocketServer] Stopping server...");

    // Notify all clients
    const closeMessage = MessageBuilder.sessionClosed("Host closed session");
    this.broadcast(closeMessage);

    // Close all connections
    this.clients.forEach((client) => {
      client.ws.close(1000, "Server closing");
    });
    this.clients.clear();

    // Stop heartbeat check
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }

    // Close server
    return new Promise((resolve) => {
      this.server?.close(() => {
        console.log("[WebSocketServer] Server stopped");
        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * Kick client
   */
  kickClient(deviceId: string, reason: string): void {
    const client = this.clients.get(deviceId);
    if (!client) {
      console.warn(`[WebSocketServer] Client ${deviceId} not found`);
      return;
    }

    console.log(`[WebSocketServer] Kicking ${deviceId}: ${reason}`);

    const kickMessage = MessageBuilder.kicked(reason);
    this.sendToClient(client.ws, kickMessage);

    client.ws.close(1000, reason);
    this.removeClient(deviceId, reason);
  }

  /**
   * Get all connected clients
   */
  getClients(): ClientInfo[] {
    return Array.from(this.clients.values()).map((c) => c.info);
  }

  /**
   * Get member list
   */
  getMemberList(): MemberInfo[] {
    const members: MemberInfo[] = [];

    // Add host
    members.push({
      id: this.options.hostId,
      name: this.options.hostName,
      role: "host",
      connectionStatus: "connected",
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      address: "127.0.0.1",
      latency: null,
    });

    // Add clients
    this.clients.forEach((client) => {
      members.push({
        id: client.info.deviceId,
        name: client.info.deviceName,
        role: "client",
        connectionStatus: "connected",
        joinedAt: client.info.joinedAt,
        lastSeen: client.lastHeartbeat,
        address: client.info.address || "unknown",
        latency: client.latency,
      });
    });

    return members;
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: ServerEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Check if server is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Handle new connection
   */
  private handleConnection(ws: any, address: string): void {
    let deviceId: string | null = null;

    ws.on("message", (data: string) => {
      try {
        const message: ProtocolMessage = JSON.parse(data.toString());

        switch (message.type) {
          case MessageType.JOIN:
            deviceId = this.handleJoin(ws, message as JoinMessage, address);
            break;

          case MessageType.LEAVE:
            this.handleLeave(message as LeaveMessage);
            break;

          case MessageType.HEARTBEAT:
            this.handleHeartbeat(message as HeartbeatMessage);
            break;

          case MessageType.PING:
            // Respond with PONG
            const pong = MessageBuilder.pong(message.payload.timestamp);
            this.sendToClient(ws, pong);
            break;

          default:
            console.warn(
              "[WebSocketServer] Unknown message type:",
              message.type,
            );
        }
      } catch (error) {
        console.error("[WebSocketServer] Failed to handle message:", error);
      }
    });

    ws.on("close", () => {
      if (deviceId) {
        console.log(`[WebSocketServer] Client ${deviceId} disconnected`);
        this.removeClient(deviceId, "Connection closed");
      }
    });

    ws.on("error", (error: Error) => {
      console.error("[WebSocketServer] Client error:", error);
    });
  }

  /**
   * Handle JOIN message
   */
  private handleJoin(
    ws: any,
    message: JoinMessage,
    address: string,
  ): string | null {
    const { sessionId, deviceId, deviceName, version } = message.payload;

    console.log(
      `[WebSocketServer] JOIN request from ${deviceName} (${deviceId})`,
    );

    // Validate session ID
    if (sessionId !== this.options.sessionId) {
      const error = MessageBuilder.error(
        ErrorCode.SESSION_NOT_FOUND,
        "Session not found",
      );
      this.sendToClient(ws, error);
      ws.close(1000, "Invalid session");
      return null;
    }

    // Check if already joined
    if (this.clients.has(deviceId)) {
      const error = MessageBuilder.error(
        ErrorCode.ALREADY_JOINED,
        "Already joined",
      );
      this.sendToClient(ws, error);
      ws.close(1000, "Already joined");
      return null;
    }

    // Check capacity
    if (this.clients.size >= this.options.maxMembers - 1) {
      // -1 for host
      const error = MessageBuilder.error(
        ErrorCode.SESSION_FULL,
        "Session full",
      );
      this.sendToClient(ws, error);
      ws.close(1000, "Session full");
      return null;
    }

    // Add client
    const clientInfo: ClientInfo = {
      deviceId,
      deviceName,
      joinedAt: Date.now(),
      address,
    };

    this.clients.set(deviceId, {
      ws,
      info: clientInfo,
      lastHeartbeat: Date.now(),
      latency: null,
    });

    // Send WELCOME
    const welcome = MessageBuilder.welcome(
      this.options.sessionId,
      this.options.sessionName,
      this.options.hostId,
      this.options.hostName,
      deviceId,
    );
    this.sendToClient(ws, welcome);

    // Send MEMBER_LIST to new client
    const memberList = MessageBuilder.memberList(this.getMemberList());
    this.sendToClient(ws, memberList);

    // Broadcast MEMBER_JOINED to all other clients
    const memberInfo: MemberInfo = {
      id: deviceId,
      name: deviceName,
      role: "client",
      connectionStatus: "connected",
      joinedAt: clientInfo.joinedAt,
      lastSeen: Date.now(),
      address,
      latency: null,
    };

    const joined = MessageBuilder.memberJoined(memberInfo);
    this.broadcastExcept(joined, deviceId);

    // Notify handler
    this.handlers.onClientJoined?.(clientInfo);
    this.handlers.onMemberListChanged?.(this.getMemberList());

    console.log(`[WebSocketServer] ${deviceName} joined successfully`);

    return deviceId;
  }

  /**
   * Handle LEAVE message
   */
  private handleLeave(message: LeaveMessage): void {
    const { deviceId, reason } = message.payload;
    this.removeClient(deviceId, reason);
  }

  /**
   * Handle HEARTBEAT message
   */
  private handleHeartbeat(message: HeartbeatMessage): void {
    const { deviceId } = message.payload;
    const client = this.clients.get(deviceId);

    if (client) {
      client.lastHeartbeat = Date.now();
    }
  }

  /**
   * Remove client
   */
  private removeClient(deviceId: string, reason?: string): void {
    const client = this.clients.get(deviceId);
    if (!client) return;

    console.log(
      `[WebSocketServer] Removing ${deviceId}: ${reason || "unknown"}`,
    );

    this.clients.delete(deviceId);

    // Broadcast MEMBER_LEFT to all clients
    const left = MessageBuilder.memberLeft(
      deviceId,
      client.info.deviceName,
      reason,
    );
    this.broadcast(left);

    // Notify handlers
    this.handlers.onClientLeft?.(deviceId, reason);
    this.handlers.onMemberListChanged?.(this.getMemberList());
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: any, message: ProtocolMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocketServer] Failed to send to client:", error);
    }
  }

  /**
   * Broadcast message to all clients
   */
  private broadcast(message: ProtocolMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      try {
        client.ws.send(data);
      } catch (error) {
        console.error("[WebSocketServer] Failed to broadcast:", error);
      }
    });
  }

  /**
   * Broadcast to all except one
   */
  private broadcastExcept(
    message: ProtocolMessage,
    exceptDeviceId: string,
  ): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client, deviceId) => {
      if (deviceId !== exceptDeviceId) {
        try {
          client.ws.send(data);
        } catch (error) {
          console.error("[WebSocketServer] Failed to broadcast:", error);
        }
      }
    });
  }

  /**
   * Start heartbeat check
   * Removes clients that haven't sent heartbeat in timeout period
   */
  private startHeartbeatCheck(): void {
    this.heartbeatCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.options.heartbeatTimeout;

      this.clients.forEach((client, deviceId) => {
        if (now - client.lastHeartbeat > timeout) {
          console.log(`[WebSocketServer] ${deviceId} heartbeat timeout`);
          this.removeClient(deviceId, "Heartbeat timeout");
          client.ws.close(1000, "Timeout");
        }
      });
    }, 5000); // Check every 5 seconds
  }
}
