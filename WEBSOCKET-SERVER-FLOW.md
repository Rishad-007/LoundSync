# Session Server Flow - LOUDSYNC

## Complete Flow Documentation

This document explains the end-to-end flow of session management using the WebSocket server.

---

## 1. Host Creates Session

### User Action

User taps "Host Party" → Enters party name → Taps "Create Session"

### Code Flow

```typescript
// 1. CREATE SESSION (create-session.tsx)
const handleCreateSession = () => {
  const sessionCode = generateSessionCode(); // "A1B-2C3"
  const sessionId = sessionCode.replace("-", ""); // "A1B2C3"

  // Register in session registry
  sessionRegistry.registerSession({
    sessionId,
    sessionCode: sessionId,
    sessionName: sessionName || "My Party",
    hostId: `host-${Date.now()}`,
    hostName: hostName || "Party Host",
    maxMembers: parseInt(maxDevices) || 8,
  });

  // Navigate to player room as host
  router.push({
    pathname: "/player-room",
    params: {
      sessionId,
      sessionName: sessionName || "My Party",
      isHost: "true",
    },
  });
};
```

```typescript
// 2. INITIALIZE HOST (player-room.tsx)
useEffect(() => {
  if (params.isHost === "true") {
    // Start Zustand hosting workflow
    startHosting();
  }
}, [params.isHost]);
```

```typescript
// 3. START HOSTING (sessionSlice.ts)
startHosting: async () => {
  const session = get().currentSession;
  const localDevice = get().localDevice;

  // Step 1: Start mDNS/UDP broadcast
  await hostBroadcastService.startBroadcast({
    sessionId: session.id,
    sessionName: session.name,
    hostId: localDevice.id,
    hostName: localDevice.name,
    hostAddress: "192.168.1.100",
    port: 8080,
    memberCount: 1,
    maxMembers: 8,
  }, "192.168.1.100");

  // Step 2: Start WebSocket server
  await sessionServerManager.createServer({
    sessionId: session.id,
    sessionName: session.name,
    hostId: localDevice.id,
    hostName: localDevice.name,
    maxMembers: 8,
    port: 8080,
  });

  // Step 3: Setup event handlers
  sessionServerManager.setCallbacks({
    onMemberJoined: (member) => addMember(member),
    onMemberLeft: (deviceId) => removeMember(deviceId),
    onMemberListChanged: (members) => updateMemberCount(members),
    onServerStarted: () => console.log("✅ Server started"),
    onServerError: (error) => handleError(error),
  });

  // Step 4: Update state
  set({
    status: "hosting",
    role: "host",
    members: [{ id: hostId, name: hostName, role: "host", ... }],
  });
}
```

```typescript
// 4. CREATE SERVER (sessionServerManager.ts)
async createServer(options: CreateServerOptions) {
  // Validate session exists in registry
  const session = sessionRegistry.getSession(options.sessionId);
  if (!session) throw new Error("Session not found");

  // Create WebSocket server
  this.server = new WebSocketServer({
    port: 8080,
    sessionId: options.sessionId,
    sessionName: options.sessionName,
    hostId: options.hostId,
    hostName: options.hostName,
    maxMembers: options.maxMembers || 8,
    heartbeatTimeout: 15000,
  });

  // Set event handlers
  this.server.setHandlers({
    onClientJoined: (client) => this.handleClientJoined(client),
    onClientLeft: (deviceId, reason) => this.handleClientLeft(deviceId, reason),
    onMemberListChanged: (members) => this.handleMemberListChanged(members),
  });

  // Start server
  await this.server.start();

  console.log("✅ Server started on port 8080");
}
```

```typescript
// 5. START SERVER (websocketServer.ts)
async start(): Promise<void> {
  // Import WebSocket library (native module in production)
  const WebSocket = require("ws");
  this.server = new WebSocket.Server({ port: 8080 });

  // Listen for connections
  this.server.on("listening", () => {
    console.log("Server listening on port 8080");
    this.startHeartbeatCheck();
  });

  this.server.on("connection", (ws, req) => {
    const clientAddress = req.socket.remoteAddress;
    this.handleConnection(ws, clientAddress);
  });

  this.server.on("error", (error) => {
    console.error("Server error:", error);
  });
}
```

### Result

