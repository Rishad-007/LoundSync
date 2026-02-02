# WebSocket Session Server Architecture - LOUDSYNC

## Executive Summary

LOUDSYNC uses an **in-app WebSocket server** running on the host's device to manage session membership. This document explains how we run a WebSocket server in React Native and integrate it with session state management.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST DEVICE                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  React Native App                          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │           Zustand Session Store                       │ │  │
│  │  │  - currentSession                                     │ │  │
│  │  │  - members: MemberInfo[]                              │ │  │
│  │  │  - connectionStatus                                   │ │  │
│  │  └──────────────────┬───────────────────────────────────┘ │  │
│  │                     │                                       │  │
│  │                     ↓                                       │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │       SessionServerManager                            │ │  │
│  │  │  - createServer()                                     │ │  │
│  │  │  - acceptClient()                                     │ │  │
│  │  │  - registerMember()                                   │ │  │
│  │  │  - removeMember()                                     │ │  │
│  │  │  - broadcastMembers()                                 │ │  │
│  │  └──────────────────┬───────────────────────────────────┘ │  │
│  │                     │                                       │  │
│  │                     ↓                                       │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │       WebSocketServer (Native Wrapper)                │ │  │
│  │  │  - ws.Server on local port 8080                       │ │  │
│  │  │  - Connection pool: Map<deviceId, WebSocket>          │ │  │
│  │  │  - Heartbeat monitoring                               │ │  │
│  │  └──────────────────┬───────────────────────────────────┘ │  │
│  └────────────────────│─────────────────────────────────────┘  │
│                       │                                         │
│                       │ Network: ws://192.168.1.100:8080       │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        │ WiFi Local Network
                        │
        ┌───────────────┴───────────────┬────────────────┐
        │                               │                │
        ▼                               ▼                ▼
┌───────────────┐             ┌───────────────┐ ┌───────────────┐
│  GUEST #1     │             │  GUEST #2     │ │  GUEST #3     │
│               │             │               │ │               │
│  WebSocket    │             │  WebSocket    │ │  WebSocket    │
│  Client       │             │  Client       │ │  Client       │
│               │             │               │ │               │
│  ws.connect() │             │  ws.connect() │ │  ws.connect() │
└───────────────┘             └───────────────┘ └───────────────┘
```

---

## How Host Runs Local WebSocket Server in React Native

### Challenge: Native Modules Required

React Native **cannot run Node.js `ws` library directly** because it lacks Node.js runtime.

### Solution: Three Approaches

#### 1. **Native Module Bridge** (Production - Recommended)

```typescript
// iOS: Use SocketRocket or Starscream (Swift)
// Android: Use OkHttp WebSocket (Java/Kotlin)

import { NativeModules } from "react-native";
const { WebSocketServerModule } = NativeModules;

// Start server via native bridge
WebSocketServerModule.startServer(8080, (port) => {
  console.log(`Server started on ${port}`);
});
```

**Pros:**

- ✅ True native WebSocket server
- ✅ Best performance
- ✅ Production-ready

**Cons:**

- ❌ Requires native development (Swift/Kotlin)
- ❌ Platform-specific code
- ❌ Complex setup

#### 2. **Expo Native Module** (Recommended for Expo)

```bash
# Install expo-websocket-server (if exists)
npx expo install expo-websocket-server

# Or build custom native module
npx create-expo-module websocket-server
```

#### 3. **Polyfill with React Native Server** (Development/Testing)

```typescript
// Use react-native-tcp-socket + manual WebSocket protocol
import TcpSocket from "react-native-tcp-socket";

const server = TcpSocket.createServer((socket) => {
  // Handle WebSocket handshake manually
  // Parse HTTP upgrade request
  // Send HTTP 101 Switching Protocols
  // Handle WebSocket frames
});

