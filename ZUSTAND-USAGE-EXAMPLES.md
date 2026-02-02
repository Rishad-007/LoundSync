# Zustand Store Usage Examples

## Phase 1: Session Hosting & Joining

This document shows how to use the LOUDSYNC store in your React Native components.

---

## 1. CreateSessionScreen Usage

```tsx
import React, { useState } from "react";
import { View, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  useLocalDevice,
  useSessionActions,
  useSessionStatus,
  useSessionError,
} from "@/src/state";
import { GradientButton } from "@/src/components";

export default function CreateSessionScreen() {
  const router = useRouter();

  // State selectors
  const localDevice = useLocalDevice();
  const status = useSessionStatus();
  const error = useSessionError();

  // Actions
  const { createSession, startHosting } = useSessionActions();

  // Local state
  const [sessionName, setSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Handle create session flow:
   * 1. Create session object
   * 2. Start broadcasting
   * 3. Navigate to session room
   */
  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      Alert.alert("Error", "Please enter a session name");
      return;
    }

    if (!localDevice) {
      Alert.alert("Error", "Device not initialized");
      return;
    }

    try {
      setIsCreating(true);

      // Step 1: Create session
      await createSession(sessionName.trim());
      console.log("✅ Session created");

      // Step 2: Start hosting (begin broadcasting)
      await startHosting();
      console.log("✅ Now hosting session");

      // Step 3: Navigate to session room
      router.replace("/player-room");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create session";
      Alert.alert("Error", message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Session Name"
        value={sessionName}
        onChangeText={setSessionName}
        editable={!isCreating}
      />

      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <GradientButton
        onPress={handleCreateSession}
        loading={isCreating}
        disabled={isCreating || !sessionName.trim()}
      >
        {isCreating ? "Creating..." : "Create Session"}
      </GradientButton>

      <Text>Status: {status}</Text>
      <Text>Device: {localDevice?.name}</Text>
    </View>
  );
}
```

---

## 2. JoinSessionScreen Usage

```tsx
import React, { useEffect, useState } from "react";
import { View, FlatList, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  useSessionActions,
  useDiscoveredSessions,
  useSessionStatus,
  useSessionError,
  type DiscoveredSession,
} from "@/src/state";
import { GradientButton, EmptyState } from "@/src/components";

export default function JoinSessionScreen() {
  const router = useRouter();

  // State selectors
  const discoveredSessions = useDiscoveredSessions();
  const status = useSessionStatus();
  const error = useSessionError();

  // Actions
  const { discoverSessions, stopDiscovery, joinSession } = useSessionActions();

  // Local state
  const [isJoining, setIsJoining] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  /**
   * Start discovery when screen mounts
   */
  useEffect(() => {
    handleStartDiscovery();

    // Stop discovery when unmounting
    return () => {
      if (status === "discovering") {
        stopDiscovery();
      }
    };
  }, []);

  /**
   * Start scanning for sessions
   */
  const handleStartDiscovery = async () => {
    try {
      await discoverSessions();
    } catch (err) {
      Alert.alert("Error", "Failed to discover sessions");
    }
  };

  /**
   * Join a selected session
   */
  const handleJoinSession = async (sessionId: string) => {
    try {
      setIsJoining(true);
      setSelectedSessionId(sessionId);

      await joinSession(sessionId);
      console.log("✅ Successfully joined session");

      // Navigate to session room
      router.replace("/player-room");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to join session";
      Alert.alert("Error", message);
      setSelectedSessionId(null);
    } finally {
      setIsJoining(false);
    }
  };

  /**
   * Render a single session card
   */
  const renderSession = ({ item }: { item: DiscoveredSession }) => {
    const isSelected = selectedSessionId === item.session.id;
    const isDisabled = isJoining && !isSelected;

    return (
      <View style={{ marginBottom: 16, opacity: isDisabled ? 0.5 : 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          {item.session.name}
        </Text>
        <Text>Host: {item.session.hostName}</Text>
        <Text>
          Members: {item.session.memberCount}/{item.session.maxMembers}
        </Text>
        <Text>Signal: {item.signalStrength}%</Text>

        <GradientButton
          onPress={() => handleJoinSession(item.session.id)}
          loading={isSelected && isJoining}
          disabled={
            isDisabled || item.session.memberCount >= item.session.maxMembers
          }
        >
          {isSelected && isJoining ? "Joining..." : "Join"}
        </GradientButton>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Available Sessions</Text>

      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <Text>Status: {status}</Text>

      <FlatList
        data={discoveredSessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.session.id}
        refreshControl={
          <RefreshControl
            refreshing={status === "discovering"}
            onRefresh={handleStartDiscovery}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="wifi-off"
            title="No Sessions Found"
            description="Pull to refresh or create your own session"
          />
        }
      />
    </View>
  );
}
```

