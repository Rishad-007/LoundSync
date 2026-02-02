# LOUDSYNC Zustand State Architecture

## 📋 Overview

This is the complete state management system for LOUDSYNC built with Zustand. The architecture provides:

- **Type-safe** state management with full TypeScript support
- **Modular slices** for different concerns (user, session, devices, playback, sync, network)
- **Persistence** layer using AsyncStorage for critical user preferences
- **Custom hooks** for business logic and derived state
- **No business logic in UI** - pure separation of concerns

---

## 📁 File Structure

```
src/state/
├── types.ts                 # All TypeScript interfaces and types
├── store.ts                 # Main store combining all slices + persistence
├── index.ts                 # Public API exports
└── slices/
    ├── userSlice.ts         # User identity and onboarding
    ├── sessionSlice.ts      # Session lifecycle (create/join/leave)
    ├── deviceSlice.ts       # Connected devices management
    ├── playbackSlice.ts     # Audio playback state and controls
    ├── syncSlice.ts         # Clock synchronization state
    └── networkSlice.ts      # Network connection and discovery

src/hooks/
└── index.ts                 # Custom business logic hooks
```

---

## 🎯 State Slices

### 1. **User Slice** (`userSlice.ts`)

**Responsibility**: User identity and onboarding status

**State**:

```typescript
{
  user: User | null,          // Current user profile
  isOnboarded: boolean        // Has completed onboarding
}
```

**Actions**:

- `setUser(user)` - Set current user
- `updateUser(updates)` - Update specific user fields
- `clearUser()` - Logout/clear user data
- `setOnboarded(value)` - Mark onboarding completion

**Usage**:

```typescript
const user = useUser();
const { setUser } = useLoudSyncStore();

setUser({
  id: "user_123",
  name: "John Doe",
  deviceName: "iPhone 14",
});
```

---

### 2. **Session Slice** (`sessionSlice.ts`)

**Responsibility**: Session lifecycle management

**State**:

```typescript
{
  mode: 'idle' | 'host' | 'client',
  status: 'creating' | 'active' | 'closed' | 'error',
  sessionInfo: SessionInfo | null,
  connectedAt: number | null,
  error: string | null
}
```

**Actions**:

- `createSession(name, trackUri)` - Create session as host
- `joinSession(hostIp, sessionId)` - Join session as client
- `leaveSession()` - Leave/end current session
- `setSessionMode(mode)` - Set mode directly
- `setSessionStatus(status)` - Set status
- `setSessionInfo(info)` - Update session metadata
- `setError(error)` - Set error message

**Usage**:

```typescript
const { mode, sessionInfo, createSession, joinSession, leaveSession } =
  useSession();

// As host
await createSession("Party Time", "file://track.mp3");

// As client
await joinSession("192.168.1.100", "session_id");

// Leave
leaveSession();
```

**What happens on createSession()**:

1. Generates unique session ID
2. Sets mode to 'host'
3. Creates session info object
4. Adds self as host device
5. Ready for clients to join

**What happens on joinSession()**:

1. Sets mode to 'client'
2. Stores preliminary session info
3. Waits for full details from host
4. Triggers clock sync process

---

### 3. **Device Slice** (`deviceSlice.ts`)

**Responsibility**: Connected devices tracking

**State**:

```typescript
{
  devices: Map<string, Device>,
  connectedCount: number,
  hostDevice: Device | null
}
```

**Actions**:

- `addDevice(device)` - Add new device
- `removeDevice(deviceId)` - Remove device
- `updateDevice(deviceId, updates)` - Update device fields
- `setHostDevice(device)` - Set host device
- `clearDevices()` - Clear all devices

**Helpers**:

- `getDevice(id)` - Get specific device
- `getAllDevices()` - Get all as array
- `getConnectedDevices()` - Only connected
- `getSyncedDevices()` - Only synced
- `getClientDevices()` - Exclude host

**Usage**:

