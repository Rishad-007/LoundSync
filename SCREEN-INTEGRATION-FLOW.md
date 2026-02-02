# Screen Integration Flow

**Complete Zustand integration for CreateSession, JoinSession, and PlayerRoom screens**

## Overview

All three main screens are now fully integrated with the Zustand store. The UI reactively updates based on state changes, with proper loading indicators, error handling, and connection status displays.

---

## 1. Create Session Flow

### Screen: `app/create-session.tsx`

### Zustand Hooks Used

```typescript
const { createSession, startHosting } = useSessionActions();
const sessionStatus = useSessionStatus();
const sessionError = useSessionError();
```

### Flow Sequence

1. **User fills form** (session name, max devices, etc.)
2. **Taps "Start Session" button**
3. **Loading state begins** (`isCreating = true`)
4. **Call `createSession(name)`**
   - Creates session object in Zustand store
   - Sets `role: "host"`
   - Sets `status: "creating"`
5. **Call `startHosting()`**
   - Starts WebSocket server via SessionServerManager
   - Starts mDNS/UDP broadcasts via hostBroadcastService
   - Sets up server event callbacks
   - Updates `status: "hosting"`
6. **Navigate to `/player-room`**
   - No URL params needed - Zustand is source of truth
7. **On error**: Show alert, reset loading state

### UI States

| State      | Display                            |
| ---------- | ---------------------------------- |
| `idle`     | Form ready                         |
| `creating` | "Creating session..." with spinner |
| `hosting`  | "Starting host..." with spinner    |
| `error`    | Red error card with message        |

### Code Example

```typescript
const handleCreateSession = async () => {
  try {
    setIsCreating(true);

    // Step 1: Create session
    await createSession(sessionName.trim() || "My Party");

    // Step 2: Start hosting
    await startHosting();

    // Step 3: Navigate
    router.push("/player-room");
  } catch (error) {
    Alert.alert("Failed to Create Session", error.message);
  }
};
```

---

## 2. Join Session Flow

### Screen: `app/join-session.tsx`

### Zustand Hooks Used

```typescript
const { discoverSessions, stopDiscovery, joinSession } = useSessionActions();
const discoveredSessionsFromStore = useDiscoveredSessions();
const sessionStatus = useSessionStatus();
const sessionError = useSessionError();
```

### Flow Sequence

#### Discovery Phase

1. **Component mounts**
2. **Call `discoverSessions()`**
   - Starts mDNS/UDP discovery via discoveryManager
   - Sets `status: "discovering"`
   - Subscribe to discovery updates
3. **Sessions appear in UI** as they're discovered
4. **Radar animation runs** for 5 seconds

#### Join Phase (Discovered Session)

1. **User taps "Join" on discovered session**
2. **Loading state begins** (`isJoining = true`)
3. **Call `joinSession(sessionId)`**
   - Creates WebSocket client
   - Connects to host
   - Sends JOIN message
   - Waits for WELCOME + MEMBER_LIST
   - Updates `status: "connected"`
   - Sets `role: "client"`
4. **Navigate to `/player-room`**

#### Join Phase (Manual Code)

1. **User enters session code** (XXX-XXX format)
2. **Validates format** (6 characters)
3. **Checks sessionRegistry** for active session
4. **Same as discovered session flow** from step 2

### UI States

| State         | Display                              |
| ------------- | ------------------------------------ |
| `idle`        | Discovery inactive                   |
| `discovering` | Radar animation, "Scanning..."       |
| `joining`     | "Connecting to host..." with spinner |
| `connected`   | "Joining session..." with spinner    |
| `error`       | Red error card with message          |

### Code Example

```typescript
const handleJoinSession = async (session?: DiscoveredSessionData) => {
  try {
    setIsJoining(true);

    const sessionIdToJoin = session
      ? session.advertisement.sessionId
      : validateAndGetSessionId(sessionCode);

    // Join via WebSocket
    await joinSession(sessionIdToJoin);

    // Navigate
    router.push("/player-room");
  } catch (error) {
    Alert.alert("Failed to Join Session", error.message);
  }
};
```

---

## 3. Player Room Flow

### Screen: `app/player-room.tsx`

### Zustand Hooks Used

