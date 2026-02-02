# LOUDSYNC Session Architecture

**Phase 1: Session Hosting & Joining**

> A LAN-first, peer-to-peer session management system for React Native

---

## 1. What is a Session?

A **Session** in LOUDSYNC is a **temporary network group** where:

- One device acts as the **host** (server)
- Multiple devices can join as **clients**
- All communication happens over **local network (LAN)**
- Session exists only while the host device keeps it active

**Key Characteristics:**

- **Ephemeral**: Session dies when host leaves
- **LAN-bound**: No internet required, purely local discovery
- **Host-authoritative**: Host controls member list and session state
- **Named**: Each session has a human-readable name for easy identification

---

## 2. Roles: Host vs Client

### Host (Session Creator)

**Responsibilities:**

- ✓ Create and broadcast session availability
- ✓ Accept/reject join requests
- ✓ Maintain member registry
- ✓ Broadcast member list updates
- ✓ Handle member disconnections
- ✓ Terminate session

**Capabilities:**

- See all connected members
- Kick members
- Close session
- Broadcast messages to all

### Client (Session Joiner)

**Responsibilities:**

- ✓ Discover available sessions on LAN
- ✓ Request to join a session
- ✓ Maintain connection to host
- ✓ Handle disconnection/rejoin

**Capabilities:**

- See session info (name, member count)
- See other members in session
- Leave session voluntarily
- Receive broadcasts from host

---

## 3. Data Models

### Session Model

```typescript
/**
 * Core session metadata
 * Broadcast by host, discovered by clients
 */
interface Session {
  id: string; // UUID v4
  name: string; // Human-readable name
  hostId: string; // Host's device ID
  hostName: string; // Host's device name
  hostAddress: string; // Host's IP:port for connection
  createdAt: number; // Unix timestamp (ms)
  memberCount: number; // Current connected members
  maxMembers: number; // Max capacity (default: 10)
  isPasswordProtected: boolean; // Future: session security
  version: string; // Protocol version (e.g., "1.0.0")
}
```

### Member Model

```typescript
/**
 * Represents a device in the session
 * Both host and clients are members
 */
interface Member {
  id: string; // UUID v4 (device ID)
  name: string; // Device name (user-set or auto-generated)
  role: "host" | "client"; // Member role
  joinedAt: number; // Unix timestamp (ms)
  connectionStatus: ConnectionStatus; // Current connection state
  lastSeen: number; // Last heartbeat timestamp
  address: string; // IP address (for host reference)
}
```

### Connection State

```typescript
/**
 * Tracks connection lifecycle and health
 */
interface ConnectionState {
  status: ConnectionStatus;
  error: ConnectionError | null;
  lastStatusChange: number; // Unix timestamp (ms)
  reconnectAttempts: number; // For auto-reconnect logic
  latencyMs: number | null; // Ping/pong measurement
}

type ConnectionStatus =
  | "idle" // Not connected to any session
  | "discovering" // Scanning for sessions
  | "connecting" // Joining a session
  | "connected" // Active in session
  | "disconnected" // Lost connection
  | "error"; // Connection error

type ConnectionError =
  | "network_unreachable"
  | "session_full"
  | "session_not_found"
  | "rejected_by_host"
  | "timeout"
  | "protocol_mismatch"
  | "kicked"
  | "host_disconnected";
```

### Discovery Result

```typescript
/**
 * Sessions found during discovery phase
 */
interface DiscoveredSession {
  session: Session;
  signalStrength: number; // 0-100 (WiFi RSSI indicator)
  discoveredAt: number; // Unix timestamp (ms)
  isReachable: boolean; // Can we ping it?
}
```

---

## 4. Session Lifecycle State Machine

### States

