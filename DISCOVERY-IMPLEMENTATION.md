## LAN Discovery Implementation for LOUDSYNC

Complete guide to the discovery system with mDNS + UDP fallback.

### Architecture Overview

```
Host (Broadcaster)                    Client (Scanner)
─────────────────                     ───────────────

Session Created
│
├─ startHosting()
│  │
│  └─ hostBroadcastService
│     ├─ mDNS: _loudsync._tcp service
│     └─ UDP: Periodic broadcasts on port 9876
│
└─ Advertisements sent continuously
   ├─ Session metadata
   ├─ Member count
   └─ Connection info
                                      Discovery Started
                                      │
                                      └─ discoveryManager
                                         ├─ Try: MDNSDiscoveryService
                                         │  ├─ Listen: _loudsync._tcp
                                         │  └─ Parse: TXT records
                                         │
                                         └─ Fallback: UDPDiscoveryService
                                            ├─ Send: "LOUDSYNC_DISCOVER"
                                            └─ Listen: Responses

                                      Sessions Found
                                      │
                                      └─ discoveryManager
                                         ├─ Deduplicate by ID
                                         ├─ Track by method (mDNS > UDP)
                                         └─ Expire after 15s idle
```

### 1. Discovery Approaches

#### **mDNS / Zeroconf (Primary)**

- **Advantages**: Automatic, passive discovery, battery efficient
- **How it works**: Service publishes itself, clients listen
- **Library**: `react-native-zeroconf`
- **Service type**: `_loudsync._tcp`
- **TXT Records**: Session metadata (name, member count, etc.)

```typescript
// Host advertises
zeroconf.registerService({
  name: "loudsync-session-abc123",
  type: "_loudsync._tcp",
  domain: ".local.",
  port: 8080,
  txt: {
    session_name: "Party",
    host_name: "Alice's iPhone",
    member_count: "3",
  },
});

// Client discovers
zeroconf.scan("_loudsync._tcp", ".local.", 5000);
```

#### **UDP Broadcast (Fallback)**

- **Advantages**: Fallback when mDNS fails, explicit control
- **How it works**: Host broadcasts packets, clients listen
- **Library**: `react-native-udp`
- **Port**: 9876
- **Protocol**: JSON payload in UDP packets

```typescript
// Host broadcasts
const message = `LOUDSYNC_RESPONSE:${JSON.stringify(advertisement)}`;
socket.send(buffer, BROADCAST_ADDRESS, 9876);

// Client discovery request
socket.send("LOUDSYNC_DISCOVER", BROADCAST_ADDRESS, 9876);

// Host responds with session info
```

#### **QR Code Join (Optional/Future)**

- Manual scanning of QR code containing:
  - Session ID
  - Host IP + Port
  - Join token (if password protected)

---

### 2. Implementation Details

#### **Discovery Flow**

```
Client initiates discovery
│
├─ discoveryManager.startDiscovery({
│    timeout: 5000,
│    method: 'mdns',
│    useFallback: true
│  })
│
├─ [Parallel]
│  ├─ MDNSDiscoveryService
│  │  ├─ zeroconf.scan()
│  │  └─ Listen for services
│  │
│  └─ UDPDiscoveryService (if mDNS fails)
│     ├─ Listen on port 9876
│     └─ Send discovery broadcasts
│
├─ Session Found Event
│  ├─ Deduplicate by sessionId
│  ├─ Track lastSeen timestamp
│  ├─ Store signalStrength
│  └─ Call onSessionFound(session)
│
└─ After timeout or stopDiscovery()
   ├─ Expire sessions not seen in 15s
   └─ Notify onSessionLost(sessionId)
```

#### **Session Advertisement**

```typescript
interface SessionAdvertisement {
  sessionId: string; // Unique ID
  sessionName: string; // "Alice's Party"
  hostId: string; // Device ID of host
  hostName: string; // "Alice's iPhone"
  hostAddress: string; // "192.168.1.100"
  port: number; // TCP port for joins (8080)
  memberCount: number; // Current members
  maxMembers: number; // Max capacity
  isPasswordProtected: boolean; // Join requires password
  version: string; // Protocol version
  timestamp: number; // When advertised
}
```

#### **Deduplication Strategy**

Sessions are deduplicated by `sessionId`:

```typescript
// Map: sessionId -> { data, expiresAt }

// New session → Add to map
// Existing session + same discovery method → Update lastSeen only
// Existing session + mDNS (better) → Upgrade from UDP to mDNS
// Session not seen for 15s → Remove & call onSessionLost()
```

#### **Timeout & Expiry**

```typescript
// Discovery timeout (5s default)
// → Stop scanning after 5 seconds
// → Return all discovered sessions

// Session expiry (15s default)
// → If no update for 15 seconds
// → Assume host went offline
// → Remove from list
// → Call onSessionLost(sessionId)

// Check every 1 second for expired sessions
```

---

### 3. File Structure

```
src/network/
├── types.ts                    # Shared types
├── mdnsDiscovery.ts           # mDNS service
├── udpDiscovery.ts            # UDP fallback
├── hostBroadcast.ts           # Host broadcaster
├── discoveryManager.ts        # Orchestrator
└── index.ts                   # Public API

src/state/slices/
├── sessionSlice.ts            # Integrated actions
└── [other slices...]

State Integration:
├── discoverSessions()         # Call discoveryManager
├── startHosting()             # Call hostBroadcastService
├── stopHosting()              # Stop broadcasts
└── addDiscoveredSession()     # Map results to state
```

