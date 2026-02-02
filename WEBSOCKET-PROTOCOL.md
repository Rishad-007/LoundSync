# WebSocket Protocol Specification

## Overview

LOUDSYNC uses a JSON-based WebSocket protocol for real-time session management. This document specifies all message types, their structure, and expected behavior.

**Version:** 1.0  
**Protocol Type:** JSON over WebSocket  
**Character Encoding:** UTF-8

---

## Connection States

```typescript
enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  FAILED = "failed",
}
```

- **DISCONNECTED**: No active connection
- **CONNECTING**: Initial connection attempt in progress
- **CONNECTED**: Successfully connected and authenticated
- **RECONNECTING**: Connection lost, attempting to reconnect
- **FAILED**: All reconnection attempts exhausted

---

## Message Structure

All messages follow this base structure:

```typescript
interface BaseMessage {
  type: MessageType;
  timestamp: number;
}
```

### Message Types

```typescript
enum MessageType {
  // Connection lifecycle
  JOIN = "join",
  WELCOME = "welcome",
  LEAVE = "leave",

  // Member management
  MEMBER_LIST = "member_list",
  MEMBER_JOINED = "member_joined",
  MEMBER_LEFT = "member_left",

  // Session control
  KICKED = "kicked",
  SESSION_CLOSED = "session_closed",

  // Keep-alive & latency
  HEARTBEAT = "heartbeat",
  PING = "ping",
  PONG = "pong",

  // Error handling
  ERROR = "error",
}
```

---

## Client-to-Server Messages

### 1. JOIN

**Sent by:** Client  
**Purpose:** Request to join a session  
**Triggers:** `WELCOME`, `MEMBER_LIST`, `MEMBER_JOINED` (broadcast)

```typescript
interface JoinMessage extends BaseMessage {
  type: "join";
  sessionId: string;
  deviceInfo: ClientInfo;
}

interface ClientInfo {
  id: string;
  name: string;
  type: "host" | "client";
}
```

**Example:**

```json
{
  "type": "join",
  "timestamp": 1706889600000,
  "sessionId": "abc123",
  "deviceInfo": {
    "id": "device-456",
    "name": "Rishad's iPhone",
    "type": "client"
  }
}
```

**Server Validation:**

- Session ID must exist
- Session must not be full (< maxMembers)
- Device must not already be connected

**Success Response:**

1. `WELCOME` message with assigned client ID
2. `MEMBER_LIST` with all current members
3. `MEMBER_JOINED` broadcast to other clients

**Error Response:**

- `ERROR` with appropriate error code

---

### 2. LEAVE

**Sent by:** Client  
**Purpose:** Gracefully disconnect from session  
**Triggers:** `MEMBER_LEFT` (broadcast)

```typescript
interface LeaveMessage extends BaseMessage {
  type: "leave";
  reason?: string;
}
```

**Example:**

```json
{
  "type": "leave",
  "timestamp": 1706889700000,
  "reason": "User exited session"
}
```

**Server Action:**

- Remove client from member list
- Broadcast `MEMBER_LEFT` to remaining clients
- Close WebSocket connection

---

### 3. HEARTBEAT

**Sent by:** Client  
**Purpose:** Indicate client is still alive  
**Interval:** Every 5 seconds  
**Timeout:** Server disconnects after 15 seconds without heartbeat

```typescript
interface HeartbeatMessage extends BaseMessage {
  type: "heartbeat";
}
```

**Example:**

```json
{
  "type": "heartbeat",
  "timestamp": 1706889650000
}
```

**Server Action:**

- Update `lastHeartbeat` timestamp for client
- No response sent (one-way keepalive)

---

### 4. PING

**Sent by:** Client  
**Purpose:** Measure round-trip latency  
**Triggers:** `PONG` response  
**Interval:** Every 5 seconds (alongside HEARTBEAT)

```typescript
interface PingMessage extends BaseMessage {
  type: "ping";
}
```

**Example:**

```json
{
  "type": "ping",
  "timestamp": 1706889650000
}
```

**Server Action:**

- Immediately respond with `PONG` containing same timestamp

---

## Server-to-Client Messages

### 1. WELCOME

**Sent by:** Server  
**Purpose:** Confirm successful connection  
**Trigger:** After valid `JOIN` message