```typescript
const { devices, syncedCount, totalCount } = useDeviceList();

devices.forEach((device) => {
  console.log(`${device.name}: ${device.status}, latency: ${device.latency}ms`);
});
```

---

### 4. **Playback Slice** (`playbackSlice.ts`)

**Responsibility**: Audio playback state and controls

**State**:

```typescript
{
  playback: {
    state: 'idle' | 'loading' | 'playing' | 'paused' | 'stopped',
    track: Track | null,
    position: number,         // milliseconds
    duration: number,         // milliseconds
    volume: number,           // 0.0 - 1.0
    isMuted: boolean,
    scheduledPlayTime: number | null
  },
  queue: Track[],
  currentIndex: number,
  isLoading: boolean,
  error: string | null
}
```

**Actions**:

- `loadTrack(track)` - Load track for playback
- `setPlaybackState(state)` - Set state
- `play(scheduledTime?)` - Start playback
- `pause()` - Pause playback
- `stop()` - Stop and reset
- `seek(position)` - Seek to position
- `setVolume(volume)` - Set volume
- `toggleMute()` - Toggle mute
- `updatePosition(position)` - Update current position
- `setScheduledPlayTime(timestamp)` - Set sync timestamp
- `addToQueue(track)` - Add to queue
- `removeFromQueue(index)` - Remove from queue
- `clearQueue()` - Clear queue

**Helpers**:

- `isPlaying()` - Check if playing
- `isPaused()` - Check if paused
- `canPlay()` - Check if can play
- `getProgress()` - Get progress as percentage
- `getRemainingTime()` - Get remaining time

**Usage**:

```typescript
const { state, track, position, duration, play, pause, seek } = usePlayer();

// Load track
await loadTrack({
  id: "track_1",
  title: "Summer Vibes",
  artist: "Various",
  duration: 225000,
  uri: "file://song.mp3",
});

// Play with sync
const syncTime = Date.now() + 500; // 500ms buffer
play(syncTime);

// Seek
seek(60000); // 1 minute
```

---

### 5. **Sync Slice** (`syncSlice.ts`)

**Responsibility**: Clock synchronization state

**State**:

```typescript
{
  status: 'idle' | 'syncing' | 'synced' | 'drifted' | 'error',
  quality: 'excellent' | 'good' | 'fair' | 'poor',
  metrics: {
    clockOffset: number,      // ms offset from host
    latency: number,          // network latency
    jitter: number,           // latency variation
    drift: number,            // clock drift rate
    lastSyncTime: number,
    syncAttempts: number,
    successfulSyncs: number,
    failedSyncs: number
  },
  isSyncing: boolean,
  autoSyncEnabled: boolean,
  syncInterval: number
}
```

**Actions**:

- `updateSyncStatus(status)` - Update status
- `updateSyncMetrics(metrics)` - Update metrics
- `setSyncQuality(quality)` - Set quality
- `startSync()` - Start sync process
- `stopSync()` - Stop sync
- `setAutoSync(enabled)` - Enable/disable auto-sync
- `setSyncInterval(interval)` - Set sync interval
- `resetSync()` - Reset to initial state

**Helpers**:

- `getAdjustedTime()` - Current time + offset
- `isSynced()` - Check if synced
- `needsResync()` - Check if needs re-sync
- `getSyncAccuracy()` - Get accuracy in ms

**Usage**:

```typescript
const { isSynced, offsetMs, latencyMs, getSyncStatusText } = useSyncMonitor();

if (isSynced) {
  const adjustedTime = getAdjustedTime();
  console.log(`Synced with ±${offsetMs}ms offset, ${latencyMs}ms latency`);
}
```

**Quality Calculation**:

- **Excellent**: < 10ms total offset
- **Good**: < 30ms total offset
- **Fair**: < 100ms total offset
- **Poor**: >= 100ms total offset

---

### 6. **Network Slice** (`networkSlice.ts`)

**Responsibility**: Network connection and discovery

**State**:

