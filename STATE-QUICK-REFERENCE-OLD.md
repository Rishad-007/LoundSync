# LOUDSYNC State - Quick Reference

## 🚀 Installation

```bash
npm install zustand @react-native-async-storage/async-storage
```

or

```bash
yarn add zustand @react-native-async-storage/async-storage
```

---

## 📖 Import Guide

### Basic Imports

```typescript
// Main store
import { useLoudSyncStore } from "@/src/state";

// Custom hooks
import {
  useSession,
  usePlayer,
  useDeviceList,
  useSyncMonitor,
  useHostControls,
  useSessionDiscovery,
} from "@/src/hooks";

// Specific selectors
import {
  useUser,
  useSessionInfo,
  useCurrentTrack,
  useIsPlaying,
  useSyncStatus,
} from "@/src/state";

// Types
import type {
  User,
  SessionInfo,
  Track,
  Device,
  SyncMetrics,
} from "@/src/state";
```

---

## 🎯 Common Patterns

### Pattern 1: Create Session (Host)

```typescript
const { user } = useLoudSyncStore();
const { createSession } = useSessionActions();

await createSession("Party Name", "file://track.mp3");
```

### Pattern 2: Join Session (Client)

```typescript
const { joinSession } = useSessionActions();
const { performSync } = useClientSync();

await joinSession("192.168.1.100", "session_id");
await performSync();
```

### Pattern 3: Control Playback (Host)

```typescript
const { broadcastPlay, broadcastPause } = useHostControls();
const syncTime = Date.now() + 500; // 500ms buffer

broadcastPlay(syncTime);
```

### Pattern 4: Monitor Sync Status

```typescript
const { isSynced, offsetMs, latencyMs, getSyncStatusColor } = useSyncMonitor();

<View style={{ backgroundColor: getSyncStatusColor() }}>
  <Text>Offset: {offsetMs.toFixed(2)}ms</Text>
  <Text>Latency: {latencyMs.toFixed(2)}ms</Text>
</View>
```

### Pattern 5: Display Devices

```typescript
const { devices, syncedCount, totalCount } = useDeviceList();

{devices.map(device => (
  <Text key={device.id}>
    {device.name} - {device.status} ({device.latency}ms)
  </Text>
))}
```

### Pattern 6: Discover Sessions

```typescript
const { discoveredSessions, startDiscovery } = useSessionDiscovery();

useEffect(() => {
  startDiscovery();
}, []);

{discoveredSessions.map(session => (
  <Button onPress={() => joinSession(session.hostIp, session.sessionId)}>
    Join {session.sessionName}
  </Button>
))}
```

---

## 🔧 Action Reference

### Session Actions

```typescript
createSession(name, trackUri); // Create as host
joinSession(hostIp, sessionId); // Join as client
leaveSession(); // Leave/end session
```

### Playback Actions

```typescript
loadTrack(track)                  // Load track
play(scheduledTime?)              // Play (optionally synced)
pause()                           // Pause
stop()                            // Stop and reset
seek(position)                    // Seek to position (ms)
setVolume(volume)                 // Set volume (0-1)
toggleMute()                      // Toggle mute
```

### Device Actions

```typescript
addDevice(device); // Add device
removeDevice(deviceId); // Remove device
updateDevice(deviceId, updates); // Update device
```

### Sync Actions

```typescript
updateSyncStatus(status); // Update status
updateSyncMetrics(metrics); // Update metrics
startSync(); // Start sync
stopSync(); // Stop sync
```

### Network Actions

```typescript
setConnectionStatus(status); // Set connection status
addDiscoveredSession(session); // Add discovered session
clearDiscoveredSessions(); // Clear discovered
```

---

## 📊 State Selectors

### User

```typescript
const user = useUser();
const isOnboarded = useIsOnboarded();
```

### Session

```typescript
const mode = useSessionMode(); // 'idle' | 'host' | 'client'
const sessionInfo = useSessionInfo();
const status = useSessionStatus();
```

### Devices

```typescript
const devices = useDevices();
const connectedCount = useConnectedCount();
const hostDevice = useHostDevice();
```

### Playback

```typescript
const playback = usePlayback();
const track = useCurrentTrack();
const isPlaying = useIsPlaying();
const progress = usePlaybackProgress();
```

### Sync

```typescript
const syncStatus = useSyncStatus();
const syncQuality = useSyncQuality();
const syncMetrics = useSyncMetrics();
const isSynced = useIsSynced();
```

### Network

```typescript
const connectionStatus = useConnectionStatus();
const networkQuality = useNetworkQuality();
const discoveredSessions = useDiscoveredSessions();
const isDiscovering = useIsDiscovering();
```