```typescript
interface WelcomeMessage extends BaseMessage {
  type: "welcome";
  clientId: string;
  sessionInfo: {
    id: string;
    name: string;
    hostId: string;
  };
}
```

**Example:**

```json
{
  "type": "welcome",
  "timestamp": 1706889600100,
  "clientId": "client-789",
  "sessionInfo": {
    "id": "abc123",
    "name": "Rishad's Party",
    "hostId": "host-001"
  }
}
```

---

### 2. MEMBER_LIST

**Sent by:** Server  
**Purpose:** Provide complete list of session members  
**Trigger:** After `JOIN` or when requested

```typescript
interface MemberListMessage extends BaseMessage {
  type: "member_list";
  members: MemberInfo[];
}

interface MemberInfo {
  id: string;
  name: string;
  isHost: boolean;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  joinedAt: number;
  latency?: number;
}
```

**Example:**

```json
{
  "type": "member_list",
  "timestamp": 1706889600200,
  "members": [
    {
      "id": "host-001",
      "name": "Rishad's MacBook",
      "isHost": true,
      "connectionStatus": "connected",
      "joinedAt": 1706889500000
    },
    {
      "id": "client-789",
      "name": "Rishad's iPhone",
      "isHost": false,
      "connectionStatus": "connected",
      "joinedAt": 1706889600000,
      "latency": 23
    }
  ]
}
```

---

### 3. MEMBER_JOINED

**Sent by:** Server  
**Purpose:** Notify all clients when a new member joins  
**Trigger:** After successful `JOIN` (broadcast to existing members)

```typescript
interface MemberJoinedMessage extends BaseMessage {
  type: "member_joined";
  member: MemberInfo;
}
```

**Example:**

```json
{
  "type": "member_joined",
  "timestamp": 1706889600300,
  "member": {
    "id": "client-999",
    "name": "Sara's Android",
    "isHost": false,
    "connectionStatus": "connected",
    "joinedAt": 1706889600300,
    "latency": 31
  }
}
```

---

### 4. MEMBER_LEFT

**Sent by:** Server  
**Purpose:** Notify all clients when a member leaves  
**Trigger:** After `LEAVE` message or connection timeout

```typescript
interface MemberLeftMessage extends BaseMessage {
  type: "member_left";
  memberId: string;
  reason?: "left" | "kicked" | "timeout" | "error";
}
```

**Example:**

```json
{
  "type": "member_left",
  "timestamp": 1706889700000,
  "memberId": "client-789",
  "reason": "left"
}
```

---

### 5. KICKED

**Sent by:** Server  
**Purpose:** Inform client they've been removed from session  
**Trigger:** Host kicks member or policy violation

```typescript
interface KickedMessage extends BaseMessage {
  type: "kicked";
  reason: string;
}
```

**Example:**

```json
{
  "type": "kicked",
  "timestamp": 1706889750000,
  "reason": "Host removed you from the session"
}
```

**Client Action:**

- Disconnect WebSocket
- Clear session state
- Show notification to user

---

### 6. SESSION_CLOSED

**Sent by:** Server  
**Purpose:** Notify all clients that session is ending  
**Trigger:** Host stops hosting

```typescript
interface SessionClosedMessage extends BaseMessage {
  type: "session_closed";
  reason?: string;
}
```

**Example:**

```json
{
  "type": "session_closed",
  "timestamp": 1706889800000,
  "reason": "Host ended the session"
}
```

**Client Action:**

- Disconnect WebSocket
- Clear session state
- Return to session discovery screen

---

### 7. PONG

**Sent by:** Server  
**Purpose:** Respond to PING for latency measurement  
**Trigger:** After receiving `PING`

```typescript
interface PongMessage extends BaseMessage {
  type: "pong";
}
```

**Example:**

```json
{
  "type": "pong",
  "timestamp": 1706889650000
}
```

**Client Action:**

- Calculate latency: `Date.now() - pongMessage.timestamp`
- Update local latency tracking

---

### 8. ERROR

**Sent by:** Server  
**Purpose:** Report errors to client  
**Trigger:** Invalid message, session full, unauthorized action

```typescript
interface ErrorMessage extends BaseMessage {
  type: "error";
  code: ErrorCode;
  message: string;
  details?: any;
}

enum ErrorCode {
  SESSION_NOT_FOUND = "session_not_found",
  SESSION_FULL = "session_full",
  ALREADY_JOINED = "already_joined",
  INVALID_MESSAGE = "invalid_message",
  UNAUTHORIZED = "unauthorized",
  VERSION_MISMATCH = "version_mismatch",
}
```