server.listen({ port: 8080, host: "0.0.0.0" });
```

**Pros:**

- ✅ Pure JavaScript (no native code)
- ✅ Works in development

**Cons:**

- ❌ Complex WebSocket protocol implementation
- ❌ Not production-ready
- ❌ Performance issues

---

## Implementation Strategy

For this implementation, we'll create:

1. **SessionServerManager** - High-level session management API
2. **WebSocketServer** - Enhanced native wrapper (already exists)
3. **Zustand Integration** - State updates on membership changes

---

## Core Components

### 1. SessionServerManager

**Purpose:** High-level API for session server operations

**Responsibilities:**

- Create/destroy server
- Accept/reject clients
- Track members
- Broadcast member list
- Handle disconnections

**Key Methods:**

```typescript
class SessionServerManager {
  // Lifecycle
  createServer(sessionId, sessionName, hostId, hostName): Promise<void>;
  stopServer(): Promise<void>;

  // Client Management
  acceptClient(deviceId, deviceName): boolean;
  rejectClient(deviceId, reason): void;
  registerMember(deviceId, deviceName): void;
  removeMember(deviceId, reason?): void;

  // Broadcasting
  broadcastMembers(): void;
  kickMember(deviceId, reason): void;

  // State
  getMembers(): MemberInfo[];
  isRunning(): boolean;
}
```

### 2. WebSocketServer (Native Wrapper)

**Purpose:** Low-level WebSocket server operations

**Already Implemented:**

- ✅ Server creation on port 8080
- ✅ Connection handling
- ✅ Message parsing (JOIN, LEAVE, HEARTBEAT)
- ✅ Error handling
- ✅ Heartbeat monitoring

**Enhanced Features:**

```typescript
class WebSocketServer {
  // Core (Already Exists)
  start(): Promise<void>
  stop(): Promise<void>

  // Client Management
  private handleJoin(ws, message, address): string | null
  private handleLeave(message): void
  private handleHeartbeat(message): void

  // Helpers
  kickClient(deviceId, reason): void
  getClients(): ClientInfo[]
  getMemberList(): MemberInfo[]

  // Event Handlers
  setHandlers({
    onClientJoined: (client) => void,
    onClientLeft: (deviceId, reason) => void,
    onMemberListChanged: (members) => void
  }): void
}
```

### 3. Zustand Session State

**Purpose:** React state management for UI updates

**State Structure:**

```typescript
interface SessionState {
  role: "host" | "client" | null;
  currentSession: Session | null;
  members: MemberInfo[];
  connectionStatus: ConnectionStatus;
}

interface SessionActions {
  // Server Management
  startHosting(): Promise<void>;
  stopHosting(): Promise<void>;

  // State Updates
  updateMembers(members: MemberInfo[]): void;
  removeMemberFromState(deviceId: string): void;
}
```

---

## Data Flow

### Host Creates Session

```
User → "Create Session"
  ↓
Zustand: createSession(name)
  ↓
SessionServerManager.createServer({
  sessionId: "A1B2C3",
  sessionName: "My Party",
  hostId: "device-123",
  hostName: "iPhone"
})
  ↓
WebSocketServer.start()
  ├─ Bind to port 8080
  ├─ Listen for connections
  └─ Set event handlers
  ↓
✅ Server Running
  ↓
Update Zustand:
  - role: 'host'
  - currentSession: { id, name, ... }
  - members: [{ id: hostId, role: 'host', ... }]
  - connectionStatus: 'hosting'
```

### Guest Joins Session

```
Guest → Discovers session → Taps "Join"
  ↓
Guest WebSocketClient.connect("ws://192.168.1.100:8080")
  ↓
Host WebSocketServer receives connection
  ↓
Guest sends JOIN message {
  type: "JOIN",
  payload: {
    sessionId: "A1B2C3",
    deviceId: "device-456",
    deviceName: "Android"
  }
}
  ↓
Host: SessionServerManager.acceptClient()
  ├─ Validate sessionId ✅
  ├─ Check duplicate ✅
  ├─ Check capacity ✅
  └─ Register member
  ↓
