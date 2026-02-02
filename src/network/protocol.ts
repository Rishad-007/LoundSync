/**
 * WebSocket Protocol for LOUDSYNC
 * Phase 1: Connection, Join, Leave, Presence only
 */

/**
 * Message Types
 */
export enum MessageType {
  // Client → Host
  JOIN = "JOIN",
  LEAVE = "LEAVE",
  HEARTBEAT = "HEARTBEAT",

  // Host → Client
  WELCOME = "WELCOME",
  MEMBER_LIST = "MEMBER_LIST",
  MEMBER_JOINED = "MEMBER_JOINED",
  MEMBER_LEFT = "MEMBER_LEFT",
  KICKED = "KICKED",
  SESSION_CLOSED = "SESSION_CLOSED",
  ERROR = "ERROR",

  // Bidirectional
  PING = "PING",
  PONG = "PONG",
}

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
  messageId?: string;
}

/**
 * Client Information
 */
export interface ClientInfo {
  deviceId: string;
  deviceName: string;
  joinedAt: number;
  address?: string;
}

/**
 * Member Information (host-side representation)
 */
export interface MemberInfo {
  id: string;
  name: string;
  role: "host" | "client";
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  joinedAt: number;
  lastSeen: number;
  address: string;
  latency: number | null;
}

// ============================================================================
// CLIENT → HOST MESSAGES
// ============================================================================

/**
 * JOIN: Client requests to join session
 */
export interface JoinMessage extends BaseMessage {
  type: MessageType.JOIN;
  payload: {
    sessionId: string;
    deviceId: string;
    deviceName: string;
    version: string;
  };
}

/**
 * LEAVE: Client gracefully leaves session
 */
export interface LeaveMessage extends BaseMessage {
  type: MessageType.LEAVE;
  payload: {
    deviceId: string;
    reason?: string;
  };
}

/**
 * HEARTBEAT: Client indicates it's still alive
 */
export interface HeartbeatMessage extends BaseMessage {
  type: MessageType.HEARTBEAT;
  payload: {
    deviceId: string;
    timestamp: number;
  };
}

// ============================================================================
// HOST → CLIENT MESSAGES
// ============================================================================

/**
 * WELCOME: Host accepts join and sends session info
 */
export interface WelcomeMessage extends BaseMessage {
  type: MessageType.WELCOME;
  payload: {
    sessionId: string;
    sessionName: string;
    hostId: string;
    hostName: string;
    yourDeviceId: string;
    connectedAt: number;
  };
}

/**
 * MEMBER_LIST: Host sends full member list
 */
export interface MemberListMessage extends BaseMessage {
  type: MessageType.MEMBER_LIST;
  payload: {
    members: MemberInfo[];
    totalCount: number;
  };
}

/**
 * MEMBER_JOINED: Host notifies all clients of new member
 */
export interface MemberJoinedMessage extends BaseMessage {
  type: MessageType.MEMBER_JOINED;
  payload: {
    member: MemberInfo;
  };
}

/**
 * MEMBER_LEFT: Host notifies all clients of departed member
 */
export interface MemberLeftMessage extends BaseMessage {
  type: MessageType.MEMBER_LEFT;
  payload: {
    deviceId: string;
    deviceName: string;
    reason?: string;
  };
}

/**
 * KICKED: Host kicks client from session
 */
export interface KickedMessage extends BaseMessage {
  type: MessageType.KICKED;
  payload: {
    reason: string;
  };
}

/**
 * SESSION_CLOSED: Host closes session
 */
export interface SessionClosedMessage extends BaseMessage {
  type: MessageType.SESSION_CLOSED;
  payload: {
    reason: string;
  };
}

/**
 * ERROR: Host sends error to client
 */
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  payload: {
    code: string;
    message: string;
  };
}

// ============================================================================
// BIDIRECTIONAL MESSAGES
// ============================================================================

/**
 * PING: Check connection alive
 */
export interface PingMessage extends BaseMessage {
  type: MessageType.PING;
  payload: {
    timestamp: number;
  };
}

/**
 * PONG: Response to PING
 */