| State            | Description                | Allowed For | Entry Condition                         | Exit Condition                 |
| ---------------- | -------------------------- | ----------- | --------------------------------------- | ------------------------------ |
| **idle**         | No active session          | All         | App start, leave session, session ended | Create/join session            |
| **hosting**      | Actively hosting a session | Host only   | Create session succeeds                 | Close session, fatal error     |
| **discovering**  | Scanning LAN for sessions  | Client only | Start discovery                         | Stop discovery, join session   |
| **joining**      | Connecting to a session    | Client only | Select session to join                  | Connection success/failure     |
| **connected**    | Active member in session   | Client only | Join request accepted                   | Leave, kicked, host disconnect |
| **disconnected** | Lost connection            | Client only | Network failure                         | Reconnect, return to idle      |

### State Transitions

```
┌─────────┐
│  IDLE   │ ◄────────────────────────────────┐
└────┬────┘                                   │
     │                                        │
     ├──[Create Session]──► HOSTING          │
     │                         │              │
     │                    [Close Session]─────┤
     │                         │              │
     │                    [Fatal Error]───────┤
     │                                        │
     └──[Start Discovery]──► DISCOVERING     │
                                 │            │
                        [Stop Discovery]──────┤
                                 │            │
                        [Select Session]      │
                                 │            │
                                 ▼            │
                             JOINING          │
                                 │            │
                        [Success]│[Fail]──────┤
                                 │            │
                                 ▼            │
                            CONNECTED         │
                                 │            │
                    [Leave/Kick/Host Lost]────┘
                                 │
                                 ▼
                           DISCONNECTED
                                 │
                        [Timeout/Give Up]─────┘
```

### State Rules

1. **Only one active state per device**
2. **Host cannot discover or join** (hosting is exclusive)
3. **Client cannot host while connected** (must leave first)
4. **Disconnected state auto-transitions** (timeout → idle)

---

## 5. Data Flow Architecture

### Flow 1: Host Creates Session

```
[UI: Create Session Button]
        ↓
[Action: createSession({ name })]
        ↓
[Zustand: sessionSlice.createSession]
        ↓
[Network: startBroadcast()]
   - Bind UDP socket
   - Broadcast session info on LAN
   - Listen for join requests
        ↓
[Zustand: setStatus('hosting')]
        ↓
[UI: Render Hosting Screen]
   - Show session name
   - Show QR code (future)
   - Show waiting for members
```

### Flow 2: Client Discovers Sessions

```
[UI: Join Session Button]
        ↓
[Action: startDiscovery()]
        ↓
[Zustand: setStatus('discovering')]
        ↓
[Network: scanNetwork()]
   - Listen for UDP broadcasts
   - Parse session advertisements
   - Ping each session
        ↓
[Network Event: onSessionFound(session)]
        ↓
[Zustand: addDiscoveredSession(session)]
        ↓
[UI: Render Session List]
   - Show available sessions
   - Show member count, signal strength
```

### Flow 3: Client Joins Session

```
[UI: Tap Session to Join]
        ↓
[Action: joinSession(sessionId)]
        ↓
[Zustand: setStatus('joining')]
        ↓
[Network: connectToHost(session.hostAddress)]
   - TCP handshake
   - Send join request { deviceId, deviceName }
   - Wait for acceptance
        ↓
[Network Event: onJoinAccepted(memberList)]
        ↓
[Zustand: setStatus('connected')]
[Zustand: setMembers(memberList)]
        ↓
[UI: Navigate to Session Room]
   - Show all members
   - Show "Connected" status
```

### Flow 4: Host Accepts Client

```
[Network Event: onJoinRequest(device)]
        ↓
[Zustand: addPendingRequest(device)]
        ↓
[UI: Show Join Request Toast]
   - "Alice wants to join"
   - [Accept] [Reject] buttons
        ↓
[UI: Tap Accept]
        ↓
[Action: acceptMember(deviceId)]
        ↓
[Zustand: addMember(device)]
        ↓
[Network: sendAcceptance(device)]
   - Send current member list
   - Broadcast member update to all
        ↓
[Zustand: broadcast member list update]
        ↓
[UI: All Clients Update Member List]
```

### Flow 5: Disconnection

