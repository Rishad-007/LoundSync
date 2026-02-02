/**
 * WebSocket Client Service
 * Manages client-side WebSocket connection to host
 */

import {
  ConnectionState,
  MessageBuilder,
  MessageType,
  type ErrorMessage,
  type KickedMessage,
  type MemberJoinedMessage,
  type MemberLeftMessage,
  type MemberListMessage,
  type ProtocolMessage,
  type SessionClosedMessage,
  type WelcomeMessage,
} from "./protocol";

/**
 * Connection options
 */
export interface ConnectionOptions {
  /**
   * Host address (IP:Port)
   */
  host: string;

  /**
   * Session ID to join
   */
  sessionId: string;

  /**
   * Device info
   */
  deviceId: string;
  deviceName: string;

  /**
   * Heartbeat interval (ms)
   * Default: 5000 (5 seconds)
   */
  heartbeatInterval?: number;

  /**
   * Connection timeout (ms)
   * Default: 10000 (10 seconds)
   */
  connectionTimeout?: number;

  /**
   * Reconnect attempts
   * Default: 3
   */
  maxReconnectAttempts?: number;

  /**
   * Reconnect delay (ms)
   * Default: 2000
   */
  reconnectDelay?: number;
}

/**
 * Message handlers
 */
export interface MessageHandlers {
  onWelcome?: (message: WelcomeMessage) => void;
  onMemberList?: (message: MemberListMessage) => void;
  onMemberJoined?: (message: MemberJoinedMessage) => void;
  onMemberLeft?: (message: MemberLeftMessage) => void;
  onKicked?: (message: KickedMessage) => void;
  onSessionClosed?: (message: SessionClosedMessage) => void;
  onError?: (message: ErrorMessage) => void;
}

/**
 * WebSocket Client Service
 * Handles client-side connection to host
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private options: Required<ConnectionOptions>;
  private handlers: MessageHandlers = {};
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingTimestamp: number | null = null;
  private latency: number | null = null;

  constructor(options: ConnectionOptions) {
    this.options = {
      ...options,
      heartbeatInterval: options.heartbeatInterval || 5000,
      connectionTimeout: options.connectionTimeout || 10000,
      maxReconnectAttempts: options.maxReconnectAttempts || 3,
      reconnectDelay: options.reconnectDelay || 2000,
    };
  }

  /**
   * Connect to host
   */
  async connectToHost(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      console.warn("[WebSocketService] Already connected");
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    console.log(`[WebSocketService] Connecting to ${this.options.host}...`);

    return new Promise((resolve, reject) => {
      try {
        // Build WebSocket URL
        const wsUrl = `ws://${this.options.host}`;
        this.ws = new WebSocket(wsUrl);

        // Connection timeout
        const timeout = setTimeout(() => {
          if (this.connectionState !== ConnectionState.CONNECTED) {
            this.ws?.close();
            reject(new Error("Connection timeout"));
          }
        }, this.options.connectionTimeout);

        // WebSocket event handlers
        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log("[WebSocketService] Connected!");
          this.connectionState = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;

          // Send JOIN message
          this.sendJoinMessage();

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error("[WebSocketService] Error:", error);

          if (this.connectionState === ConnectionState.CONNECTING) {
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log(
            "[WebSocketService] Connection closed:",
            event.code,
            event.reason,
          );
          this.stopHeartbeat();

          const wasConnected =
            this.connectionState === ConnectionState.CONNECTED;
          this.connectionState = ConnectionState.DISCONNECTED;

          // Attempt reconnection if it was an unexpected close
          if (wasConnected && !event.wasClean) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error("[WebSocketService] Failed to create WebSocket:", error);
        this.connectionState = ConnectionState.FAILED;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from host
   */
  disconnect(reason?: string): void {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      return;
    }

    console.log("[WebSocketService] Disconnecting...", reason);

    // Send LEAVE message
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = MessageBuilder.leave(this.options.deviceId, reason);
      this.send(message);
    }

    // Clean up
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.ws?.close(1000, reason);
    this.ws = null;
    this.connectionState = ConnectionState.DISCONNECTED;
  }

  /**
   * Send message to host
   */
  send(message: ProtocolMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("[WebSocketService] Cannot send: Not connected");
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocketService] Failed to send message:", error);
    }
  }

  /**
   * Register message handlers
   */
  setHandlers(handlers: MessageHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get current latency (ping time)
   */
  getLatency(): number | null {
    return this.latency;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Send JOIN message
   */
  private sendJoinMessage(): void {
    const message = MessageBuilder.join(
      this.options.sessionId,
      this.options.deviceId,
      this.options.deviceName,
      "1.0.0",
    );

    this.send(message);
    console.log("[WebSocketService] Sent JOIN message");
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: ProtocolMessage = JSON.parse(data);

      console.log("[WebSocketService] Received:", message.type);

      switch (message.type) {
        case MessageType.WELCOME:
          this.handlers.onWelcome?.(message as WelcomeMessage);
          break;

        case MessageType.MEMBER_LIST:
          this.handlers.onMemberList?.(message as MemberListMessage);
          break;

        case MessageType.MEMBER_JOINED:
          this.handlers.onMemberJoined?.(message as MemberJoinedMessage);
          break;

        case MessageType.MEMBER_LEFT:
          this.handlers.onMemberLeft?.(message as MemberLeftMessage);
          break;

        case MessageType.KICKED:
          this.handlers.onKicked?.(message as KickedMessage);
          this.disconnect("Kicked by host");
          break;

        case MessageType.SESSION_CLOSED:
          this.handlers.onSessionClosed?.(message as SessionClosedMessage);
          this.disconnect("Session closed by host");
          break;

        case MessageType.ERROR:
          this.handlers.onError?.(message as ErrorMessage);
          break;

        case MessageType.PING:
          // Respond with PONG
          const pong = MessageBuilder.pong(message.payload.timestamp);
          this.send(pong);
          break;

        case MessageType.PONG:
          // Calculate latency
          if (this.pingTimestamp) {
            this.latency = Date.now() - this.pingTimestamp;
            this.pingTimestamp = null;
          }
          break;

        default:
          console.warn(
            "[WebSocketService] Unknown message type:",
            message.type,
          );
      }
    } catch (error) {
      console.error("[WebSocketService] Failed to parse message:", error);
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        const heartbeat = MessageBuilder.heartbeat(this.options.deviceId);
        this.send(heartbeat);

        // Also send PING to measure latency
        this.pingTimestamp = Date.now();
        this.send(MessageBuilder.ping());
      }
    }, this.options.heartbeatInterval);

    console.log("[WebSocketService] Heartbeat started");
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log("[WebSocketService] Max reconnect attempts reached");
      this.connectionState = ConnectionState.FAILED;
      return;
    }

    this.reconnectAttempts++;
    this.connectionState = ConnectionState.RECONNECTING;

    console.log(
      `[WebSocketService] Reconnecting (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connectToHost().catch((error) => {
        console.error("[WebSocketService] Reconnect failed:", error);
        this.attemptReconnect();
      });
    }, this.options.reconnectDelay);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disconnect("Service destroyed");
    this.handlers = {};
  }
}