```typescript
const session = useCurrentSession();
const members = useMembers();
const isHost = useIsHost();
const sessionStatus = useSessionStatus();
const { leaveSession, stopHosting } = useSessionActions();
```

### Flow Sequence

#### On Mount

1. **Check for active session**
   - If no session exists → redirect to `/home`
2. **Display session info** from Zustand state
   - Session name from `session.name`
   - Session code from `session.id`
   - Member list from `members` array
3. **Show connection status badge**
   - "Hosting" (green) if `status === "hosting"`
   - "Connected" (cyan) if `status === "connected"`
   - "Joining..." (yellow) if `status === "joining"`

#### Real-time Updates

Members list updates automatically via Zustand callbacks:

**For Host:**

- `onMemberJoined` → calls `addMember()` → UI updates
- `onMemberLeft` → calls `removeMember()` → UI updates
- `onMemberListChanged` → updates member count

**For Client:**

- `onMemberJoined` message → adds to members array
- `onMemberLeft` message → removes from members array
- `onMemberList` message → rebuilds full list

#### Leave Session

1. **User taps back button** or "Leave" button
2. **Show confirmation alert**
   - "End Session?" if host
   - "Leave Session?" if client
3. **Call appropriate action**
   - Host: `stopHosting()` → stops server + broadcasts
   - Client: `leaveSession()` → disconnects WebSocket
4. **Navigate to `/home`**

### UI Components

#### Status Badge

```typescript
{sessionStatus === "hosting" && (
  <View style={styles.hostingBadge}>
    <Ionicons name="radio" size={14} color={green} />
    <AppText>Hosting</AppText>
  </View>
)}
```

#### Member Cards

- Displays all connected members from `members` array
- Shows name, role (host/client), connection status
- Real-time updates as members join/leave
- Empty slots for remaining capacity

#### Session Info

- **Devices**: `members.length`
- **Latency**: Average from member latencies
- **Sync Health**: Calculated from latency variance

### Code Example

```typescript
// Redirect if no session
useEffect(() => {
  if (!session && sessionStatus === "idle") {
    router.replace("/home");
  }
}, [session, sessionStatus]);

// Leave/End session
const handleLeaveSession = async () => {
  Alert.alert(
    isHost ? "End Session?" : "Leave Session?",
    isHost ? "Disconnects all users" : "Are you sure?",
    [
      { text: "Cancel" },
      {
        text: isHost ? "End Session" : "Leave",
        onPress: async () => {
          if (isHost) {
            await stopHosting();
          } else {
            leaveSession();
          }
          router.replace("/home");
        },
      },
    ],
  );
};
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ZUSTAND STORE                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SessionSlice                                                │ │
│  │  • status: "idle" | "creating" | "hosting" | ...           │ │
│  │  • role: "host" | "client" | null                          │ │
│  │  • currentSession: Session | null                          │ │
│  │  • members: Member[]                                       │ │
│  │  • discoveredSessions: DiscoveredSession[]                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    ┌─────────┼─────────┐
                    │         │         │
          ┌─────────▼─────┐  │  ┌──────▼──────┐
          │ CreateSession │  │  │ JoinSession │
          │   Screen      │  │  │   Screen    │
          └───────────────┘  │  └─────────────┘
                             │
                    ┌────────▼────────┐
                    │  PlayerRoom     │
                    │    Screen       │
                    └─────────────────┘

HOST FLOW:
CreateSession → createSession() → startHosting() → PlayerRoom
                                       │
                                       ▼
                            SessionServerManager
                            (WebSocket Server)
                                       │
                                       ▼
                            hostBroadcastService
                            (mDNS + UDP)

CLIENT FLOW:
JoinSession → discoverSessions() → joinSession() → PlayerRoom
                      │                   │
                      ▼                   ▼
              discoveryManager    WebSocketService
              (mDNS + UDP)        (WebSocket Client)
```

---

## State Transitions

### Host Journey

```
idle
  ↓ createSession()
creating
  ↓ startHosting()
hosting ←─────────────────┐
  ↓                       │
  │  (members join/leave) │
  │─────────────────────→ │
  ↓ stopHosting()
idle
```

### Client Journey