```
[Network Event: connectionLost()]
        ↓
[Zustand: setStatus('disconnected')]
        ↓
[UI: Show "Connection Lost" Error]
        ↓
[Auto-Reconnect Logic]
   - Retry 3 times with exponential backoff
   - If fail → setStatus('idle')
        ↓
[UI: Navigate to Home]
```

### Data Flow Summary

```
┌──────────────────────────────────────────────┐
│                    UI LAYER                  │
│  (Screens, Components, User Interactions)    │
└──────────────┬───────────────────────────────┘
               │ dispatch actions
               ▼
┌──────────────────────────────────────────────┐
│               ZUSTAND STORE                  │
│   sessionSlice │ memberSlice │ networkSlice  │
│   - State      │ - Members   │ - Connection  │
│   - Actions    │ - Actions   │ - Status      │
└──────────────┬───────────────────────────────┘
               │ call network methods
               ▼
┌──────────────────────────────────────────────┐
│              NETWORK LAYER                   │
│   UDP Discovery │ TCP Connections │ Events   │
│   - Broadcast   │ - Connect       │ - Emit   │
│   - Listen      │ - Send/Receive  │ - Handle │
└──────────────┬───────────────────────────────┘
               │ emit events
               ▼
┌──────────────────────────────────────────────┐
│            EVENT LISTENERS                   │
│   onSessionFound │ onJoinRequest │ onError   │
└──────────────┬───────────────────────────────┘
               │ update state
               ▼
          [Back to Zustand]
               │
               ▼ subscribers notified
          [UI Re-renders]
```

**Key Principles:**

- **Unidirectional flow**: UI → State → Network → Events → State → UI
- **State is single source of truth**: Network never directly updates UI
- **Network layer is dumb**: Just sends/receives, emits events
- **Zustand handles logic**: All business logic in state slices

---

## 6. Folder Structure (Phase 1)

```
src/
├── network/                      # All network communication
│   ├── index.ts                 # Public API exports
│   ├── discovery/               # Session discovery (UDP)
│   │   ├── broadcaster.ts       # Host broadcasts session
│   │   ├── scanner.ts           # Client scans for sessions
│   │   └── types.ts             # Discovery-specific types
│   ├── connection/              # P2P connections (TCP)
│   │   ├── host-server.ts       # Host accepts connections
│   │   ├── client-connection.ts # Client connects to host
│   │   └── protocol.ts          # Message protocol
│   ├── events.ts                # NetworkEventEmitter
│   └── utils.ts                 # IP utils, network checks
│
├── state/                        # Zustand store
│   ├── index.ts                 # Combined store export
│   ├── store.ts                 # Root store config
│   ├── types.ts                 # Global state types
│   └── slices/
│       ├── sessionSlice.ts      # Session state & actions
│       ├── memberSlice.ts       # Member list management
│       └── networkSlice.ts      # Connection status
│
├── models/                       # Data models & types
│   ├── index.ts
│   ├── Session.ts               # Session interface & helpers
│   ├── Member.ts                # Member interface & helpers
│   └── Connection.ts            # Connection types & enums
│
├── screens/                      # UI Screens
│   ├── HomeScreen.tsx           # Entry point (idle state)
│   ├── CreateSessionScreen.tsx  # Host creates session
│   ├── JoinSessionScreen.tsx    # Client discovers sessions
│   └── SessionRoomScreen.tsx    # Active session view
│
├── components/                   # Reusable UI components
│   ├── SessionCard.tsx          # Discovered session display
│   ├── MemberList.tsx           # List of members
│   ├── MemberItem.tsx           # Single member card
│   ├── ConnectionIndicator.tsx  # Status badge
│   └── EmptyState.tsx           # No sessions found
│
├── hooks/                        # Custom React hooks
│   ├── useSession.ts            # Access session state
│   ├── useMembers.ts            # Access member list
│   ├── useNetwork.ts            # Access network status
│   └── useNetworkEvents.ts      # Subscribe to network events
│
├── utils/                        # Utilities
│   ├── deviceInfo.ts            # Get device name/ID
│   ├── validators.ts            # Input validation
│   └── formatters.ts            # Display formatters
│
└── constants/                    # App constants
    ├── network.ts               # Ports, timeouts, limits
    └── messages.ts              # Error/success messages
```

