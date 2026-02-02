## LAN Discovery Code Reference

Complete implementation guide with examples.

### 1. Host Broadcasting Code

#### Setup & Initialization

```typescript
import { hostBroadcastService } from '@/src/network';
import type { SessionAdvertisement } from '@/src/network/types';

// When user creates a session as host
async function broadcastSession() {
  const session = store.getState().currentSession;
  const localIP = "192.168.1.100"; // TODO: Auto-detect from network
  
  const advertisement: SessionAdvertisement = {
    sessionId: session.id,
    sessionName: session.name,
    hostId: localDevice.id,
    hostName: localDevice.name,
    hostAddress: localIP,
    port: 8080,
    memberCount: 1,
    maxMembers: 10,
    isPasswordProtected: false,
    version: "1.0.0",
    timestamp: Date.now(),
  };

  // Start broadcasting on LAN
  await hostBroadcastService.startBroadcast(
    advertisement,
    localIP,
    { interval: 3000, port: 9876 }
  );
}
```

#### Updating During Session

```typescript
// When new member joins
function handleMemberJoined() {
  const advertisement = {
    ...previousAdvertisement,
    memberCount: store.getState().members.length,
    timestamp: Date.now(),
  };

  // Update broadcasters automatically
  hostBroadcastService.updateAdvertisement(advertisement);
}
```

#### Stopping Broadcast

```typescript
// When host closes session
function endSession() {
  hostBroadcastService.stopBroadcast();
  // mDNS service unregistered
  // UDP broadcasts stop
  // Session no longer discoverable
}
```

---

### 2. Client Discovery Code

#### Simple Discovery

```typescript
import { discoveryManager } from '@/src/network';

async function findSessions() {
  const sessions = [];

  // Subscribe to events
  const unsubscribe = discoveryManager.subscribe(
    (session) => {
      console.log("Found:", session.advertisement.sessionName);
      sessions.push(session);
    },
    (sessionId) => {
      console.log("Lost:", sessionId);
      sessions = sessions.filter(s => s.advertisement.sessionId !== sessionId);
    }
  );

  // Start scan
  await discoveryManager.startDiscovery({
    timeout: 5000,           // Scan for 5 seconds
    method: 'mdns',          // Try mDNS first
    useFallback: true        // Fall back to UDP
  });

  // Cleanup
  unsubscribe();
  
  return sessions;
}
```

#### Advanced: Real-time Updates

```typescript
// Component that shows live session list
function SessionList() {
  const [sessions, setSessions] = useState([]);
  
  useEffect(() => {
    // Subscribe to discovery events
    const unsubscribe = discoveryManager.subscribe(
      (session) => {
        setSessions(prev => {
          // Check if already exists
          const exists = prev.find(
            s => s.advertisement.sessionId === session.advertisement.sessionId
          );
          
          if (exists) {
            // Update existing (better signal, etc)
            return prev.map(s =>
              s.advertisement.sessionId === session.advertisement.sessionId
                ? session
                : s
            );
          }
          
          // Add new
          return [...prev, session];
        });
      },
      (sessionId) => {
        // Session disappeared
        setSessions(prev =>
          prev.filter(s => s.advertisement.sessionId !== sessionId)
        );
      }
    );

    // Auto-cleanup on unmount
    return unsubscribe;
  }, []);

  return (
    <FlatList
      data={sessions}
      renderItem={({ item }) => (
        <SessionCard
          name={item.advertisement.sessionName}
          members={item.advertisement.memberCount}
          signal={item.signalStrength}
        />
      )}
    />
  );
}
```

#### Timeout Handling

```typescript
async function discoverWithTimeout() {
  try {
    // These timeouts are built-in:
    
    // 1. Scan timeout: Stop scanning after 5 seconds
    await discoveryManager.startDiscovery({ timeout: 5000 });
    
    // 2. Session expiry: Auto-remove sessions not seen for 15s
    discoveryManager.setSessionExpiry(15000);
    
  } catch (error) {
    console.error("Discovery failed:", error);
  }
}
```

---

### 3. State Integration

#### Zustand Slice Integration

```typescript
// In src/state/slices/sessionSlice.ts

import { discoveryManager, hostBroadcastService } from '../../network';

export const createSessionSlice: StateCreator<LoudSyncStore> = (set, get) => ({
  
  // Discovery actions
  discoverSessions: async () => {
    set({ status: "discovering" });
    
    // Setup listeners
    discoveryManager.subscribe(
      (session) => {
        const discovered: DiscoveredSession = {
          session: mapAdvertisementToSession(session.advertisement),
          signalStrength: session.signalStrength,
          discoveredAt: session.lastSeen,
          isReachable: true,
          lastSeen: session.lastSeen,
        };
        get().addDiscoveredSession(discovered);
      },
      (sessionId) => {
        set(state => ({
          discoveredSessions: state.discoveredSessions.filter(
            d => d.session.id !== sessionId
          )
        }));
      }
    );
    
    // Start discovery
    await discoveryManager.startDiscovery({
      timeout: 5000,
      method: 'mdns',
      useFallback: true,
    });
  },
  
  stopDiscovery: () => {
    discoveryManager.stopDiscovery();
    set({ status: "idle" });
  },
  
  // Host broadcasting
  startHosting: async () => {
    const session = get().currentSession;
    const advertisement: SessionAdvertisement = {
      sessionId: session.id,
      sessionName: session.name,
      hostId: get().localDevice.id,
      hostName: get().localDevice.name,
      hostAddress: "192.168.1.100", // TODO: Auto-detect
      port: 8080,
      memberCount: get().members.length,
      maxMembers: session.maxMembers,
      isPasswordProtected: session.isPasswordProtected,
      version: session.version,
      timestamp: Date.now(),
    };
    
    await hostBroadcastService.startBroadcast(advertisement, "192.168.1.100");
    set({ status: "hosting" });
  },
  
  stopHosting: async () => {
    hostBroadcastService.stopBroadcast();
    set({ status: "idle", role: null });
  },
});
```