```typescript
{
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error',
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical',
  metrics: {
    bandwidth: number,
    packetLoss: number,
    averageLatency: number,
    messagesReceived: number,
    messagesSent: number,
    bytesReceived: number,
    bytesSent: number
  },
  localIp: string | null,
  discoveredSessions: SessionInfo[],
  isDiscovering: boolean
}
```

**Actions**:

- `setConnectionStatus(status)` - Set status
- `setNetworkQuality(quality)` - Set quality
- `updateNetworkMetrics(metrics)` - Update metrics
- `setLocalIp(ip)` - Set local IP
- `addDiscoveredSession(session)` - Add discovered session
- `removeDiscoveredSession(id)` - Remove session
- `clearDiscoveredSessions()` - Clear all
- `setDiscovering(isDiscovering)` - Set discovery state
- `resetMetrics()` - Reset metrics

**Helpers**:

- `isConnected()` - Check if connected
- `hasGoodConnection()` - Check quality
- `getAverageLatency()` - Get avg latency

**Usage**:

```typescript
const { discoveredSessions, startDiscovery, stopDiscovery } =
  useSessionDiscovery();

// Start scanning
startDiscovery();

// Auto-discovered sessions will appear in discoveredSessions[]
discoveredSessions.forEach((session) => {
  console.log(`Found: ${session.sessionName} at ${session.hostIp}`);
});
```

---

## 🎣 Custom Hooks

### `useSession()`

Combines session state and actions

```typescript
const {
  mode,
  isHost,
  isClient,
  isInSession,
  createSession,
  joinSession,
  leaveSession,
} = useSession();
```

### `usePlayer()`

Combines playback state and actions

```typescript
const { state, track, position, duration, play, pause, seek, formatTime } =
  usePlayer();
```

### `useDeviceList()`

Provides device management

```typescript
const { devices, totalCount, syncedCount, allSynced } = useDeviceList();
```

### `useSyncMonitor()`

Monitors sync health

```typescript
const {
  isSynced,
  offsetMs,
  latencyMs,
  accuracy,
  getSyncStatusColor,
  getSyncStatusText,
} = useSyncMonitor();
```

### `useNetworkMonitor()`

Monitors network connection

```typescript
const { connectionStatus, isConnected, getConnectionStatusText } =
  useNetworkMonitor();
```

### `useSessionDiscovery()`

Manages session discovery

```typescript
const { discoveredSessions, isScanning, startDiscovery, stopDiscovery } =
  useSessionDiscovery();
```

### `useHostControls()` (Host only)

Provides host-specific controls

```typescript
const {
  canControl,
  clientCount,
  broadcastPlay,
  broadcastPause,
  broadcastSeek,
} = useHostControls();
```

### `useClientSync()` (Client only)

Manages client sync operations

```typescript
const { isSynced, isSyncing, performSync } = useClientSync();
```

---

## 💾 Persistence

**What is persisted** (AsyncStorage):

- `user` - User profile
- `isOnboarded` - Onboarding status
- `autoSyncEnabled` - Auto-sync preference
- `syncInterval` - Sync interval preference
- `volume` - Volume level
- `isMuted` - Mute state

**What is NOT persisted** (ephemeral):

- Session state (cleared on app restart)
- Devices (reconnect on restart)
- Network state (re-establish connections)
- Playback position (start fresh)

**Storage key**: `loudsync-storage`

---

## 🔄 Data Flow Examples

### Example 1: Create Session (Host)

```
User clicks "Create Session"
         ↓
[CreateSessionScreen]
  calls createSession('Party', 'track.mp3')
         ↓
[sessionSlice.createSession()]
  1. Generate session ID
  2. Set mode = 'host'
  3. Create sessionInfo
  4. Add host device
         ↓
[deviceSlice.addDevice(hostDevice)]
         ↓
[deviceSlice.setHostDevice(hostDevice)]
         ↓
State updated → UI re-renders
         ↓
Navigate to PlayerRoom
```

