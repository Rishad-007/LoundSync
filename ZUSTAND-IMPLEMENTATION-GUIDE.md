# LOUDSYNC Zustand Store Implementation

**Phase 1: Session Hosting & Joining**

> Complete reference for the state management layer

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   React Components                   │
│          (CreateSession, JoinSession, etc.)          │
└──────────────────────┬──────────────────────────────┘
                       │ useSessionActions()
                       │ useMembers()
                       │ useSessionStatus()
                       ▼
┌─────────────────────────────────────────────────────┐
│              Zustand Store (Combined)                │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ UserSlice  │  │SessionSlice│  │DeviceSlice │   │
│  └────────────┘  └────────────┘  └────────────┘   │
│                                                      │
│  ┌────────────┐                                     │
│  │NetworkSlice│                                     │
│  └────────────┘                                     │
└──────────────────────┬──────────────────────────────┘
                       │ (Future: Network Layer)
                       ▼
              ┌────────────────┐
              │  Network Layer │
              │  (Phase 1.2+)  │
              └────────────────┘
```

---

## Slices Breakdown

### 1. UserSlice

**Purpose:** Manages local device identity

**State:**

```typescript
{
  localDevice: LocalDevice | null; // Persistent device info
  isOnboarded: boolean; // Has completed setup
}
```

**Key Actions:**

- `setLocalDevice(device)` - Set device info
- `updateDeviceName(name)` - Change device name
- `generateDeviceId()` - Create new device ID
- `setOnboarded(boolean)` - Mark onboarding complete

**When to use:**

- App initialization
- Device name customization
- Checking if user is set up

---

### 2. SessionSlice

**Purpose:** Manages session lifecycle

**State:**

```typescript
{
  status: ConnectionStatus;          // idle, hosting, discovering, joining, connected
  role: 'host' | 'client' | null;    // Current role
  currentSession: Session | null;     // Active session info
  discoveredSessions: DiscoveredSession[];  // Found sessions
  connectedAt: number | null;        // Join timestamp
  error: string | null;              // Last error
}
```

**Key Actions:**

- `createSession(name)` - Create session object
- `startHosting()` - Begin broadcasting (host)
- `stopHosting()` - Stop broadcasting (host)
- `discoverSessions()` - Scan for sessions (client)
- `joinSession(sessionId)` - Connect to session (client)
- `leaveSession()` - Exit current session

**State Transitions:**

```
Host:   idle → hosting → idle
Client: idle → discovering → joining → connected → idle
```

---

### 3. DeviceSlice

**Purpose:** Manages members in a session

**State:**

```typescript
{
  members: Member[];               // All members
  host: Member | null;             // Host reference
  connectedCount: number;          // Connected members
  pendingRequests: Member[];       // Join requests (host)
}
```

**Key Actions:**

- `addMember(member)` - Add to session
- `removeMember(id)` - Remove from session
- `updateMember(id, updates)` - Modify member
- `setHost(member)` - Set host reference
- `acceptRequest(id)` - Approve join (host)
- `rejectRequest(id)` - Deny join (host)
- `kickMember(id)` - Remove member (host)

**Helper Functions:**

- `getMember(id)` - Find member
- `getAllMembers()` - Get all
- `getConnectedMembers()` - Filter connected
- `isHost()` - Check if current device is host

---

### 4. NetworkSlice

**Purpose:** Tracks network status and quality

**State:**

```typescript
{
  isNetworkAvailable: boolean; // Online/offline
  networkType: "wifi" | "cellular" | "none";
  localIP: string | null; // Device IP
  quality: NetworkQuality; // excellent, good, fair, poor, critical
  metrics: NetworkMetrics; // Latency, packet loss, etc.
  lastError: ConnectionError | null;
}
```

**Key Actions:**

- `checkNetwork()` - Check connectivity
- `setNetworkAvailable(boolean)` - Update status
- `updateMetrics(updates)` - Update metrics
- `setError(error)` - Record error
- `clearError()` - Clear error

---

## Action Explanations

### createSession(name: string)

**What it does:**

1. Validates local device exists
2. Creates session object with metadata
3. Sets status to `idle`, role to `host`
4. Adds self as first member
5. Sets host reference

**Mock behavior:** Creates in-memory session

**Real implementation:** Would initialize network server

**Example:**

```typescript
await createSession("Alice's Party");
// session.id = "session_1234_abc"
// role = "host"
// members = [{ id: localDevice.id, role: "host", ... }]
```

---

### startHosting()

**What it does:**

1. Validates session exists
2. Validates role is host
3. Changes status to `hosting`

**Mock behavior:** Just updates state

**Real implementation:** Would start UDP broadcasting

**Example:**

```typescript
await createSession("My Session");
await startHosting();
// status = "hosting"
// Network layer starts broadcasting session info
```

---

### stopHosting()

**What it does:**

1. Stops broadcasting
2. Notifies all clients
3. Clears session
4. Resets status to `idle`

**Mock behavior:** Clears state

**Real implementation:** Sends disconnect messages, stops server

---

### discoverSessions()

**What it does:**

1. Sets status to `discovering`
2. Scans network for sessions
3. Populates `discoveredSessions`

**Mock behavior:** Returns 2 fake sessions after 1.5s delay

**Real implementation:** UDP broadcast listener

**Example:**

```typescript
await discoverSessions();
// status = "discovering"
// After delay...
// discoveredSessions = [
//   { session: {...}, signalStrength: 85, ... },
//   { session: {...}, signalStrength: 92, ... }
// ]
```

---

### joinSession(sessionId: string)

**What it does:**

1. Finds session in discovered list
2. Sets status to `joining`
3. Connects to host
4. On success: status → `connected`, role → `client`
5. Adds self and host to members

**Mock behavior:** 1s delay, then success

**Real implementation:** TCP handshake with host

**Example:**

```typescript
await joinSession("mock-session-1");
// status: "joining" → "connected"
// role: "client"
// currentSession: { ... }
// members: [host, self]
```

---

### leaveSession()

**What it does:**

- If host: calls `stopHosting()`
- If client: disconnects, clears state

**Mock behavior:** Resets state

**Real implementation:** Sends leave message to host

---

### addDevice(member: Member)

**What it does:**

1. Validates member doesn't exist
2. Adds to members array
3. Updates connectedCount

**When called:**

- Host: When accepting join request
- Client: When receiving member list update

---

### removeDevice(memberId: string)

**What it does:**

1. Removes from members array
2. Updates connectedCount

**When called:**

- Member disconnects
- Member is kicked

---

### setHost(member: Member)

**What it does:**

- Sets `host` reference for quick access

**When called:**

- After creating session (self as host)
- After joining session (remote host)

---

### acceptRequest(memberId: string)

**Host only**

**What it does:**

1. Finds pending request
2. Removes from pendingRequests
3. Adds to members
4. (Future) Sends acceptance + member list to client

**Mock behavior:** Moves from pending to members

---

### rejectRequest(memberId: string)

**Host only**

**What it does:**

1. Finds pending request
2. Removes from pendingRequests
3. (Future) Sends rejection message

---

### kickMember(memberId: string)

**Host only**

**What it does:**

1. Validates member exists and is not host
2. Removes member
3. (Future) Sends kick notification

---

## Persistence

**What is persisted:**

```typescript
{
  localDevice: LocalDevice | null;
  isOnboarded: boolean;
}
```

**What is NOT persisted:**

- Session state
- Member list
- Discovered sessions
- Network metrics

**Why:**
Sessions are ephemeral. Only device identity needs to survive app restarts.

---

## Selector Hooks Reference

### User

```typescript
useLocalDevice(); // LocalDevice | null
useIsOnboarded(); // boolean
```

### Session

```typescript
useSessionStatus(); // ConnectionStatus
useSessionRole(); // 'host' | 'client' | null
useCurrentSession(); // Session | null
useDiscoveredSessions(); // DiscoveredSession[]
useSessionError(); // string | null
```

### Members

```typescript
useMembers(); // Member[]
useHost(); // Member | null
useConnectedCount(); // number
usePendingRequests(); // Member[]
useIsHost(); // boolean
```

### Network

```typescript
useNetworkAvailable(); // boolean
useNetworkType(); // 'wifi' | 'cellular' | 'none'
useNetworkQuality(); // NetworkQuality
useNetworkMetrics(); // NetworkMetrics
useNetworkError(); // ConnectionError | null
```

---

## Action Hooks Reference

```typescript
const { setLocalDevice, updateDeviceName, ... } = useUserActions();
const { createSession, startHosting, ... } = useSessionActions();
const { addMember, removeMember, ... } = useMemberActions();
const { checkNetwork, updateMetrics } = useNetworkActions();
```

---

## Testing the Store

### Unit Test Example

```typescript
import { renderHook, act } from "@testing-library/react-hooks";
import { useLoudSyncStore } from "@/src/state";