**Example:**

```json
{
  "type": "error",
  "timestamp": 1706889600000,
  "code": "session_full",
  "message": "Session has reached maximum capacity (10 members)",
  "details": {
    "maxMembers": 10,
    "currentMembers": 10
  }
}
```

---

## Message Flows

### Successful Join Flow

```
Client                                Server
  |                                      |
  |-------- JOIN ----------------------->|
  |                                      |
  |<------- WELCOME ---------------------|
  |                                      |
  |<------- MEMBER_LIST -----------------|
  |                                      |
  |                                      |--- MEMBER_JOINED --->| Other Clients
  |                                      |
  |-------- HEARTBEAT ------------------>| (every 5s)
  |-------- PING ----------------------->|
  |<------- PONG ------------------------|
  |                                      |
```

### Graceful Leave Flow

```
Client                                Server
  |                                      |
  |-------- LEAVE ---------------------->|
  |                                      |
  |<------- (WebSocket Close) -----------|
  |                                      |
  |                                      |--- MEMBER_LEFT ----->| Other Clients
```

### Timeout Disconnect Flow

```
Client (unresponsive)                 Server
  |                                      |
  |    (no HEARTBEAT for 15s)            |
  |                                      |--- Check timeout
  |                                      |--- Remove client
  |<------- (WebSocket Close) -----------|
  |                                      |
  |                                      |--- MEMBER_LEFT ----->| Other Clients
```

### Session Closed Flow

```
Host                                  Server                    Clients
  |                                      |                         |
  |-- stopHosting() ------------------->|                         |
  |                                      |                         |
  |                                      |--- SESSION_CLOSED ----->|
  |                                      |--- SESSION_CLOSED ----->|
  |                                      |--- SESSION_CLOSED ----->|
  |                                      |                         |
  |                                      |<-- (Close all) ---------|
```

---

## Error Handling

### Connection Errors

| Scenario               | Error Code          | Action                            |
| ---------------------- | ------------------- | --------------------------------- |
| Session doesn't exist  | `SESSION_NOT_FOUND` | Show error, return to discovery   |
| Session at capacity    | `SESSION_FULL`      | Show error, suggest waiting       |
| Already joined         | `ALREADY_JOINED`    | Disconnect old connection, rejoin |
| Invalid message format | `INVALID_MESSAGE`   | Log error, continue listening     |

### Timeout Behavior

- **Client Heartbeat Interval:** 5 seconds
- **Server Timeout Detection:** 15 seconds (3x heartbeat interval)
- **Reconnection Attempts:** 3 attempts
- **Reconnection Delay:** 2 seconds between attempts

### Reconnection Logic

```typescript
// Client-side reconnection
if (disconnected && reconnectAttempts < maxReconnectAttempts) {
  connectionState = "reconnecting";
  await delay(reconnectDelay);
  await connectToHost(options);
  reconnectAttempts++;
} else {
  connectionState = "failed";
  clearSession();
}
```

---

## Security Considerations

1. **Session ID Validation:** Server validates session ID exists before accepting JOIN
2. **Device ID Uniqueness:** Server checks for duplicate device IDs in session
3. **Capacity Limits:** Server enforces maximum member count
4. **Heartbeat Verification:** Server disconnects unresponsive clients
5. **Message Validation:** Server validates all incoming messages against schema

---

## Implementation Notes

### Client Implementation

- Use native WebSocket API (browser/React Native)
- Implement automatic reconnection (3 attempts)
- Send HEARTBEAT every 5 seconds
- Send PING every 5 seconds for latency tracking
- Handle all message types in message handler

### Server Implementation

- Use Node.js `ws` library (or native module in React Native)
- Validate all JOIN requests
- Broadcast member changes to all clients
- Run heartbeat check every 5 seconds
- Timeout clients after 15 seconds without heartbeat

### State Synchronization

- Client receives MEMBER_LIST after JOIN
- Client updates local state on MEMBER_JOINED/MEMBER_LEFT
- Client maintains connectionStatus for each member
- Client tracks latency from PING/PONG messages

---

## Version History

**v1.0** (February 2026)

- Initial protocol specification
- 12 message types
- Heartbeat & latency tracking
- Error handling & reconnection logic