### Example 2: Join Session (Client)

```
User selects discovered session
         ↓
[JoinSessionScreen]
  calls joinSession(hostIp, sessionId)
         ↓
[sessionSlice.joinSession()]
  1. Set mode = 'client'
  2. Store session info
         ↓
[NetworkService] (outside store)
  connects to host via WebSocket
         ↓
[SyncService] (outside store)
  performs clock synchronization
         ↓
[syncSlice.updateSyncMetrics()]
  stores clockOffset, latency
         ↓
State updated → UI re-renders
         ↓
Navigate to PlayerRoom
```

### Example 3: Synchronized Play (Host → All)

```
Host clicks Play
         ↓
[PlayerRoomScreen]
  calls broadcastPlay(scheduledTime)
         ↓
[playbackSlice.play(scheduledTime)]
  updates local state
         ↓
[NetworkService] (outside store)
  broadcasts { type: 'PLAY', timestamp }
         ↓
All clients receive message
         ↓
Each client:
  adjustedTime = timestamp + clockOffset
         ↓
[AudioEngine] (outside store)
  schedules playback at adjustedTime
         ↓
All devices play simultaneously (±30ms)
```

---

## 🎯 Design Principles

### 1. **Separation of Concerns**

- ✅ Store = State + Actions
- ✅ Hooks = Business Logic + Derived State
- ✅ UI = Presentation Only
- ❌ NO business logic in components
- ❌ NO network calls in store

### 2. **Type Safety**

- All state fully typed with TypeScript
- Actions have proper type signatures
- Helpers return typed values

### 3. **Immutability**

- Zustand handles immutability automatically
- Never mutate state directly
- Always use actions

### 4. **Performance**

- Selective subscriptions via hooks
- Only re-render when specific slices change
- Map for devices (O(1) lookups)

### 5. **Developer Experience**

- Clear, descriptive action names
- Console logging for debugging
- Dev-only debug info in UI

---

## 📊 State Size Management

**Total state size** (typical session):

- User: ~200 bytes
- Session: ~500 bytes
- Devices (10 devices): ~2 KB
- Playback: ~1 KB
- Sync: ~500 bytes
- Network: ~1 KB

**Total: ~5 KB** (very lightweight)

---

## 🔧 Advanced Usage

### Direct Store Access (Services Layer)

```typescript
import { getStoreState } from "./src/state";

// In a service
class SyncService {
  performSync() {
    const store = getStoreState();
    const currentOffset = store.metrics.clockOffset;

    // Perform sync...

    store.updateSyncMetrics({ clockOffset: newOffset });
  }
}
```

### Subscribing to Changes

```typescript
import { useLoudSyncStore } from "./src/state";

// Subscribe to specific slice
const unsubscribe = useLoudSyncStore.subscribe(
  (state) => state.playback.state,
  (playbackState) => {
    console.log("Playback state changed:", playbackState);
  },
);

// Cleanup
unsubscribe();
```

### Resetting Store

```typescript
const { reset } = useLoudSyncStore();

// Reset everything to initial state
reset();
```

---

## 🚀 Next Steps

1. **Integrate with Services Layer**
   - Create NetworkService that updates networkSlice
   - Create SyncService that updates syncSlice
   - Create AudioService that updates playbackSlice

2. **Add Real-Time Updates**
   - Position updates from audio engine
   - Network metrics from WebSocket
   - Clock drift monitoring

3. **Testing**
   - Unit tests for each slice
   - Integration tests for flows
   - Mock store for component tests

4. **Optimization**
   - Add selectors for complex derived state
   - Implement middleware for logging
   - Add performance monitoring

---

## 📚 Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## ✅ Checklist

- [x] All slices created
- [x] TypeScript types defined
- [x] Persistence configured
- [x] Custom hooks implemented
- [x] Usage examples provided
- [ ] Integrate with services layer
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Performance profiling
- [ ] Production deployment

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-02  
**Author**: LOUDSYNC Team