describe("SessionSlice", () => {
  beforeEach(() => {
    useLoudSyncStore.getState().reset();
  });

  it("creates a session", async () => {
    const { result } = renderHook(() => useLoudSyncStore());

    // Setup device
    act(() => {
      result.current.generateDeviceId();
    });

    // Create session
    await act(async () => {
      await result.current.createSession("Test Session");
    });

    expect(result.current.currentSession).toBeTruthy();
    expect(result.current.currentSession?.name).toBe("Test Session");
    expect(result.current.role).toBe("host");
    expect(result.current.members.length).toBe(1);
  });

  it("discovers mock sessions", async () => {
    const { result } = renderHook(() => useLoudSyncStore());

    await act(async () => {
      await result.current.discoverSessions();
    });

    expect(result.current.discoveredSessions.length).toBeGreaterThan(0);
    expect(result.current.status).toBe("discovering");
  });
});
```

---

## Migration Path to Real Network

When implementing the real network layer in Phase 1.2:

1. **Create network module:**

   ```typescript
   // src/network/index.ts
   export class NetworkManager {
     static startBroadcast(session: Session) { ... }
     static scanForSessions() { ... }
     static connectToHost(address: string) { ... }
   }
   ```

2. **Replace mock calls in slices:**

   ```typescript
   // Before (Mock)
   await new Promise((resolve) => setTimeout(resolve, 1500));

   // After (Real)
   const sessions = await NetworkManager.scanForSessions();
   ```

3. **Add event listeners:**

   ```typescript
   NetworkManager.on("sessionFound", (session) => {
     store.getState().addDiscoveredSession(session);
   });
   ```

4. **Keep state logic unchanged**
   - State management stays the same
   - Only implementation details change

---

## Best Practices

1. **Always check device exists:**

   ```typescript
   if (!get().localDevice) {
     throw new Error("Device not initialized");
   }
   ```

2. **Use selectors to avoid re-renders:**

   ```typescript
   // ❌ Bad: Re-renders on any state change
   const store = useLoudSyncStore();

   // ✅ Good: Re-renders only when status changes
   const status = useSessionStatus();
   ```

3. **Handle errors with try-catch:**

   ```typescript
   try {
     await createSession(name);
   } catch (error) {
     Alert.alert("Error", error.message);
   }
   ```

4. **Clean up on unmount:**

   ```typescript
   useEffect(() => {
     discoverSessions();
     return () => stopDiscovery();
   }, []);
   ```

5. **Use helpers for computed values:**
   ```typescript
   const isHost = useIsHost(); // Better than checking role manually
   ```

---

## Debugging Tips

1. **Enable dev logging:**

   ```typescript
   if (__DEV__) {
     useLoudSyncStore.subscribe(console.log);
   }
   ```

2. **Use Zustand DevTools:**

   ```typescript
   import { devtools } from "zustand/middleware";

   export const useLoudSyncStore = create(
     devtools(persist(...), { name: "LoudSync" })
   );
   ```

3. **Log action calls:**

   ```typescript
   const { createSession } = useSessionActions();

   const handleCreate = async (name: string) => {
     console.log("Creating session:", name);
     await createSession(name);
     console.log(
       "Session created:",
       useLoudSyncStore.getState().currentSession,
     );
   };
   ```

---

## Summary

✅ **4 Slices:** User, Session, Device, Network
✅ **Mock implementations** for all actions
✅ **Type-safe** with TypeScript
✅ **Persists** only device identity
✅ **Clean separation** of concerns
✅ **Ready for** real network integration
✅ **Follows** SESSION-ARCHITECTURE.md spec

**Next steps:**

- Implement screens using these hooks
- Add network layer (Phase 1.2)
- Replace mock implementations with real network calls

---

_Generated: February 2, 2026_
_Version: 1.0.0_