### Key Design Decisions

**1. Network Layer Separation**

- Pure TypeScript, no React dependencies
- Can be tested in isolation
- Clear UDP (discovery) vs TCP (connection) split

**2. State Management**

- Three slices: session, member, network
- Each slice owns its domain
- Actions are co-located with state

**3. Models as First-Class Citizens**

- TypeScript interfaces with helper functions
- Validation logic lives with models
- Reusable across network and state layers

**4. Screens vs Components**

- Screens = full page, state-connected
- Components = reusable, prop-driven
- Hooks bridge the gap

**5. Hooks for State Access**

- UI never imports store directly
- Hooks provide clean API
- Easy to mock in tests

---

## 7. Example Type Definitions

### Complete Session State

```typescript
// src/state/slices/sessionSlice.ts
interface SessionState {
  // Current session (if hosting or connected)
  currentSession: Session | null;

  // Role in current session
  role: "host" | "client" | null;

  // Lifecycle state
  status: ConnectionStatus;

  // Discovered sessions (when discovering)
  discoveredSessions: DiscoveredSession[];

  // Connection info
  connectionState: ConnectionState;

  // Actions
  createSession: (name: string) => Promise<void>;
  closeSession: () => Promise<void>;
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => void;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
}
```

### Complete Member State

```typescript
// src/state/slices/memberSlice.ts
interface MemberState {
  // All members in current session
  members: Member[];

  // Pending join requests (host only)
  pendingRequests: Member[];

  // Local device info
  localDevice: {
    id: string;
    name: string;
  };

  // Actions
  addMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  acceptRequest: (memberId: string) => Promise<void>;
  rejectRequest: (memberId: string) => Promise<void>;
  kickMember: (memberId: string) => Promise<void>;
}
```

### Complete Network State

```typescript
// src/state/slices/networkSlice.ts
interface NetworkState {
  // Network availability
  isNetworkAvailable: boolean;
  networkType: "wifi" | "cellular" | "none";

  // Local IP info
  localIP: string | null;

  // Connection metrics
  latency: number | null;
  lastHeartbeat: number | null;

  // Error handling
  lastError: ConnectionError | null;

  // Actions
  checkNetwork: () => Promise<void>;
  clearError: () => void;
}
```

---

## 8. Session Lifecycle Example

### Happy Path: Host → Client Connection

**Step 1: Host Creates Session**

```typescript
// UI Action
onCreateSession("Alice's Party");

// State Updates
{
  status: 'hosting',
  role: 'host',
  currentSession: {
    id: 'abc-123',
    name: "Alice's Party",
    hostId: 'device-xyz',
    hostName: 'Alice iPhone',
    memberCount: 1,
    // ...
  },
  members: [
    {
      id: 'device-xyz',
      name: 'Alice iPhone',
      role: 'host',
      connectionStatus: 'connected',
    }
  ]
}
```

**Step 2: Client Discovers Session**

```typescript
// UI Action
onStartDiscovery();

// State Updates
{
  status: 'discovering',
  discoveredSessions: [
    {
      session: {
        id: 'abc-123',
        name: "Alice's Party",
        memberCount: 1,
        // ...
      },
      signalStrength: 85,
      isReachable: true,
    }
  ]
}
```

**Step 3: Client Joins**

```typescript
// UI Action
onJoinSession('abc-123');

// State Updates (Client)
{
  status: 'joining',
  // ... wait for acceptance ...
  status: 'connected',
  role: 'client',
  currentSession: { /* same session */ },
  members: [
    { id: 'device-xyz', name: 'Alice iPhone', role: 'host' },
    { id: 'device-456', name: 'Bob Android', role: 'client' }, // me
  ]
}

// State Updates (Host)
{
  members: [
    { id: 'device-xyz', name: 'Alice iPhone', role: 'host' },
    { id: 'device-456', name: 'Bob Android', role: 'client' }, // new
  ],
  currentSession: {
    memberCount: 2, // incremented
  }
}
```