---

### 4. Usage Examples

#### **Starting Discovery (Client)**

```typescript
import { useSessionActions } from '@/src/state';

function JoinSessionScreen() {
  const { discoverSessions, stopDiscovery } = useSessionActions();
  const sessions = useLoudSyncStore(state => state.discoveredSessions);

  useEffect(() => {
    // Start 5-second discovery scan
    discoverSessions();

    return () => stopDiscovery();
  }, []);

  return (
    <FlatList
      data={sessions}
      renderItem={({ item }) => (
        <SessionCard
          session={item.session}
          signal={item.signalStrength}
        />
      )}
    />
  );
}
```

#### **Starting Broadcast (Host)**

```typescript
import { useSessionActions } from '@/src/state';

function CreateSessionScreen() {
  const { createSession, startHosting } = useSessionActions();

  const handleCreateParty = async () => {
    // Step 1: Create session object
    await createSession("My Party");

    // Step 2: Start broadcasting on LAN
    await startHosting();

    // Now discoverable for 5 minutes
  };

  return <Button onPress={handleCreateParty} title="Create Party" />;
}
```

#### **Joining a Session (Client)**

```typescript
function JoinSessionScreen() {
  const { discoverSessions, joinSession } = useSessionActions();
  const sessions = useDiscoveredSessions();

  const handleJoin = async (sessionId: string) => {
    // Connects to host and joins
    await joinSession(sessionId);
    // Now in session as "client"
  };

  return (
    <FlatList
      data={sessions}
      renderItem={({ item }) => (
        <Button
          title={`Join: ${item.session.name}`}
          onPress={() => handleJoin(item.session.id)}
        />
      )}
    />
  );
}
```

---

### 5. Network Flow Diagrams

#### **Host Broadcasting Flow**

```
Host Device
├─ Session Created
│  └─ SessionAdvertisement {
│     sessionId: "sess-123",
│     sessionName: "Party",
│     memberCount: 1
│  }
│
├─ startHosting()
│  ├─ Register mDNS: _loudsync._tcp
│  │  └─ TXT: {session_name: "Party", member_count: "1", ...}
│  │
│  └─ Start UDP broadcasts every 3s
│     └─ Send: "LOUDSYNC_RESPONSE:{...advertisement...}"
│
└─ Continue advertising until stopHosting()
   ├─ Update advertisement if memberCount changes
   ├─ Re-broadcast every 3 seconds
   └─ Stop when user leaves or app closes
```

#### **Client Discovery Flow**

```
Client Device
├─ User: "Join a session"
│
├─ discoverSessions()
│  ├─ Start MDNSDiscoveryService
│  │  ├─ zeroconf.scan("_loudsync._tcp")
│  │  └─ Listen for "found" events
│  │
│  ├─ If mDNS fails → Start UDPDiscoveryService
│  │  ├─ Bind to port 9876
│  │  ├─ Send "LOUDSYNC_DISCOVER" broadcast
│  │  └─ Listen for responses
│  │
│  └─ discoveryManager
│     ├─ Deduplicate results
│     ├─ Track signal strength
│     └─ Update state.discoveredSessions
│
├─ Display discovered sessions
│  └─ User: "Join Alice's Party"
│
├─ joinSession(sessionId)
│  ├─ Find session in discoveredSessions
│  ├─ Connect to host TCP (Phase 1.2)
│  ├─ Add self to session
│  └─ Update state.status = "connected"
│
└─ Now in session as "client"
```

---

### 6. Error Handling

```typescript
// Network Issues
discoverSessions().catch((error) => {
  if (error.mDNSFailed && fallbackToUDP) {
    // Try UDP
  } else {
    // Show error
  }
});

// Session Disappeared
onSessionLost = (sessionId) => {
  // Remove from list
  // Show "Session no longer available"
};

// Connection Failed
joinSession(sessionId).catch((error) => {
  if (error.code === "TIMEOUT") {
    // Host unreachable
  } else if (error.code === "REJECTED") {
    // Host rejected join request
  }
});
```

---

### 7. Performance Optimization

**Deduplication**: Prevents duplicate state updates

```typescript
// Before: 5 sessions, 3 from mDNS + 2 from UDP = 5 duplicates
// After: 5 sessions, mDNS preferred, UDP ignored
```

**Expiry Checking**: Removes stale sessions automatically

```typescript
// Before: Dead hosts stay in list forever
// After: Auto-remove after 15s no-update
```

**Method Preference**: Prioritizes mDNS

```typescript
// Both methods discover same session?
// → Keep mDNS (more reliable, 100% signal)
// → Ignore UDP (fallback, 75% signal)
```

**Listener Pattern**: Avoids full state reloads

```typescript
// Before: Re-render entire session list on each discovery
// After: Only notify of changes, state updates optimized
```

---

### 8. Next Steps (Phase 1.2)

1. **TCP Connection Handler**
   - Replace simulation in `joinSession()`
   - Real TCP connection to host

2. **Local IP Detection**
   - Get device's LAN IP
   - Use in broadcasts

3. **Network Utils**
   - Retry logic with exponential backoff
   - Connection health monitoring
   - Graceful reconnection

4. **Testing**
   - Multiple devices on same network
   - Network failure scenarios
   - Session expiry verification

---

### 9. Known Limitations

- **mDNS**: Not available on all Android devices
- **UDP**: May be blocked by some routers
- **IPv6**: Currently supports IPv4 only
- **Cross-network**: LAN only (no internet routing)
- **Security**: No encryption (Phase 2)