---

### 4. Full Screen Example: JoinSessionScreen

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSessionActions, useDiscoveredSessions, useSessionStatus } from '@/src/state';

export function JoinSessionScreen() {
  const { discoverSessions, stopDiscovery, joinSession } = useSessionActions();
  const sessions = useDiscoveredSessions();
  const status = useSessionStatus();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    startDiscovery();
    return () => stopDiscovery();
  }, []);

  const startDiscovery = async () => {
    setRefreshing(true);
    try {
      await discoverSessions();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSessionPress = async (sessionId: string) => {
    try {
      await joinSession(sessionId);
      // Navigation happens automatically via stack
    } catch (error) {
      Alert.alert("Failed to Join", error.message);
    }
  };

  if (status === 'discovering') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Searching for sessions...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={startDiscovery} />
      }
      renderItem={({ item }) => (
        <SessionCard
          session={item.session}
          signal={item.signalStrength}
          onPress={() => handleSessionPress(item.session.id)}
        />
      )}
      ListEmptyComponent={
        <Text>No sessions found. Pull to refresh.</Text>
      }
      keyExtractor={(item) => item.session.id}
    />
  );
}

function SessionCard({ session, signal, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View>
        <Text style={styles.name}>{session.name}</Text>
        <Text style={styles.host}>by {session.hostName}</Text>
      </View>
      <View>
        <Text style={styles.members}>
          {session.memberCount}/{session.maxMembers} members
        </Text>
        <Text style={styles.signal}>
          📶 {signal}%
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  host: { fontSize: 14, color: '#666' },
  members: { fontSize: 12 },
  signal: { fontSize: 12, textAlign: 'right' },
});
```

---

### 5. Full Screen Example: CreateSessionScreen

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useSessionActions, useCurrentSession } from '@/src/state';

export function CreateSessionScreen() {
  const { createSession, startHosting } = useSessionActions();
  const session = useCurrentSession();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a session name");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create session object
      await createSession(name);
      
      // Step 2: Start broadcasting
      await startHosting();
      
      Alert.alert("Success", "Session created and broadcast on LAN!");
      // Navigation happens automatically
    } catch (error) {
      Alert.alert("Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Session name (e.g., 'Party')"
        value={name}
        onChangeText={setName}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 20,
          borderRadius: 4,
        }}
      />
      <Button
        title={loading ? "Creating..." : "Create Session"}
        onPress={handleCreate}
        disabled={loading}
      />
      {session && (
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#e0e0e0' }}>
          <Text>Session: {session.name}</Text>
          <Text>Broadcasting on LAN...</Text>
        </View>
      )}
    </View>
  );
}
```

---

### 6. Troubleshooting

```typescript
// Check if discovery is working
function debugDiscovery() {
  console.log("Active:", discoveryManager.isActive());
  console.log("Sessions:", discoveryManager.getSessionCount());
  console.log("All sessions:", discoveryManager.getDiscoveredSessions());
}

// Check if broadcast is working
function debugBroadcast() {
  console.log("Active:", hostBroadcastService.isActive());
}

// Test with manual data
async function testDiscovery() {
  // Manually add a test session
  const testData = {
    advertisement: {
      sessionId: "test-123",
      sessionName: "Test Session",
      hostId: "test-host",
      hostName: "Test Device",
      hostAddress: "192.168.1.100",
      port: 8080,
      memberCount: 1,
      maxMembers: 10,
      isPasswordProtected: false,
      version: "1.0.0",
      timestamp: Date.now(),
    },
    discoveryMethod: 'mdns' as const,
    signalStrength: 100,
    lastSeen: Date.now(),
  };

  // This would normally come from network layer
  // For testing, you can simulate:
  console.log("Would discover:", testData);
}
```

---

### 7. Performance Notes

**Optimal Settings**:
- Discovery timeout: 5-10 seconds (longer = more thorough but slower)
- Session expiry: 15-30 seconds (matches broadcast interval)
- Broadcast interval: 3 seconds (balances discovery speed vs battery)

**Memory Usage**:
- Each session: ~500 bytes in state
- 10 sessions: ~5 KB
- Discovery manager listeners: 1 per component

**Network Usage**:
- mDNS: Passive listening + periodic queries (~1 KB/min)
- UDP: Active broadcast (~1 KB per broadcast, 3s interval)
- Total: ~20 KB/min per host