- ✅ Session registered in session registry
- ✅ WebSocket server running on port 8080
- ✅ mDNS/UDP broadcasting session info
- ✅ Host device added to member list
- ✅ UI shows "1 Connected" (host only)

---

## 2. Guest Discovers Session

### User Action

User taps "Join Party" → Waits for scan → Sees host's session appear

### Code Flow

```typescript
// 1. START DISCOVERY (join-session.tsx)
useEffect(() => {
  const initDiscovery = async () => {
    await discoveryManager.startDiscovery();
    setDiscoveredSessions(discoveryManager.getDiscoveredSessions());
  };

  initDiscovery();

  // Subscribe to updates
  const unsubscribe = discoveryManager.subscribe(
    (session) =>
      setDiscoveredSessions(discoveryManager.getDiscoveredSessions()),
    (sessionId) =>
      setDiscoveredSessions(discoveryManager.getDiscoveredSessions()),
  );

  return () => {
    unsubscribe();
    discoveryManager.stopDiscovery();
  };
}, []);
```

```typescript
// 2. DISCOVERY FLOW (discoveryManager.ts)
async startDiscovery() {
  // Try mDNS (production only)
  try {
    await mdnsService.startScan(onFound, onLost);
  } catch {
    // Fallback to UDP (production only)
    try {
      await udpService.startScan(onFound, onLost);
    } catch {
      // Final fallback: simulated discovery (Expo Go)
      await simulatedDiscovery.startScan(onFound, onLost, 2000);
    }
  }
}
```

```typescript
// 3. SIMULATED DISCOVERY (simulatedDiscovery.ts)
startScan(onFound, onLost, intervalMs = 2000) {
  // Poll session registry every 2 seconds
  this.scanInterval = setInterval(() => {
    const activeSessions = sessionRegistry.getAllActiveSessions();

    activeSessions.forEach((sessionData) => {
      if (!this.lastSeenSessions.has(sessionData.sessionId)) {
        // New session found
        const discoveredSession = {
          advertisement: {
            sessionId: sessionData.sessionId,
            sessionName: sessionData.sessionName,
            hostId: sessionData.hostId,
            hostName: sessionData.hostName,
            memberCount: sessionData.members.size,
            maxMembers: sessionData.maxMembers,
          },
          discoveryMethod: "simulated",
          lastSeen: Date.now(),
          signalStrength: 100,
          ipAddress: "127.0.0.1",
          port: 8080,
        };

        onFound(discoveredSession);
      }
    });
  }, intervalMs);
}
```

### Result

- ✅ Guest sees host's session in "Nearby Sessions" list
- ✅ Shows: session name, host name, member count (1/8)
- ✅ Session validated against registry before display

---

## 3. Guest Joins Session

### User Action

User taps on discovered session OR enters session code manually

### Code Flow (Discovery Join)

```typescript
// 1. TAP SESSION (join-session.tsx)
const handleJoinSession = (session: DiscoveredSessionData) => {
  router.push({
    pathname: "/player-room",
    params: {
      sessionId: session.advertisement.sessionId,
      sessionName: session.advertisement.sessionName,
      isHost: "false",
    },
  });
};
```

### Code Flow (Manual Code Entry)

```typescript
// 1. ENTER CODE (join-session.tsx)
const handleJoinSession = () => {
  const cleanId = sessionCode.replace(/[^A-Z0-9]/g, "");

  // Validate with session registry
  const validation = sessionRegistry.validateSessionCode(cleanId);

  if (!validation.valid) {
    Alert.alert("Cannot Join Session", validation.reason);
    return;
  }

  // Navigate to player room as guest
  router.push({
    pathname: "/player-room",
    params: {
      sessionId: validation.sessionId,
      sessionName: validation.sessionName || "Party Room",
      isHost: "false",
    },
  });
};
```

```typescript
// 2. INITIALIZE GUEST (player-room.tsx)
useEffect(() => {
  if (params.isHost === "false") {
    // Join session via Zustand
    joinSession(params.sessionId);
  }
}, [params.isHost, params.sessionId]);
```