---

## 🎨 Component Examples

### CreateSessionScreen

```typescript
export default function CreateSessionScreen() {
  const { createSession } = useSessionActions();
  const { loadTrack } = usePlaybackActions();

  const handleCreate = async () => {
    await createSession('Party', 'file://track.mp3');
    await loadTrack(trackData);
    router.push('/player-room');
  };

  return <Button onPress={handleCreate}>Create</Button>;
}
```

### JoinSessionScreen

```typescript
export default function JoinSessionScreen() {
  const { discoveredSessions } = useSessionDiscovery();
  const { joinSession } = useSessionActions();

  return (
    <FlatList
      data={discoveredSessions}
      renderItem={({ item }) => (
        <Button onPress={() => joinSession(item.hostIp, item.sessionId)}>
          Join {item.sessionName}
        </Button>
      )}
    />
  );
}
```

### PlayerRoomScreen

```typescript
export default function PlayerRoomScreen() {
  const { isHost } = useSession();
  const { state, track, play, pause } = usePlayer();
  const { devices, syncedCount } = useDeviceList();
  const { broadcastPlay } = useHostControls();

  const handlePlay = () => {
    if (isHost) {
      broadcastPlay(Date.now() + 500);
    }
  };

  return (
    <View>
      <Text>{track?.title}</Text>
      <Button onPress={handlePlay} disabled={!isHost}>
        {state === 'playing' ? 'Pause' : 'Play'}
      </Button>
      <Text>{syncedCount} / {devices.length} synced</Text>
    </View>
  );
}
```

---

## 🐛 Debugging

### Enable Logging

All actions log to console in development:

```typescript
[SessionSlice] Session created: { sessionId: '...', name: '...' }
[PlaybackSlice] Playing: { track: '...', scheduledTime: 12345 }
[SyncSlice] Metrics updated: { clockOffset: 45, latency: 12 }
```

### Access Store Directly

```typescript
import { getStoreState } from "@/src/state";

const state = getStoreState();
console.log("Full state:", state);
```

### Debug Component

```typescript
{__DEV__ && (
  <View>
    <Text>Mode: {mode}</Text>
    <Text>Status: {status}</Text>
    <Text>Devices: {devices.length}</Text>
    <Text>Synced: {isSynced ? 'Yes' : 'No'}</Text>
  </View>
)}
```

---

## ⚠️ Common Pitfalls

### ❌ Don't mutate state directly

```typescript
// WRONG
store.devices.set("id", device);

// RIGHT
store.addDevice(device);
```

### ❌ Don't put business logic in components

```typescript
// WRONG
const handleJoin = () => {
  setMode("client");
  connectToHost();
  performSync();
};

// RIGHT
const handleJoin = () => {
  joinSession(hostIp, sessionId);
};
```

### ❌ Don't subscribe to entire store

```typescript
// WRONG (re-renders on any change)
const state = useLoudSyncStore();

// RIGHT (only re-renders when mode changes)
const mode = useSessionMode();
```

---

## 📝 Type Definitions

```typescript
// User
type User = {
  id: string;
  name: string;
  deviceName: string;
};

// Session
type SessionMode = "idle" | "host" | "client";
type SessionInfo = {
  sessionId: string;
  sessionName: string;
  hostId: string;
  hostName: string;
  hostIp: string;
};

// Device
type Device = {
  id: string;
  name: string;
  role: "host" | "client";
  status: "connected" | "disconnected" | "syncing" | "synced";
  latency: number;
  clockOffset: number;
};

// Track
type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number; // milliseconds
  uri: string;
};

// Sync
type SyncMetrics = {
  clockOffset: number;
  latency: number;
  jitter: number;
  lastSyncTime: number;
};
```

---

## 🔗 Related Files

- Full architecture: [ZUSTAND-ARCHITECTURE.md](./ZUSTAND-ARCHITECTURE.md)
- CreateSession example: [EXAMPLES-CreateSession.tsx](./EXAMPLES-CreateSession.tsx)
- JoinSession example: [EXAMPLES-JoinSession.tsx](./EXAMPLES-JoinSession.tsx)
- PlayerRoom example: [EXAMPLES-PlayerRoom.tsx](./EXAMPLES-PlayerRoom.tsx)
- Types: [src/state/types.ts](./src/state/types.ts)
- Main store: [src/state/store.ts](./src/state/store.ts)
- Custom hooks: [src/hooks/index.ts](./src/hooks/index.ts)

---

**Need help?** Check the full documentation in ZUSTAND-ARCHITECTURE.md