Host: registerMember("device-456", "Android")
  ├─ Add to clients map
  ├─ Send WELCOME to guest
  ├─ Send MEMBER_LIST to guest
  └─ Broadcast MEMBER_JOINED to all others
  ↓
Host: onMemberListChanged([host, guest1])
  ↓
Update Zustand:
  - members: [
      { id: hostId, role: 'host', ... },
      { id: 'device-456', role: 'client', ... }
    ]
  ↓
✅ UI Auto-Updates (member count, member list)
```

### Guest Disconnects

```
Guest closes app OR network fails
  ↓
WebSocket connection closes
  ↓
Host: onClientLeft("device-456", "Connection closed")
  ↓
SessionServerManager.removeMember("device-456")
  ├─ Remove from clients map
  └─ Broadcast MEMBER_LEFT to remaining clients
  ↓
Update Zustand:
  - members: [{ id: hostId, role: 'host', ... }]
  ↓
✅ UI Auto-Updates (member count decreases)
```

### Host Shuts Down

```
Host → "End Session"
  ↓
SessionServerManager.stopServer()
  ├─ Send SESSION_CLOSED to all clients
  ├─ Close all client connections
  ├─ Stop heartbeat monitoring
  └─ Close server socket
  ↓
Update Zustand:
  - role: null
  - currentSession: null
  - members: []
  - connectionStatus: 'disconnected'
  ↓
Navigate to home screen
```

---

## Edge Case Handling

### 1. Duplicate Joins

```typescript
acceptClient(deviceId, deviceName) {
  if (this.clients.has(deviceId)) {
    // Already connected - reject
    this.rejectClient(deviceId, "Already joined");
    return false;
  }
  return true;
}
```

**Behavior:**

- ❌ Send ERROR message: "Already joined"
- ❌ Close new connection
- ✅ Keep existing connection alive

### 2. Session Full

```typescript
acceptClient(deviceId, deviceName) {
  const currentMembers = this.getMembers().length;
  const maxMembers = this.options.maxMembers;

  if (currentMembers >= maxMembers) {
    this.rejectClient(deviceId, "Session full");
    return false;
  }
  return true;
}
```

**Behavior:**

- ❌ Send ERROR message: "Session full"
- ❌ Close connection
- 💡 Guest sees: "This session is full (8/8)"

### 3. Invalid Session ID

```typescript
acceptClient(deviceId, deviceName, sessionId) {
  if (sessionId !== this.options.sessionId) {
    this.rejectClient(deviceId, "Session not found");
    return false;
  }
  return true;
}
```

**Behavior:**

- ❌ Send ERROR message: "Session not found"
- ❌ Close connection
- 💡 Guest sees: "Invalid session code"

### 4. Heartbeat Timeout

```typescript
private startHeartbeatCheck() {
  setInterval(() => {
    const now = Date.now();
    this.clients.forEach((client, deviceId) => {
      const timeSinceHeartbeat = now - client.lastHeartbeat;

      if (timeSinceHeartbeat > this.options.heartbeatTimeout) {
        console.log(`Client ${deviceId} timed out`);
        this.removeMember(deviceId, "Heartbeat timeout");
      }
    });
  }, 5000); // Check every 5 seconds
}
```

**Behavior:**

- ⏱️ If no heartbeat for 15 seconds → disconnect
- 📡 Send MEMBER_LEFT to remaining clients
- 🔄 Update UI immediately

### 5. Host Device Lock/Background

```typescript
// In React Native, use AppState
import { AppState } from "react-native";

AppState.addEventListener("change", (nextState) => {
  if (nextState === "background" || nextState === "inactive") {
    // Keep server running in background (if possible)
    // Or warn users that session will pause
  }
});
```

**Behavior:**

- ⚠️ Show warning: "Locking device will pause session"
- 🔄 On iOS: Use background modes for audio (allows network)
- 🔄 On Android: Foreground service keeps server alive

---

## State Integration

### Zustand Store Updates

```typescript
// In sessionSlice.ts