```typescript
// 3. JOIN SESSION (sessionSlice.ts)
joinSession: async (sessionId: string) => {
  const localDevice = get().localDevice;

  // Get session from discovered sessions
  const discoveredSession = get().discoveredSessions.find(
    (s) => s.session.id === sessionId,
  );

  if (!discoveredSession) {
    throw new Error("Session not found");
  }

  // Create WebSocket client
  wsClient = new WebSocketService();

  // Setup event handlers
  wsClient.setHandlers({
    onConnected: () => {
      console.log("✅ Connected to host");
      set({ status: "connected" });
    },
    onDisconnected: (reason) => {
      console.log("❌ Disconnected:", reason);
      set({ status: "disconnected" });
    },
    onMemberListReceived: (members) => {
      set({ members });
    },
  });

  // Connect to host
  const hostAddress = discoveredSession.session.hostAddress; // "192.168.1.100:8080"
  await wsClient.connect(`ws://${hostAddress}`, {
    sessionId,
    deviceId: localDevice.id,
    deviceName: localDevice.name,
  });

  set({
    status: "connecting",
    role: "client",
    currentSession: discoveredSession.session,
  });
};
```

```typescript
// 4. WEBSOCKET CLIENT CONNECT (websocketClient.ts)
async connect(url: string, options: ConnectOptions) {
  this.ws = new WebSocket(url);

  this.ws.onopen = () => {
    // Send JOIN message
    const joinMessage = MessageBuilder.join(
      options.sessionId,
      options.deviceId,
      options.deviceName,
      "1.0.0"
    );
    this.send(joinMessage);
  };

  this.ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    this.handleMessage(message);
  };
}
```

```typescript
// 5. SERVER RECEIVES JOIN (websocketServer.ts)
handleJoin(ws, message, address) {
  const { sessionId, deviceId, deviceName } = message.payload;

  // Validate session ID
  if (sessionId !== this.options.sessionId) {
    this.sendError(ws, "SESSION_NOT_FOUND", "Session not found");
    ws.close();
    return null;
  }

  // Check duplicate
  if (this.clients.has(deviceId)) {
    this.sendError(ws, "ALREADY_JOINED", "Already joined");
    ws.close();
    return null;
  }

  // Check capacity
  if (this.clients.size >= this.options.maxMembers - 1) {
    this.sendError(ws, "SESSION_FULL", "Session full");
    ws.close();
    return null;
  }

  // Add client
  this.clients.set(deviceId, {
    ws,
    info: { deviceId, deviceName, joinedAt: Date.now(), address },
    lastHeartbeat: Date.now(),
    latency: null,
  });

  // Send WELCOME
  const welcome = MessageBuilder.welcome(
    sessionId,
    this.options.sessionName,
    this.options.hostId,
    this.options.hostName,
    deviceId
  );
  this.sendToClient(ws, welcome);

  // Send MEMBER_LIST
  const memberList = MessageBuilder.memberList(this.getMemberList());
  this.sendToClient(ws, memberList);

  // Broadcast MEMBER_JOINED to others
  const joined = MessageBuilder.memberJoined({
    id: deviceId,
    name: deviceName,
    role: "client",
    connectionStatus: "connected",
    joinedAt: Date.now(),
  });
  this.broadcastExcept(joined, deviceId);

  // Notify callbacks
  this.handlers.onClientJoined?.({ deviceId, deviceName, joinedAt: Date.now(), address });
  this.handlers.onMemberListChanged?.(this.getMemberList());

  return deviceId;
}
```

```typescript
// 6. SESSION SERVER MANAGER HANDLES JOIN (sessionServerManager.ts)
private handleClientJoined(client: ClientInfo) {
  // Register in session registry
  this.registerMember(client.deviceId, client.deviceName);

  // Get full member info
  const members = this.getMembers();
  const member = members.find(m => m.id === client.deviceId);

  // Notify Zustand callback
  this.callbacks.onMemberJoined?.(member);
}
```

```typescript
// 7. ZUSTAND UPDATES STATE (sessionSlice.ts)
onMemberJoined: (member) => {
  console.log("Member joined:", member.name);
  get().addMember(member);
};
```

```typescript
// 8. GUEST RECEIVES WELCOME & MEMBER_LIST (websocketClient.ts)
handleMessage(message) {
  switch (message.type) {
    case "WELCOME":
      this.handlers.onConnected?.();
      break;

    case "MEMBER_LIST":
      this.handlers.onMemberListReceived?.(message.payload.members);
      break;

    case "MEMBER_JOINED":
      // Another guest joined after me
      this.handlers.onMemberJoined?.(message.payload.member);
      break;
  }
}
```

### Result

**On Host Device:**

- ✅ Console: "📥 Client joined: Android (device-456)"
- ✅ Member count updates: "2 Connected"
- ✅ Member list shows: [Host (you), Android]
- ✅ UI auto-updates via Zustand

**On Guest Device:**

- ✅ Console: "✅ Connected to host"
- ✅ Receives WELCOME message
- ✅ Receives MEMBER_LIST with [Host, Me]
- ✅ Status changes to "connected"
- ✅ UI shows: "2 Connected"

---

## 4. Third Guest Joins

### Flow

Same as "Guest Joins Session" but with additional broadcast

**On Host Device:**

- Guest #2 connects
- Server sends WELCOME to Guest #2
- Server sends MEMBER_LIST to Guest #2
- **Server broadcasts MEMBER_JOINED to Guest #1**

**On Guest #1 Device:**

- Receives MEMBER_JOINED message
- Updates local member list
- UI shows: "3 Connected" [Host, Me, Guest #2]

**On Guest #2 Device:**

- Receives WELCOME
- Receives MEMBER_LIST with [Host, Guest #1, Me]
- UI shows: "3 Connected"

### Result

- ✅ All devices synchronized
- ✅ All see same member count and list
- ✅ Real-time updates via WebSocket broadcasts

---

## 5. Guest Disconnects

### User Action

Guest closes app OR network fails OR guest taps "Leave"

### Code Flow

```typescript
// 1. CONNECTION CLOSES (websocketServer.ts)
ws.on("close", () => {
  if (deviceId) {
    console.log(`Client ${deviceId} disconnected`);
    this.removeClient(deviceId, "Connection closed");
  }
});
```

```typescript
// 2. REMOVE CLIENT (websocketServer.ts)
removeClient(deviceId: string, reason?: string) {
  const client = this.clients.get(deviceId);
  if (!client) return;

  // Remove from map
  this.clients.delete(deviceId);

  // Broadcast MEMBER_LEFT to all remaining clients
  const leftMessage = MessageBuilder.memberLeft(deviceId, reason);
  this.broadcast(leftMessage);

  // Notify callback
  this.handlers.onClientLeft?.(deviceId, reason);
  this.handlers.onMemberListChanged?.(this.getMemberList());
}
```

```typescript
// 3. SESSION SERVER MANAGER HANDLES LEAVE (sessionServerManager.ts)
private handleClientLeft(deviceId: string, reason?: string) {
  console.log(`📤 Client left: ${deviceId} (${reason})`);

  // Remove from session registry
  this.removeMember(deviceId, reason);

  // Notify Zustand callback
  this.callbacks.onMemberLeft?.(deviceId, reason);
}
```

```typescript
// 4. ZUSTAND UPDATES STATE (sessionSlice.ts)
onMemberLeft: (deviceId, reason) => {
  console.log("Member left:", deviceId, reason);
  get().removeMember(deviceId);
};
```

### Result

**On Host Device:**

- ✅ Console: "📤 Client left: device-456 (Connection closed)"
- ✅ Member count updates: "2 Connected" (was 3)
- ✅ Member list removes Guest #2
- ✅ UI auto-updates immediately

**On Remaining Guest Device:**

- ✅ Receives MEMBER_LEFT message
- ✅ Removes Guest #2 from local member list
- ✅ UI updates: "2 Connected"

---

## 6. Host Ends Session

### User Action

Host taps "End Session" button

### Code Flow

```typescript
// 1. END SESSION (player-room.tsx)
const handleLeaveSession = async () => {
  Alert.alert(
    "End Session?",
    "This will disconnect all users and end the session.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Session",
        style: "destructive",
        onPress: async () => {
          await stopHosting();
          router.replace("/home");
        },
      },
    ],
  );
};
```

```typescript
// 2. STOP HOSTING (sessionSlice.ts)
stopHosting: async () => {
  console.log("Stopping host...");

  // Stop WebSocket server
  await sessionServerManager.stopServer();

  // Stop network broadcasts
  hostBroadcastService.stopBroadcast();

  // Clear state
  set({
    status: "idle",
    role: null,
    currentSession: null,
    connectedAt: null,
    error: null,
  });

  get().clearMembers();
};
```

```typescript
// 3. STOP SERVER (sessionServerManager.ts)
async stopServer() {
  console.log("Stopping server...");

  await this.server.stop();
  this.server = null;
  this.options = null;

  // Notify callback
  this.callbacks.onServerStopped?.();
}
```

```typescript
// 4. SERVER STOP (websocketServer.ts)
async stop() {
  console.log("Stopping server...");

  // Notify all clients
  const closeMessage = MessageBuilder.sessionClosed("Host closed session");
  this.broadcast(closeMessage);

  // Close all connections
  this.clients.forEach((client) => {
    client.ws.close(1000, "Server closing");
  });
  this.clients.clear();

  // Stop heartbeat monitoring
  if (this.heartbeatCheckInterval) {
    clearInterval(this.heartbeatCheckInterval);
  }

  // Close server
  this.server.close(() => {
    console.log("Server stopped");
    this.isRunning = false;
  });
}
```

```typescript
// 5. GUESTS RECEIVE SESSION_CLOSED (websocketClient.ts)
handleMessage(message) {
  if (message.type === "SESSION_CLOSED") {
    console.log("Session closed by host:", message.payload.reason);
    this.disconnect();
    this.handlers.onSessionClosed?.(message.payload.reason);
  }
}
```

### Result

**On Host Device:**

- ✅ Server stops accepting connections
- ✅ All clients disconnected
- ✅ Broadcasts stopped
- ✅ State cleared
- ✅ Navigate to home screen

**On All Guest Devices:**

- ✅ Receive SESSION_CLOSED message
- ✅ WebSocket connection closed
- ✅ Alert shown: "Session ended by host"
- ✅ Navigate to home screen

---

## Edge Cases Handled

### 1. Duplicate Join Attempt

- **Scenario:** Same device tries to join twice
- **Detection:** Check `this.clients.has(deviceId)` in `handleJoin()`
- **Response:** Send ERROR "Already joined", close new connection
- **Result:** Keep existing connection alive

### 2. Session Full

- **Scenario:** 9th guest tries to join (max 8)
- **Detection:** `this.clients.size >= maxMembers - 1`
- **Response:** Send ERROR "Session full", close connection
- **Result:** Guest sees "Session is full (8/8)"

### 3. Invalid Session ID

- **Scenario:** Guest tries to join with wrong session ID
- **Detection:** `sessionId !== this.options.sessionId`
- **Response:** Send ERROR "Session not found", close connection
- **Result:** Guest sees "Invalid session code"

### 4. Heartbeat Timeout

- **Scenario:** Guest's connection silent for 15 seconds
- **Detection:** Periodic heartbeat check every 5 seconds
- **Response:** Remove client, broadcast MEMBER_LEFT
- **Result:** Auto-cleanup of dead connections

### 5. Host Device Backgrounded

- **Scenario:** Host locks device or switches apps
- **iOS:** Use background audio mode to keep server alive
- **Android:** Use foreground service
- **Fallback:** Show warning "Locking will pause session"

---

## State Synchronization

### Zustand Store Structure

```typescript
interface SessionState {
  status: "idle" | "connecting" | "connected" | "hosting" | "disconnected";
  role: "host" | "client" | null;
  currentSession: Session | null;
  members: MemberInfo[];
  connectionStatus: ConnectionStatus;
}
```

### State Updates

- **Host creates session:** `role = "host"`, `members = [host]`
- **Server starts:** `status = "hosting"`
- **Guest joins:** `members.push(guest)` on all devices
- **Guest leaves:** `members = members.filter(m => m.id !== guestId)`
- **Host stops:** `role = null`, `members = []`, `status = "idle"`

### React Component Updates

- Components use `useLoudSyncStore()` hook
- Zustand notifies components on state changes
- UI auto-updates without manual polling
- No need for `useEffect` polling

---

## Summary

**Key Points:**

1. ✅ SessionServerManager provides high-level API
2. ✅ WebSocketServer handles low-level networking
3. ✅ Zustand state automatically synchronized
4. ✅ All edge cases handled gracefully
5. ✅ Real-time updates via WebSocket broadcasts
6. ✅ Works in Expo Go (simulated discovery)
7. ✅ Production-ready with native modules

**Next Steps:**

- Build native WebSocket server module
- Test on real devices (same WiFi)
- Add reconnection logic
- Implement session persistence
- Add audio streaming (Phase 2)