export interface PongMessage extends BaseMessage {
  type: MessageType.PONG;
  payload: {
    timestamp: number;
    pingTimestamp: number;
  };
}

/**
 * Union of all message types
 */
export type ProtocolMessage =
  | JoinMessage
  | LeaveMessage
  | HeartbeatMessage
  | WelcomeMessage
  | MemberListMessage
  | MemberJoinedMessage
  | MemberLeftMessage
  | KickedMessage
  | SessionClosedMessage
  | ErrorMessage
  | PingMessage
  | PongMessage;

/**
 * Error codes
 */
export enum ErrorCode {
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_FULL = "SESSION_FULL",
  ALREADY_JOINED = "ALREADY_JOINED",
  INVALID_MESSAGE = "INVALID_MESSAGE",
  UNAUTHORIZED = "UNAUTHORIZED",
  VERSION_MISMATCH = "VERSION_MISMATCH",
}

/**
 * Connection state
 */
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  FAILED = "failed",
}

/**
 * Message builder utilities
 */
export class MessageBuilder {
  /**
   * Create JOIN message
   */
  static join(
    sessionId: string,
    deviceId: string,
    deviceName: string,
    version: string = "1.0.0",
  ): JoinMessage {
    return {
      type: MessageType.JOIN,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        sessionId,
        deviceId,
        deviceName,
        version,
      },
    };
  }

  /**
   * Create LEAVE message
   */
  static leave(deviceId: string, reason?: string): LeaveMessage {
    return {
      type: MessageType.LEAVE,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        deviceId,
        reason,
      },
    };
  }

  /**
   * Create HEARTBEAT message
   */
  static heartbeat(deviceId: string): HeartbeatMessage {
    return {
      type: MessageType.HEARTBEAT,
      timestamp: Date.now(),
      payload: {
        deviceId,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create WELCOME message
   */
  static welcome(
    sessionId: string,
    sessionName: string,
    hostId: string,
    hostName: string,
    clientDeviceId: string,
  ): WelcomeMessage {
    return {
      type: MessageType.WELCOME,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        sessionId,
        sessionName,
        hostId,
        hostName,
        yourDeviceId: clientDeviceId,
        connectedAt: Date.now(),
      },
    };
  }

  /**
   * Create MEMBER_LIST message
   */
  static memberList(members: MemberInfo[]): MemberListMessage {
    return {
      type: MessageType.MEMBER_LIST,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        members,
        totalCount: members.length,
      },
    };
  }

  /**
   * Create MEMBER_JOINED message
   */
  static memberJoined(member: MemberInfo): MemberJoinedMessage {
    return {
      type: MessageType.MEMBER_JOINED,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        member,
      },
    };
  }

  /**
   * Create MEMBER_LEFT message
   */
  static memberLeft(
    deviceId: string,
    deviceName: string,
    reason?: string,
  ): MemberLeftMessage {
    return {
      type: MessageType.MEMBER_LEFT,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        deviceId,
        deviceName,
        reason,
      },
    };
  }

  /**
   * Create KICKED message
   */
  static kicked(reason: string): KickedMessage {
    return {
      type: MessageType.KICKED,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        reason,
      },
    };
  }

  /**
   * Create SESSION_CLOSED message
   */
  static sessionClosed(reason: string): SessionClosedMessage {
    return {
      type: MessageType.SESSION_CLOSED,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        reason,
      },
    };
  }

  /**
   * Create ERROR message
   */
  static error(code: string, message: string): ErrorMessage {
    return {
      type: MessageType.ERROR,
      timestamp: Date.now(),
      messageId: this.generateId(),
      payload: {
        code,
        message,
      },
    };
  }

  /**
   * Create PING message
   */
  static ping(): PingMessage {
    return {
      type: MessageType.PING,
      timestamp: Date.now(),
      payload: {
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create PONG message
   */
  static pong(pingTimestamp: number): PongMessage {
    return {
      type: MessageType.PONG,
      timestamp: Date.now(),
      payload: {
        timestamp: Date.now(),
        pingTimestamp,
      },
    };
  }

  /**
   * Generate unique message ID
   */
  private static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