---

## 9. Implementation Phases

### Phase 1.1: Core Models & State (Week 1)

- [ ] Define TypeScript interfaces
- [ ] Create Zustand slices
- [ ] Implement state actions (with mocks)
- [ ] Write state tests

### Phase 1.2: Network Discovery (Week 2)

- [ ] UDP broadcaster (host)
- [ ] UDP scanner (client)
- [ ] Session advertisement protocol
- [ ] Test on real devices

### Phase 1.3: P2P Connection (Week 3)

- [ ] TCP server (host)
- [ ] TCP client connection
- [ ] Join request/response flow
- [ ] Heartbeat mechanism

### Phase 1.4: UI Implementation (Week 4)

- [ ] Home screen
- [ ] Create/Join screens
- [ ] Session room screen
- [ ] Member list UI
- [ ] Connection indicators

### Phase 1.5: Integration & Testing (Week 5)

- [ ] End-to-end flow testing
- [ ] Multi-device testing
- [ ] Error handling & edge cases
- [ ] Performance optimization

---

## 10. Network Protocol Specification

### UDP Discovery Protocol (Host → Broadcast)

```typescript
// Message Type
type DiscoveryMessage = {
  type: 'SESSION_ADVERTISEMENT';
  version: '1.0.0';
  session: Session;
  timestamp: number;
};

// Example Packet
{
  "type": "SESSION_ADVERTISEMENT",
  "version": "1.0.0",
  "session": {
    "id": "abc-123",
    "name": "Alice's Party",
    "hostAddress": "192.168.1.5:8080",
    "memberCount": 2,
    // ...
  },
  "timestamp": 1706918400000
}

// Broadcast Details
- Port: 41234 (UDP)
- Interval: Every 2 seconds
- TTL: Sessions expire after 10 seconds without refresh
```

### TCP Connection Protocol (Client ↔ Host)

```typescript
// Message Types
type ProtocolMessage =
  | JoinRequestMessage
  | JoinResponseMessage
  | MemberUpdateMessage
  | HeartbeatMessage
  | LeaveMessage
  | KickMessage;

// Join Request (Client → Host)
{
  "type": "JOIN_REQUEST",
  "deviceId": "device-456",
  "deviceName": "Bob Android",
  "version": "1.0.0",
  "timestamp": 1706918400000
}

// Join Response (Host → Client)
{
  "type": "JOIN_RESPONSE",
  "accepted": true,
  "sessionId": "abc-123",
  "members": [ /* full member list */ ],
  "timestamp": 1706918400000
}

// Member Update (Host → All Clients)
{
  "type": "MEMBER_UPDATE",
  "action": "joined" | "left" | "kicked",
  "member": { /* member object */ },
  "members": [ /* updated list */ ],
  "timestamp": 1706918400000
}

// Heartbeat (Bidirectional)
{
  "type": "HEARTBEAT",
  "deviceId": "device-456",
  "timestamp": 1706918400000
}

// TCP Details
- Host listens on port 8080
- Keep-alive: 30 seconds
- Timeout: 60 seconds no heartbeat = disconnect
```

---

## Summary

This architecture provides:

✅ **Clear separation of concerns**

- UI, State, Network are distinct layers

✅ **Type-safe data models**

- Every entity has a TypeScript interface

✅ **Well-defined state machine**

- Session lifecycle is explicit and predictable

✅ **Unidirectional data flow**

- Easier to reason about and debug

✅ **Scalable structure**

- Easy to add audio/sync in future phases

✅ **LAN-first networking**

- UDP discovery + TCP connections

✅ **Testable components**

- Network layer can be mocked
- State can be tested independently

**Next Steps:**

1. Review and approve this architecture
2. Set up project structure
3. Implement Phase 1.1 (Models & State)
4. Begin network layer development

---

_Last Updated: February 2, 2026_
_Version: 1.0.0_