```
idle
  ↓ discoverSessions()
discovering
  ↓ joinSession()
joining
  ↓ (WebSocket connected)
connected ←───────────────┐
  ↓                       │
  │  (other members j/l)  │
  │─────────────────────→ │
  ↓ leaveSession()
idle
```

---

## Error Handling

### All Screens

- Try-catch blocks around all async Zustand actions
- Display `Alert.alert()` with error message
- Reset loading state on error
- Show error state in UI with red card

### Common Errors

| Error               | Screen      | Handling             |
| ------------------- | ----------- | -------------------- |
| No local device     | Create/Join | Alert + block action |
| Session not found   | Join        | Alert "Invalid code" |
| Connection failed   | Join        | Alert + reset state  |
| Server start failed | Create      | Alert + reset state  |
| No active session   | PlayerRoom  | Redirect to home     |

---

## Testing Checklist

### Create Session

- ✅ Form validation (empty name = "My Party")
- ✅ Loading state displays
- ✅ Error handling (show alert)
- ✅ Navigation to player room
- ✅ Session persists in Zustand

### Join Session

- ✅ Discovery starts automatically
- ✅ Sessions appear in list
- ✅ Join via discovered session works
- ✅ Manual code entry validation
- ✅ Invalid code shows error
- ✅ Loading state during join
- ✅ Navigation to player room

### Player Room

- ✅ Session info displays correctly
- ✅ Status badge shows current state
- ✅ Member list updates in real-time
- ✅ Leave/End session confirmation
- ✅ Redirect if no session
- ✅ Host vs Client UI differences

---

## Mock Indicators

All screens now show clear state indicators:

### CreateSession

- 🟡 "Creating session..." (yellow spinner)
- 🟢 "Starting host..." (cyan spinner)
- 🔴 Error message (red alert icon)

### JoinSession

- 🔵 "Scanning..." (radar animation)
- 🟡 "Connecting to host..." (yellow spinner)
- 🟢 "Joining session..." (cyan spinner)
- 🔴 Error message (red alert icon)

### PlayerRoom

- 🟢 "Hosting" badge (green, host only)
- 🔵 "Connected" badge (cyan, client only)
- 🟡 "Joining..." badge (yellow, transition state)
- Device count: `3 / 8`
- Latency: `12ms`
- Sync health: `98%`

---

## Next Steps

### Immediate (Phase 1)

- ✅ Host & Join flow complete
- ✅ Loading states implemented
- ✅ Error handling in place
- ✅ Real-time member list

### Future (Phase 2)

- ⏳ Audio playback integration
- ⏳ Sync timing mechanism
- ⏳ Reconnection logic
- ⏳ Session persistence

### Future (Phase 3)

- ⏳ Native WebSocket module
- ⏳ Production device testing
- ⏳ Performance optimization
- ⏳ Advanced error recovery

---

## Technical Notes

### No URL Params

Previous implementation used `useLocalSearchParams` to pass session info via URL. **This is now removed.** Zustand is the single source of truth.

**Before:**

```typescript
const params = useLocalSearchParams<{
  sessionId: string;
  sessionName: string;
  isHost: string;
}>();
```

**After:**

```typescript
const session = useCurrentSession(); // from Zustand
const isHost = useIsHost(); // from Zustand
```

### Reactive Updates

All UI components use Zustand selectors that trigger re-renders automatically:

```typescript
// These hooks subscribe to Zustand changes
const members = useMembers(); // Re-renders when members change
const session = useCurrentSession(); // Re-renders when session changes
const sessionStatus = useSessionStatus(); // Re-renders when status changes
```

### Cleanup

All screens properly clean up on unmount:

- Stop discovery when leaving JoinSession
- No manual cleanup needed for PlayerRoom (Zustand handles it)

---

## Summary

All three screens are now fully wired to Zustand with:

✅ **Real state management** (no mock/hardcoded data)  
✅ **Loading indicators** (spinners, status badges)  
✅ **Error handling** (alerts, error cards)  
✅ **Reactive UI** (auto-updates from Zustand)  
✅ **Connection status** ("Hosting", "Connected", "Joining...")  
✅ **Member list display** (real-time updates)  
✅ **Proper navigation** (no URL params dependency)  
✅ **Clean code** (hooks, try-catch, console logs)

**Ready for Phase 2: Audio & Sync** 🎵