---

## 3. PlayerRoomScreen (Session Room) Usage

```tsx
import React, { useEffect } from "react";
import { View, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  useCurrentSession,
  useMembers,
  useIsHost,
  usePendingRequests,
  useSessionActions,
  useMemberActions,
  useConnectedCount,
  type Member,
} from "@/src/state";
import { GradientButton, IconButton } from "@/src/components";

export default function PlayerRoomScreen() {
  const router = useRouter();

  // State selectors
  const session = useCurrentSession();
  const members = useMembers();
  const isHost = useIsHost();
  const pendingRequests = usePendingRequests();
  const connectedCount = useConnectedCount();

  // Actions
  const { leaveSession } = useSessionActions();
  const { acceptRequest, rejectRequest, kickMember } = useMemberActions();

  /**
   * Handle leaving the session
   */
  const handleLeaveSession = () => {
    Alert.alert(
      isHost ? "Close Session?" : "Leave Session?",
      isHost
        ? "All members will be disconnected"
        : "You will be disconnected from the session",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isHost ? "Close" : "Leave",
          style: "destructive",
          onPress: () => {
            leaveSession();
            router.replace("/");
          },
        },
      ],
    );
  };

  /**
   * Handle accepting a join request (host only)
   */
  const handleAcceptRequest = async (memberId: string) => {
    try {
      await acceptRequest(memberId);
      Alert.alert("Success", "Member added to session");
    } catch (err) {
      Alert.alert("Error", "Failed to accept request");
    }
  };

  /**
   * Handle rejecting a join request (host only)
   */
  const handleRejectRequest = async (memberId: string) => {
    try {
      await rejectRequest(memberId);
    } catch (err) {
      Alert.alert("Error", "Failed to reject request");
    }
  };

  /**
   * Handle kicking a member (host only)
   */
  const handleKickMember = (member: Member) => {
    Alert.alert("Kick Member?", `Remove ${member.name} from the session?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Kick",
        style: "destructive",
        onPress: async () => {
          try {
            await kickMember(member.id);
          } catch (err) {
            Alert.alert("Error", "Failed to kick member");
          }
        },
      },
    ]);
  };

  /**
   * Render a single member
   */
  const renderMember = ({ item }: { item: Member }) => {
    const isCurrentHost = item.role === "host";

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          marginBottom: 8,
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            {item.name} {isCurrentHost && "👑"}
          </Text>
          <Text style={{ fontSize: 12, color: "#888" }}>
            {item.connectionStatus}
            {item.latency !== null && ` • ${item.latency}ms`}
          </Text>
        </View>

        {/* Host can kick clients */}
        {isHost && !isCurrentHost && (
          <IconButton
            icon="user-x"
            onPress={() => handleKickMember(item)}
            variant="danger"
          />
        )}
      </View>
    );
  };

  /**
   * Render a pending join request
   */
  const renderPendingRequest = ({ item }: { item: Member }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 8,
        backgroundColor: "#2a2a00",
        borderRadius: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
        <Text style={{ fontSize: 12, color: "#888" }}>Wants to join</Text>
      </View>

      <IconButton
        icon="check"
        onPress={() => handleAcceptRequest(item.id)}
        variant="success"
      />
      <IconButton
        icon="x"
        onPress={() => handleRejectRequest(item.id)}
        variant="danger"
      />
    </View>
  );

  if (!session) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No active session</Text>
        <GradientButton onPress={() => router.replace("/")}>
          Go Home
        </GradientButton>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Session Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>{session.name}</Text>
        <Text style={{ fontSize: 14, color: "#888" }}>
          {isHost ? "You're hosting" : `Hosted by ${session.hostName}`}
        </Text>
        <Text style={{ fontSize: 14, color: "#888" }}>
          {connectedCount} member{connectedCount !== 1 ? "s" : ""} connected
        </Text>
      </View>

      {/* Pending Requests (Host Only) */}
      {isHost && pendingRequests.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
            Join Requests ({pendingRequests.length})
          </Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {/* Members List */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
          Members
        </Text>
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* Leave/Close Button */}
      <GradientButton
        onPress={handleLeaveSession}
        variant="danger"
        style={{ marginTop: 16 }}
      >
        {isHost ? "Close Session" : "Leave Session"}
      </GradientButton>
    </View>
  );
}
```

---

## 4. Common Patterns

### Checking Device Initialization

```tsx
import { useLocalDevice, useUserActions } from "@/src/state";
import { useEffect } from "react";