export const createSessionSlice: StateCreator<LoudSyncStore> = (set, get) => ({
  members: [],

  // Called when server starts
  startHosting: async () => {
    const { localDevice, currentSession } = get();

    // Start WebSocket server
    const server = new SessionServerManager();
    await server.createServer({
      sessionId: currentSession.id,
      sessionName: currentSession.name,
      hostId: localDevice.id,
      hostName: localDevice.name,
    });

    // Set event handlers
    server.setHandlers({
      onMemberJoined: (member) => {
        set((state) => ({
          members: [...state.members, member],
        }));
      },

      onMemberLeft: (deviceId) => {
        set((state) => ({
          members: state.members.filter((m) => m.id !== deviceId),
        }));
      },

      onMemberListChanged: (members) => {
        set({ members });
      },
    });

    // Initialize with host as first member
    set({
      role: "host",
      members: [
        {
          id: localDevice.id,
          name: localDevice.name,
          role: "host",
          connectionStatus: "connected",
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        },
      ],
      connectionStatus: "hosting",
    });
  },

  // Called when server stops
  stopHosting: async () => {
    const server = SessionServerManager.getInstance();
    await server.stopServer();

    set({
      role: null,
      currentSession: null,
      members: [],
      connectionStatus: "disconnected",
    });
  },
});
```

### React Component Integration

```tsx
// In player-room.tsx

