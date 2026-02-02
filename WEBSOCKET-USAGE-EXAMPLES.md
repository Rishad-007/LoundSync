# WebSocket Usage Examples & Code Flows

This document provides practical examples of how to use the LOUDSYNC WebSocket connection system in your React Native application.

---

## Table of Contents

1. [Starting as Host](#starting-as-host)
2. [Joining as Client](#joining-as-client)
3. [Leaving a Session](#leaving-a-session)
4. [Monitoring Connection State](#monitoring-connection-state)
5. [Handling Member Changes](#handling-member-changes)
6. [Error Handling](#error-handling)
7. [Complete Component Examples](#complete-component-examples)

---

## Starting as Host

### Using Zustand Store

```typescript
import { useSessionStore } from '@/state';

function HostSessionScreen() {
  const { startHosting, stopHosting, session } = useSessionStore();

  const handleStartHosting = async () => {
    try {
      await startHosting('Rishad\'s Party', 'host-device-123');
      // Session is now active and WebSocket server is listening
      console.log('Hosting on port:', session?.port); // 8080
    } catch (error) {
      console.error('Failed to start hosting:', error);
    }
  };

  const handleStopHosting = () => {
    stopHosting();
    // WebSocket server stopped, all clients notified via SESSION_CLOSED
  };

  return (
    <View>
      {!session ? (
        <Button title="Start Hosting" onPress={handleStartHosting} />
      ) : (
        <>
          <Text>Members: {session.memberCount}</Text>
          <Button title="Stop Session" onPress={handleStopHosting} />
        </>
      )}
    </View>
  );
}
```

### Direct WebSocketServer Usage

```typescript
import { WebSocketServer } from "@/network";

// Create server instance
const server = new WebSocketServer({
  port: 8080,
  sessionId: "abc123",
  sessionName: "Rishad's Party",
  hostId: "host-device-123",
  hostName: "Rishad's MacBook",
  maxMembers: 10,
  heartbeatTimeout: 15000,
});

// Set up event handlers
server.setHandlers({
  onClientJoined: (client) => {
    console.log("New member:", client.info.name);
    // Update UI, add to member list
  },
  onClientLeft: (clientId, reason) => {
    console.log("Member left:", clientId, reason);
    // Update UI, remove from member list
  },
  onMemberListChanged: (members) => {
    console.log("Total members:", members.length);
    // Update member count display
  },
});

// Start server
await server.start();
console.log("Server listening on port 8080");

// Stop server when done
await server.stop();
```

---

## Joining as Client

### Using Zustand Store

```typescript
import { useSessionStore } from '@/state';

function JoinSessionScreen() {
  const { joinSession, leaveSession, session, connectionError } = useSessionStore();
  const [selectedSession, setSelectedSession] = useState<DiscoveredSession | null>(null);

  const handleJoin = async () => {
    if (!selectedSession) return;

    try {
      await joinSession(
        selectedSession.id,
        selectedSession.name,
        selectedSession.host.address,
        selectedSession.port,
        'client-device-456'
      );

      // Successfully joined, session state updated
      console.log('Connected to:', session?.name);
      console.log('Members:', session?.members);
    } catch (error) {
      console.error('Failed to join:', error);
      // Error stored in connectionError
      console.log('Error:', connectionError);
    }
  };

  return (
    <View>
      {!session ? (
        <>
          <SessionList onSelectSession={setSelectedSession} />
          <Button
            title="Join Session"
            onPress={handleJoin}
            disabled={!selectedSession}
          />
          {connectionError && <Text style={styles.error}>{connectionError}</Text>}
        </>
      ) : (
        <>
          <Text>Connected to: {session.name}</Text>
          <Text>Members: {session.members.length}</Text>
          <MemberList members={session.members} />
          <Button title="Leave Session" onPress={leaveSession} />
        </>
      )}
    </View>
  );
}
```

### Direct WebSocketService Usage

```typescript
import { WebSocketService } from "@/network";
import type { MemberInfo } from "@/network/protocol";

// Create client instance
const client = new WebSocketService({
  host: "192.168.1.100",
  port: 8080,
  sessionId: "abc123",
  deviceId: "client-device-456",
  deviceName: "Rishad's iPhone",
  heartbeatInterval: 5000,
  connectionTimeout: 10000,
  maxReconnectAttempts: 3,
  reconnectDelay: 2000,
});

// Set up message handlers
client.setHandlers({
  onWelcome: (message) => {
    console.log("Assigned client ID:", message.clientId);
    console.log("Session:", message.sessionInfo.name);
  },

  onMemberList: (message) => {
    console.log("Current members:", message.members);
    // Update local member list
    message.members.forEach((member) => {
      console.log(`- ${member.name} (${member.isHost ? "Host" : "Client"})`);
    });
  },

  onMemberJoined: (message) => {
    console.log("New member joined:", message.member.name);
    // Add to local member list
  },

  onMemberLeft: (message) => {
    console.log("Member left:", message.memberId, message.reason);
    // Remove from local member list
  },

  onKicked: (message) => {
    console.log("You were kicked:", message.reason);
    // Show notification, navigate away
  },

  onSessionClosed: (message) => {
    console.log("Session closed:", message.reason);
    // Navigate back to discovery
  },

  onError: (message) => {
    console.error("WebSocket error:", message.code, message.message);
    // Show error message to user
  },
});

// Connect to host
try {
  await client.connectToHost();
  console.log("Connected successfully!");
  console.log("Connection state:", client.getConnectionState());
  console.log("Latency:", client.getLatency(), "ms");
} catch (error) {
  console.error("Connection failed:", error);
}

// Disconnect when done
client.disconnect("User left session");
```

---

## Leaving a Session

### Graceful Disconnect

```typescript
import { useSessionStore } from '@/state';

function SessionControls() {
  const { leaveSession, session } = useSessionStore();

  const handleLeave = () => {
    if (!session) return;

    // For clients: sends LEAVE message, disconnects WebSocket
    // For hosts: stops server, sends SESSION_CLOSED to all clients
    leaveSession();

    // Navigate back to home screen
    router.push('/home');
  };

  return (
    <Button
      title="Leave Session"
      onPress={handleLeave}
      style={styles.leaveButton}
    />
  );
}
```

### Handling Unexpected Disconnections

```typescript
import { useSessionStore } from "@/state";
import { useEffect } from "react";

function SessionMonitor() {
  const { session, connectionError } = useSessionStore();

  useEffect(() => {
    if (connectionError) {
      // Connection lost, show alert
      Alert.alert("Connection Lost", connectionError, [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to discovery
            router.replace("/home");
          },
        },
      ]);
    }
  }, [connectionError]);

  return null;
}
```

---

## Monitoring Connection State

### Real-time Connection Status

```typescript
import { useSessionStore } from '@/state';

function ConnectionIndicator() {
  const { session } = useSessionStore();

  if (!session) return null;

  const getStatusColor = () => {
    if (!session.isConnected) return '#EF4444'; // red
    if (session.members.some(m => m.connectionStatus === 'reconnecting')) {
      return '#F59E0B'; // amber
    }
    return '#10B981'; // green
  };

  return (
    <View style={styles.indicator}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <Text>
        {session.isConnected ? 'Connected' : 'Disconnected'}
      </Text>
    </View>
  );
}
```

### Latency Display

```typescript
function LatencyMonitor() {
  const [latency, setLatency] = useState<number | null>(null);
  const { session } = useSessionStore();

  useEffect(() => {
    if (!session?.isConnected) return;

    // Update latency from member list (for clients)
    const myMember = session.members.find(m => m.id === session.deviceId);
    if (myMember?.latency) {
      setLatency(myMember.latency);
    }
  }, [session?.members]);

  if (latency === null) return null;

  return (
    <View style={styles.latency}>
      <Text>Latency: {latency}ms</Text>
      <View style={[
        styles.latencyBar,
        {
          width: `${Math.min(100, latency / 2)}%`,
          backgroundColor: latency < 50 ? '#10B981' : latency < 100 ? '#F59E0B' : '#EF4444'
        }
      ]} />
    </View>
  );
}
```

---

## Handling Member Changes

### Live Member List

```typescript
import { useSessionStore } from '@/state';

function MemberList() {
  const { session } = useSessionStore();

  if (!session?.members) return null;

  return (
    <ScrollView style={styles.memberList}>
      {session.members.map(member => (
        <MemberCard key={member.id} member={member} />
      ))}
    </ScrollView>
  );
}

function MemberCard({ member }: { member: Member }) {
  return (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        {member.isHost && <Badge text="Host" />}
      </View>

      <View style={styles.memberStatus}>
        <StatusDot status={member.connectionStatus} />
        {member.latency && (
          <Text style={styles.latency}>{member.latency}ms</Text>
        )}
      </View>
    </View>
  );
}

function StatusDot({ status }: { status: DeviceConnectionStatus }) {
  const colors = {
    connected: '#10B981',
    disconnected: '#EF4444',
    reconnecting: '#F59E0B',
    pending: '#6B7280'
  };

  return (
    <View style={[styles.statusDot, { backgroundColor: colors[status] }]} />
  );
}
```

### Member Join/Leave Animations

```typescript
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

function AnimatedMemberList() {
  const { session } = useSessionStore();

  return (
    <View style={styles.list}>
      {session?.members.map(member => (
        <Animated.View
          key={member.id}
          entering={FadeInRight}
          exiting={FadeOutLeft}
        >
          <MemberCard member={member} />
        </Animated.View>
      ))}
    </View>
  );
}
```

---

## Error Handling

### Comprehensive Error Handler

```typescript
import { useSessionStore } from "@/state";
import { ErrorCode } from "@/network/protocol";

function SessionErrorHandler() {
  const { connectionError } = useSessionStore();

  useEffect(() => {
    if (!connectionError) return;

    // Parse error code from message
    let title = "Connection Error";
    let message = connectionError;
    let actions: AlertButton[] = [{ text: "OK" }];

    if (connectionError.includes("session_full")) {
      title = "Session Full";
      message =
        "This session has reached its maximum capacity. Try again later.";
      actions = [
        { text: "Try Again", onPress: () => retryConnection() },
        { text: "Find Another", onPress: () => router.push("/discover") },
      ];
    } else if (connectionError.includes("session_not_found")) {
      title = "Session Not Found";
      message = "This session no longer exists.";
      actions = [
        {
          text: "Back to Discovery",
          onPress: () => router.replace("/discover"),
        },
      ];
    } else if (connectionError.includes("timeout")) {
      title = "Connection Timeout";
      message = "Unable to connect to the host. Check your network.";
      actions = [
        { text: "Retry", onPress: () => retryConnection() },
        { text: "Cancel", style: "cancel" },
      ];
    }

    Alert.alert(title, message, actions);
  }, [connectionError]);

  return null;
}
```

### Retry Logic

```typescript
function JoinWithRetry() {
  const [retrying, setRetrying] = useState(false);
  const { joinSession } = useSessionStore();

  const attemptJoin = async (sessionInfo: SessionInfo, maxRetries = 3) => {
    setRetrying(true);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await joinSession(
          sessionInfo.id,
          sessionInfo.name,
          sessionInfo.host.address,
          sessionInfo.port,
          "my-device-id",
        );

        // Success!
        setRetrying(false);
        return true;
      } catch (error) {
        console.log(`Join attempt ${attempt}/${maxRetries} failed`);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    setRetrying(false);
    Alert.alert(
      "Connection Failed",
      "Unable to join session after multiple attempts.",
    );
    return false;
  };

  return { attemptJoin, retrying };
}
```

---

## Complete Component Examples

### Full Host Screen

```typescript
import { useSessionStore } from '@/state';
import { useState } from 'react';

export default function HostScreen() {
  const { startHosting, stopHosting, session } = useSessionStore();
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartHosting = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Error', 'Please enter a session name');
      return;
    }

    setIsLoading(true);
    try {
      await startHosting(sessionName, 'my-device-id');
      // Navigate to active session screen
      router.push('/active-session');
    } catch (error) {
      Alert.alert('Error', 'Failed to start hosting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopHosting = () => {
    Alert.alert(
      'Stop Session',
      'Are you sure? All members will be disconnected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            stopHosting();
            router.replace('/home');
          }
        }
      ]
    );
  };

  if (session?.isHost) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{session.name}</Text>
        <Text style={styles.subtitle}>
          {session.memberCount} {session.memberCount === 1 ? 'member' : 'members'}
        </Text>

        <MemberList members={session.members} />

        <Button
          title="Stop Session"
          onPress={handleStopHosting}
          color="#EF4444"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start a Session</Text>

      <TextInput
        style={styles.input}
        placeholder="Session Name"
        value={sessionName}
        onChangeText={setSessionName}
      />

      <Button
        title={isLoading ? "Starting..." : "Start Hosting"}
        onPress={handleStartHosting}
        disabled={isLoading}
      />
    </View>
  );
}
```

### Full Client Screen

```typescript
import { useSessionStore } from '@/state';
import { useState, useEffect } from 'react';

export default function JoinScreen() {
  const { joinSession, leaveSession, session, connectionError } = useSessionStore();
  const [discoveredSessions, setDiscoveredSessions] = useState<DiscoveredSession[]>([]);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Start discovery
    const manager = new DiscoveryManager();
    manager.setHandlers({
      onSessionFound: (session) => {
        setDiscoveredSessions(prev => [...prev, session]);
      },
      onSessionLost: (sessionId) => {
        setDiscoveredSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    });
    manager.startDiscovery('my-device-id');

    return () => manager.stopDiscovery();
  }, []);

  const handleJoin = async (discoveredSession: DiscoveredSession) => {
    setJoining(true);
    try {
      await joinSession(
        discoveredSession.id,
        discoveredSession.name,
        discoveredSession.host.address,
        discoveredSession.port,
        'my-device-id'
      );
      router.push('/active-session');
    } catch (error) {
      // Error stored in connectionError state
    } finally {
      setJoining(false);
    }
  };

  if (session && !session.isHost) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{session.name}</Text>

        <ConnectionIndicator />
        <LatencyMonitor />

        <MemberList members={session.members} />

        <Button
          title="Leave Session"
          onPress={() => {
            leaveSession();
            router.replace('/home');
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Sessions</Text>

      {connectionError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{connectionError}</Text>
        </View>
      )}

      <ScrollView style={styles.sessionList}>
        {discoveredSessions.map(session => (
          <TouchableOpacity
            key={session.id}
            style={styles.sessionCard}
            onPress={() => handleJoin(session)}
            disabled={joining}
          >
            <Text style={styles.sessionName}>{session.name}</Text>
            <Text style={styles.sessionHost}>Host: {session.host.name}</Text>
            <Text style={styles.sessionMembers}>
              {session.memberCount} members
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {discoveredSessions.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No Sessions Found"
          message="Make sure you're on the same network"
        />
      )}
    </View>
  );
}
```

---

## Best Practices

### 1. Always Clean Up

```typescript
useEffect(() => {
  // Set up WebSocket connection

  return () => {
    // Clean up on unmount
    leaveSession();
  };
}, []);
```

### 2. Handle Connection State

```typescript
// Monitor connection state
useEffect(() => {
  if (!session?.isConnected && session !== null) {
    // Connection lost, show notification
    Toast.show("Connection lost. Attempting to reconnect...");
  }
}, [session?.isConnected]);
```

### 3. Validate Before Actions

```typescript
const handleKickMember = (memberId: string) => {
  if (!session?.isHost) {
    Alert.alert("Error", "Only the host can remove members");
    return;
  }

  // Proceed with kick action
  kickMember(memberId);
};
```

### 4. Use Loading States

```typescript
const [isConnecting, setIsConnecting] = useState(false);

const connect = async () => {
  setIsConnecting(true);
  try {
    await joinSession(...);
  } finally {
    setIsConnecting(false);
  }
};
```

### 5. Provide Feedback

```typescript
// Show toast on member events
useEffect(() => {
  const lastMember = session?.members[session.members.length - 1];
  if (lastMember && lastMember.joinedAt > Date.now() - 1000) {
    Toast.show(`${lastMember.name} joined`);
  }
}, [session?.members.length]);
```

---

## Testing Your Implementation

### Manual Test Checklist

1. **Host Session**
   - [ ] Start hosting with custom name
   - [ ] Verify WebSocket server starts on port 8080
   - [ ] Check member list shows host

2. **Join Session**
   - [ ] Discover session via mDNS/UDP
   - [ ] Join successfully
   - [ ] Receive WELCOME and MEMBER_LIST
   - [ ] Verify member list updates on both devices

3. **Connection Monitoring**
   - [ ] Check latency displays correctly
   - [ ] Monitor connection indicator
   - [ ] Verify heartbeat keeps connection alive

4. **Member Changes**
   - [ ] Add third device, verify all see update
   - [ ] Remove device, verify MEMBER_LEFT received
   - [ ] Check member count updates

5. **Disconnection**
   - [ ] Client leaves gracefully
   - [ ] Host stops session
   - [ ] Test network interruption (airplane mode)
   - [ ] Verify reconnection attempts

6. **Error Handling**
   - [ ] Try joining full session
   - [ ] Try joining non-existent session
   - [ ] Test connection timeout
   - [ ] Verify error messages display correctly

---

## Common Issues & Solutions

### Issue: "Connection timeout"

**Solution:** Check that both devices are on the same network and firewall allows port 8080.

### Issue: "Session not found"

**Solution:** Ensure host is broadcasting and client has correct session ID.

### Issue: Members not updating

**Solution:** Verify message handlers are set before calling `connectToHost()`.

### Issue: High latency

**Solution:** Check network quality, reduce heartbeat frequency if needed.

### Issue: Frequent disconnections

**Solution:** Increase heartbeat timeout, check for network stability.

---

## Next Steps

- Implement Phase 2: Audio sync and playback control
- Add persistent session history
- Implement member permissions/roles
- Add chat messaging layer