function App() {
  const localDevice = useLocalDevice();
  const { generateDeviceId } = useUserActions();

  useEffect(() => {
    // Generate device ID on first launch
    if (!localDevice) {
      generateDeviceId();
    }
  }, [localDevice]);

  return <>{/* ... */}</>;
}
```

### Monitoring Network Status

```tsx
import {
  useNetworkAvailable,
  useNetworkQuality,
  useNetworkActions,
} from "@/src/state";
import { useEffect } from "react";

function NetworkIndicator() {
  const isAvailable = useNetworkAvailable();
  const quality = useNetworkQuality();
  const { checkNetwork } = useNetworkActions();

  useEffect(() => {
    // Check network on mount
    checkNetwork();

    // Poll every 30 seconds
    const interval = setInterval(checkNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text>Network: {isAvailable ? "Connected" : "Disconnected"}</Text>
      <Text>Quality: {quality}</Text>
    </View>
  );
}
```

### Updating Member Latency

```tsx
import { useMemberActions } from "@/src/state";

function HeartbeatHandler() {
  const { updateMember } = useMemberActions();

  const updateLatency = (memberId: string, latency: number) => {
    updateMember(memberId, {
      latency,
      lastSeen: Date.now(),
    });
  };

  return null; // Background process
}
```

---

## 5. State Lifecycle

### Host Flow

```
1. generateDeviceId()          → localDevice created
2. createSession(name)         → session created, role = 'host'
3. startHosting()              → status = 'hosting', broadcasting
4. [members connect]           → addMember() called
5. stopHosting() / leaveSession() → status = 'idle', session = null
```

### Client Flow

```
1. generateDeviceId()          → localDevice created
2. discoverSessions()          → status = 'discovering'
3. [sessions found]            → discoveredSessions populated
4. joinSession(sessionId)      → status = 'joining' → 'connected'
5. leaveSession()              → status = 'idle', session = null
```

---

## 6. Debugging

```tsx
import { useLoudSyncStore } from "@/src/state";

function DebugPanel() {
  const state = useLoudSyncStore();

  return (
    <View>
      <Text>Status: {state.status}</Text>
      <Text>Role: {state.role || "none"}</Text>
      <Text>Session: {state.currentSession?.name || "none"}</Text>
      <Text>Members: {state.members.length}</Text>
      <Text>Network: {state.networkType}</Text>
    </View>
  );
}
```

---

## Notes

- All actions are **async** and return Promises
- Mock implementations are in place (no real network yet)
- State persists only `localDevice` and `isOnboarded`
- Session data is cleared when leaving
- Use `__DEV__` checks for development logging