export default function PlayerRoomScreen() {
  const { role, members, currentSession } = useLoudSyncStore();
  const isHost = role === "host";

  // Display member count
  const memberCount = members.length;

  // Display member list
  return (
    <View>
      <Text>{memberCount} Connected</Text>

      {members.map((member) => (
        <MemberCard
          key={member.id}
          name={member.name}
          role={member.role}
          latency={member.latency}
          isHost={member.role === "host"}
        />
      ))}
    </View>
  );
}
```

**Auto-Updates:**

- ✅ Member joins → UI instantly shows new member
- ✅ Member leaves → UI instantly removes member
- ✅ Latency changes → UI updates latency badge
- ✅ No manual polling required

---

## Protocol Messages

### JOIN (Guest → Host)

```json
{
  "type": "JOIN",
  "timestamp": 1738454400000,
  "payload": {
    "sessionId": "A1B2C3",
    "deviceId": "device-456",
    "deviceName": "Android",
    "version": "1.0.0"
  }
}
```

### WELCOME (Host → Guest)

```json
{
  "type": "WELCOME",
  "timestamp": 1738454400000,
  "payload": {
    "sessionId": "A1B2C3",
    "sessionName": "My Party",
    "hostId": "device-123",
    "hostName": "iPhone",
    "yourDeviceId": "device-456"
  }
}
```

### MEMBER_LIST (Host → Guest)

```json
{
  "type": "MEMBER_LIST",
  "timestamp": 1738454400000,
  "payload": {
    "members": [
      {
        "id": "device-123",
        "name": "iPhone",
        "role": "host",
        "connectionStatus": "connected",
        "joinedAt": 1738454300000,
        "latency": null
      },
      {
        "id": "device-456",
        "name": "Android",
        "role": "client",
        "connectionStatus": "connected",
        "joinedAt": 1738454400000,
        "latency": 45
      }
    ]
  }
}
```

### MEMBER_JOINED (Host → All Guests)

```json
{
  "type": "MEMBER_JOINED",
  "timestamp": 1738454400000,
  "payload": {
    "member": {
      "id": "device-456",
      "name": "Android",
      "role": "client",
      "connectionStatus": "connected",
      "joinedAt": 1738454400000
    }
  }
}
```

### MEMBER_LEFT (Host → All Guests)

```json
{
  "type": "MEMBER_LEFT",
  "timestamp": 1738454500000,
  "payload": {
    "deviceId": "device-456",
    "reason": "Connection closed"
  }
}
```

### ERROR (Host → Guest)

```json
{
  "type": "ERROR",
  "timestamp": 1738454400000,
  "payload": {
    "code": "SESSION_FULL",
    "message": "Session is full (8/8)"
  }
}
```

### HEARTBEAT (Guest → Host)

```json
{
  "type": "HEARTBEAT",
  "timestamp": 1738454400000,
  "payload": {
    "deviceId": "device-456"
  }
}
```

### SESSION_CLOSED (Host → All Guests)

```json
{
  "type": "SESSION_CLOSED",
  "timestamp": 1738454600000,
  "payload": {
    "reason": "Host closed session"
  }
}
```

---

## Performance Considerations

### Memory Usage

- **Per client:** ~10KB (WebSocket connection + metadata)
- **10 clients:** ~100KB total
- **Acceptable for mobile**

### Network Bandwidth

- **Heartbeat:** 50 bytes every 5 seconds
- **Member update:** 200 bytes per join/leave
- **Minimal overhead**

### CPU Usage

- **Heartbeat check:** Every 5 seconds (negligible)
- **Message parsing:** On-demand (fast)
- **Negligible impact on battery**

---

## Testing Strategy

### Unit Tests

```typescript
describe('SessionServerManager', () => {
  it('should create server successfully', async () => {
    const manager = new SessionServerManager();
    await manager.createServer({ ... });
    expect(manager.isRunning()).toBe(true);
  });

  it('should accept valid clients', () => {
    const accepted = manager.acceptClient('device-1', 'Guest 1');
    expect(accepted).toBe(true);
    expect(manager.getMembers()).toHaveLength(2); // host + guest
  });

  it('should reject duplicate joins', () => {
    manager.acceptClient('device-1', 'Guest 1');
    const rejected = manager.acceptClient('device-1', 'Guest 1');
    expect(rejected).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe("Host-Guest Flow", () => {
  it("should handle full join-leave cycle", async () => {
    // Host starts server
    await hostStore.startHosting();

    // Guest connects
    await guestStore.joinSession(sessionId);

    // Verify member list
    expect(hostStore.members).toHaveLength(2);
    expect(guestStore.members).toHaveLength(2);

    // Guest disconnects
    await guestStore.leaveSession();

    // Verify member list
    expect(hostStore.members).toHaveLength(1);
  });
});
```

---

## Security Considerations

### Current Implementation

- ⚠️ **No encryption** - WebSocket uses `ws://` (plaintext)
- ⚠️ **No authentication** - Anyone with session ID can join
- ⚠️ **Local network only** - Requires same WiFi

### Future Enhancements

- [ ] Use `wss://` (WebSocket Secure) with TLS
- [ ] Add session passwords
- [ ] Implement device fingerprinting
- [ ] Add rate limiting for join attempts
- [ ] Implement host approval for joins

---

## Deployment Notes

### Development (Expo Go)

- ❌ WebSocket server **NOT** available
- ✅ Use simulated discovery (session registry)
- ✅ Test validation logic
- ✅ Test UI state updates

### Production (Native Build)

- ✅ Requires native module for WebSocket server
- ✅ Build with `eas build` or `expo prebuild`
- ✅ Test on real devices with same WiFi
- ✅ Verify port 8080 accessibility

### Platform-Specific

- **iOS:** Use `SocketRocket` or `Starscream`
- **Android:** Use `OkHttp` WebSocket implementation
- **Both:** Require background execution permissions

---

## Next Steps

1. ✅ Create SessionServerManager class
2. ✅ Integrate with WebSocketServer
3. ✅ Add Zustand event handlers
4. ✅ Update player-room.tsx to start/stop server
5. ✅ Test join/leave flows
6. [ ] Build native module for production
7. [ ] Test on real devices
8. [ ] Add error recovery mechanisms
9. [ ] Implement reconnection logic
10. [ ] Add session persistence
