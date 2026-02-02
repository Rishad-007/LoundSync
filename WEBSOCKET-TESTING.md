# WebSocket Testing Guidelines

Comprehensive testing guide for the LOUDSYNC WebSocket connection system.

---

## Testing Strategy

### Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /----\
      /      \  Integration Tests (30%)
     /--------\
    /          \  Unit Tests (60%)
   /------------\
```

---

## 1. Unit Tests

### Protocol Message Builders

**File:** `src/network/protocol.test.ts`

```typescript
import { MessageBuilder, MessageType } from "@/network/protocol";

describe("MessageBuilder", () => {
  describe("join()", () => {
    it("should create valid JOIN message", () => {
      const message = MessageBuilder.join("session-123", {
        id: "device-456",
        name: "Test Device",
        type: "client",
      });

      expect(message.type).toBe(MessageType.JOIN);
      expect(message.sessionId).toBe("session-123");
      expect(message.deviceInfo.id).toBe("device-456");
      expect(message.timestamp).toBeCloseTo(Date.now(), -2);
    });
  });

  describe("welcome()", () => {
    it("should create valid WELCOME message", () => {
      const message = MessageBuilder.welcome("client-789", {
        id: "session-123",
        name: "Test Session",
        hostId: "host-001",
      });

      expect(message.type).toBe(MessageType.WELCOME);
      expect(message.clientId).toBe("client-789");
      expect(message.sessionInfo.id).toBe("session-123");
    });
  });

  describe("memberList()", () => {
    it("should create valid MEMBER_LIST message", () => {
      const members = [
        {
          id: "host-001",
          name: "Host Device",
          isHost: true,
          connectionStatus: "connected" as const,
          joinedAt: Date.now(),
        },
      ];

      const message = MessageBuilder.memberList(members);

      expect(message.type).toBe(MessageType.MEMBER_LIST);
      expect(message.members).toHaveLength(1);
      expect(message.members[0].isHost).toBe(true);
    });
  });

  describe("error()", () => {
    it("should create valid ERROR message", () => {
      const message = MessageBuilder.error(
        "session_full",
        "Session is at capacity",
        { maxMembers: 10 },
      );

      expect(message.type).toBe(MessageType.ERROR);
      expect(message.code).toBe("session_full");
      expect(message.message).toBe("Session is at capacity");
      expect(message.details.maxMembers).toBe(10);
    });
  });

  describe("heartbeat()", () => {
    it("should create valid HEARTBEAT message", () => {
      const message = MessageBuilder.heartbeat();

      expect(message.type).toBe(MessageType.HEARTBEAT);
      expect(message.timestamp).toBeDefined();
    });
  });

  describe("ping() and pong()", () => {
    it("should create matching PING/PONG messages", () => {
      const ping = MessageBuilder.ping();
      const pong = MessageBuilder.pong();

      expect(ping.type).toBe(MessageType.PING);
      expect(pong.type).toBe(MessageType.PONG);
      expect(Math.abs(ping.timestamp - pong.timestamp)).toBeLessThan(10);
    });
  });
});
```

### WebSocketService Unit Tests

**File:** `src/network/websocketClient.test.ts`

```typescript
import { WebSocketService } from "@/network/websocketClient";

describe("WebSocketService", () => {
  let service: WebSocketService;
  let mockWebSocket: any;

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: WebSocket.OPEN,
    };

    global.WebSocket = jest.fn(() => mockWebSocket) as any;

    service = new WebSocketService({
      host: "192.168.1.100",
      port: 8080,
      sessionId: "test-session",
      deviceId: "test-device",
      deviceName: "Test Device",
    });
  });

  afterEach(() => {
    service.disconnect();
  });

  describe("connectToHost()", () => {
    it("should establish connection and send JOIN", async () => {
      const connectPromise = service.connectToHost();

      // Simulate connection open
      const openHandler = mockWebSocket.addEventListener.mock.calls.find(
        (call) => call[0] === "open",
      )[1];
      openHandler();

      await connectPromise;

      expect(service.getConnectionState()).toBe("connected");
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"join"'),
      );
    });

    it("should timeout if connection takes too long", async () => {
      await expect(service.connectToHost()).rejects.toThrow(
        "Connection timeout",
      );
    });

    it("should reject if WebSocket errors", async () => {
      const connectPromise = service.connectToHost();

      const errorHandler = mockWebSocket.addEventListener.mock.calls.find(
        (call) => call[0] === "error",
      )[1];
      errorHandler(new Error("Connection failed"));

      await expect(connectPromise).rejects.toThrow();
    });
  });

  describe("disconnect()", () => {
    it("should send LEAVE and close connection", () => {
      service.disconnect("User left");

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"leave"'),
      );
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it("should clear heartbeat interval", () => {
      jest.useFakeTimers();
      service.disconnect();

      // Advance time, heartbeat should not fire
      jest.advanceTimersByTime(6000);

      const heartbeatCallsBefore = mockWebSocket.send.mock.calls.length;
      jest.advanceTimersByTime(6000);
      const heartbeatCallsAfter = mockWebSocket.send.mock.calls.length;

      expect(heartbeatCallsAfter).toBe(heartbeatCallsBefore);
      jest.useRealTimers();
    });
  });

  describe("heartbeat()", () => {
    it("should send HEARTBEAT every 5 seconds", () => {
      jest.useFakeTimers();

      // Start heartbeat
      service["startHeartbeat"]();

      // Initial heartbeat
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"heartbeat"'),
      );

      // Clear mock
      mockWebSocket.send.mockClear();

      // Advance 5 seconds
      jest.advanceTimersByTime(5000);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"heartbeat"'),
      );

      jest.useRealTimers();
    });

    it("should send PING for latency tracking", () => {
      jest.useFakeTimers();

      service["startHeartbeat"]();
      mockWebSocket.send.mockClear();

      jest.advanceTimersByTime(5000);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ping"'),
      );

      jest.useRealTimers();
    });
  });

  describe("message handling", () => {
    it("should call onWelcome handler", () => {
      const onWelcome = jest.fn();
      service.setHandlers({ onWelcome });

      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        (call) => call[0] === "message",
      )[1];

      const welcomeMessage = {
        type: "welcome",
        timestamp: Date.now(),
        clientId: "client-123",
        sessionInfo: { id: "session-1", name: "Test", hostId: "host-1" },
      };

      messageHandler({ data: JSON.stringify(welcomeMessage) });

      expect(onWelcome).toHaveBeenCalledWith(welcomeMessage);
    });

    it("should calculate latency from PONG", () => {
      const timestamp = Date.now() - 50; // 50ms ago
      service["lastPingTimestamp"] = timestamp;

      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        (call) => call[0] === "message",
      )[1];

      messageHandler({
        data: JSON.stringify({
          type: "pong",
          timestamp,
        }),
      });

      expect(service.getLatency()).toBeCloseTo(50, -1);
    });
  });

  describe("reconnection", () => {
    it("should attempt reconnection on disconnect", async () => {
      jest.useFakeTimers();

      // Simulate unexpected disconnect
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        (call) => call[0] === "close",
      )[1];
      closeHandler({ code: 1006, reason: "Abnormal closure" });

      expect(service.getConnectionState()).toBe("reconnecting");

      // Advance past reconnect delay
      jest.advanceTimersByTime(2000);

      // Should attempt new connection
      expect(global.WebSocket).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it("should give up after max attempts", async () => {
      jest.useFakeTimers();

      service = new WebSocketService({
        host: "192.168.1.100",
        port: 8080,
        sessionId: "test-session",
        deviceId: "test-device",
        deviceName: "Test Device",
        maxReconnectAttempts: 2,
      });

      // Fail 2 times
      for (let i = 0; i < 2; i++) {
        const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
          (call) => call[0] === "close",
        )[1];
        closeHandler({ code: 1006 });

        jest.advanceTimersByTime(2000);
      }

      expect(service.getConnectionState()).toBe("failed");

      jest.useRealTimers();
    });
  });
});
```

### WebSocketServer Unit Tests

**File:** `src/network/websocketServer.test.ts`

```typescript
import { WebSocketServer } from "@/network/websocketServer";
import { Server as WSServer } from "ws";

jest.mock("ws");

describe("WebSocketServer", () => {
  let server: WebSocketServer;
  let mockWSServer: any;

  beforeEach(() => {
    mockWSServer = {
      on: jest.fn(),
      close: jest.fn(),
      clients: new Set(),
    };

    (WSServer as any).mockImplementation(() => mockWSServer);

    server = new WebSocketServer({
      port: 8080,
      sessionId: "test-session",
      sessionName: "Test Session",
      hostId: "host-001",
      hostName: "Host Device",
      maxMembers: 10,
    });
  });

  describe("start()", () => {
    it("should create and start WebSocket server", async () => {
      await server.start();

      expect(WSServer).toHaveBeenCalledWith({ port: 8080 });
      expect(mockWSServer.on).toHaveBeenCalledWith(
        "connection",
        expect.any(Function),
      );
    });

    it("should set up connection handler", async () => {
      await server.start();

      const connectionHandler = mockWSServer.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      expect(connectionHandler).toBeDefined();
    });
  });

  describe("handleJoin()", () => {
    it("should accept valid JOIN message", async () => {
      await server.start();

      const mockClient = {
        send: jest.fn(),
        on: jest.fn(),
      };

      const joinMessage = {
        type: "join",
        timestamp: Date.now(),
        sessionId: "test-session",
        deviceInfo: {
          id: "client-123",
          name: "Client Device",
          type: "client",
        },
      };

      server["handleJoin"](mockClient as any, joinMessage);

      // Should send WELCOME
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"welcome"'),
      );

      // Should send MEMBER_LIST
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"member_list"'),
      );
    });

    it("should reject JOIN with wrong session ID", async () => {
      await server.start();

      const mockClient = { send: jest.fn(), close: jest.fn() };

      const joinMessage = {
        type: "join",
        timestamp: Date.now(),
        sessionId: "wrong-session",
        deviceInfo: { id: "client-123", name: "Client", type: "client" },
      };

      server["handleJoin"](mockClient as any, joinMessage);

      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"code":"session_not_found"'),
      );
    });

    it("should reject JOIN when session is full", async () => {
      server = new WebSocketServer({
        port: 8080,
        sessionId: "test-session",
        sessionName: "Test Session",
        hostId: "host-001",
        hostName: "Host Device",
        maxMembers: 2, // Only host + 1 client
      });

      await server.start();

      // Add first client (fills session)
      const mockClient1 = { send: jest.fn(), on: jest.fn() };
      server["handleJoin"](mockClient1 as any, {
        type: "join",
        timestamp: Date.now(),
        sessionId: "test-session",
        deviceInfo: { id: "client-1", name: "Client 1", type: "client" },
      });

      // Try to add second client (should fail)
      const mockClient2 = { send: jest.fn(), close: jest.fn() };
      server["handleJoin"](mockClient2 as any, {
        type: "join",
        timestamp: Date.now(),
        sessionId: "test-session",
        deviceInfo: { id: "client-2", name: "Client 2", type: "client" },
      });

      expect(mockClient2.send).toHaveBeenCalledWith(
        expect.stringContaining('"code":"session_full"'),
      );
    });
  });

  describe("heartbeat monitoring", () => {
    it("should disconnect clients without heartbeat", async () => {
      jest.useFakeTimers();

      await server.start();

      const mockClient = {
        send: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
      };

      // Add client
      server["clients"].set("client-123", {
        ws: mockClient as any,
        info: {
          id: "client-123",
          name: "Test Client",
          isHost: false,
          connectionStatus: "connected",
          joinedAt: Date.now(),
        },
        lastHeartbeat: Date.now() - 16000, // 16 seconds ago (timeout is 15s)
      });

      // Start heartbeat check
      server["startHeartbeatCheck"]();

      // Advance past check interval
      jest.advanceTimersByTime(5000);

      expect(mockClient.close).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("should not disconnect clients with recent heartbeat", async () => {
      jest.useFakeTimers();

      await server.start();

      const mockClient = {
        send: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
      };

      server["clients"].set("client-123", {
        ws: mockClient as any,
        info: {
          id: "client-123",
          name: "Test Client",
          isHost: false,
          connectionStatus: "connected",
          joinedAt: Date.now(),
        },
        lastHeartbeat: Date.now() - 5000, // 5 seconds ago (within timeout)
      });

      server["startHeartbeatCheck"]();
      jest.advanceTimersByTime(5000);

      expect(mockClient.close).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe("stop()", () => {
    it("should broadcast SESSION_CLOSED and close all connections", async () => {
      await server.start();

      const mockClient1 = { send: jest.fn(), close: jest.fn() };
      const mockClient2 = { send: jest.fn(), close: jest.fn() };

      server["clients"].set("client-1", {
        ws: mockClient1 as any,
        info: {
          id: "client-1",
          name: "Client 1",
          isHost: false,
          connectionStatus: "connected",
          joinedAt: Date.now(),
        },
      });

      server["clients"].set("client-2", {
        ws: mockClient2 as any,
        info: {
          id: "client-2",
          name: "Client 2",
          isHost: false,
          connectionStatus: "connected",
          joinedAt: Date.now(),
        },
      });

      await server.stop();

      expect(mockClient1.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"session_closed"'),
      );
      expect(mockClient2.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"session_closed"'),
      );
      expect(mockWSServer.close).toHaveBeenCalled();
    });
  });
});
```

---

## 2. Integration Tests

### Session Lifecycle Integration

**File:** `src/state/slices/sessionSlice.integration.test.ts`

```typescript
import { useSessionStore } from "@/state";
import { WebSocketServer } from "@/network/websocketServer";

describe("Session Integration", () => {
  let cleanup: () => void;

  afterEach(() => {
    cleanup?.();
  });

  it("should complete full host-client flow", async () => {
    // 1. Start hosting
    const {
      startHosting,
      stopHosting,
      session: hostSession,
    } = useSessionStore.getState();

    await startHosting("Test Session", "host-device");
    expect(hostSession?.isHost).toBe(true);
    expect(hostSession?.memberCount).toBe(1);

    // 2. Join as client
    const clientStore = useSessionStore.getState();
    await clientStore.joinSession(
      hostSession!.id,
      "Test Session",
      "localhost",
      8080,
      "client-device",
    );

    expect(clientStore.session?.isConnected).toBe(true);
    expect(hostSession?.memberCount).toBe(2);

    // 3. Leave as client
    clientStore.leaveSession();
    expect(clientStore.session).toBeNull();

    // Wait for server to process
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(hostSession?.memberCount).toBe(1);

    // 4. Stop hosting
    stopHosting();
    expect(hostSession).toBeNull();

    cleanup = () => {
      stopHosting();
      clientStore.leaveSession();
    };
  });

  it("should handle multiple clients joining", async () => {
    const { startHosting, stopHosting, session } = useSessionStore.getState();

    await startHosting("Multi-Client Test", "host-device");

    // Join 3 clients
    const clients = await Promise.all([
      createClient("client-1"),
      createClient("client-2"),
      createClient("client-3"),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(session?.memberCount).toBe(4); // host + 3 clients

    // Clean up
    clients.forEach((c) => c.leaveSession());
    stopHosting();
  });
});

async function createClient(deviceId: string) {
  const store = useSessionStore.getState();
  await store.joinSession("test-session", "Test", "localhost", 8080, deviceId);
  return store;
}
```

---

## 3. End-to-End Tests

### Multi-Device Simulation

**File:** `e2e/websocket-connection.e2e.test.ts`

```typescript
describe("WebSocket E2E", () => {
  it("should handle 10 concurrent clients", async () => {
    // Start host
    const host = await device.launchApp({
      newInstance: true,
      launchArgs: { role: "host" },
    });

    await element(by.id("start-hosting-button")).tap();
    await waitFor(element(by.id("session-active")))
      .toBeVisible()
      .withTimeout(5000);

    // Launch 10 clients
    const clients = [];
    for (let i = 0; i < 10; i++) {
      const client = await device.launchApp({
        newInstance: true,
        launchArgs: { role: "client", deviceId: `client-${i}` },
      });

      await element(by.id("join-session-button")).tap();
      await waitFor(element(by.id("connected-indicator")))
        .toBeVisible()
        .withTimeout(10000);

      clients.push(client);
    }

    // Verify all clients connected
    await expect(element(by.text("11 members"))).toBeVisible();

    // Verify each client sees all members
    for (const client of clients) {
      await device.selectApp(client);
      await expect(element(by.id("member-count"))).toHaveText("11");
    }
  });

  it("should maintain connection during network interruption", async () => {
    // Setup: Host and client connected
    await setupHostAndClient();

    // Simulate network interruption
    await device.setNetworkConditions("airplane");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Client should show reconnecting
    await expect(element(by.id("connection-status"))).toHaveText(
      "Reconnecting...",
    );

    // Restore network
    await device.setNetworkConditions("online");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Should reconnect
    await expect(element(by.id("connection-status"))).toHaveText("Connected");
  });
});
```

---

## 4. Performance Tests

### Load Testing

```typescript
describe('Performance', () => {
  it('should handle rapid member joins', async () => {
    const server = new WebSocketServer({...});
    await server.start();

    const startTime = Date.now();

    // Join 50 clients rapidly
    const clients = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        connectClient(`client-${i}`)
      )
    );

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // Under 5 seconds
    expect(clients.every(c => c.isConnected)).toBe(true);
  });

  it('should maintain low latency under load', async () => {
    // Setup: 20 connected clients
    const clients = await setupMultipleClients(20);

    // Measure latency for each
    const latencies = await Promise.all(
      clients.map(c => c.measureLatency())
    );

    const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;

    expect(avgLatency).toBeLessThan(100); // Under 100ms average
    expect(Math.max(...latencies)).toBeLessThan(200); // Max under 200ms
  });
});
```

---

## 5. Manual Testing Checklist

### Basic Connection Flow

- [ ] Host can start a session
- [ ] Client can discover and join session
- [ ] Member list updates on both devices
- [ ] Latency displays correctly
- [ ] Client can leave gracefully
- [ ] Host can stop session

### Multiple Clients

- [ ] 2 clients can join simultaneously
- [ ] 5 clients can join and all see each other
- [ ] 10 clients can join (test max capacity)
- [ ] Member list updates correctly for all
- [ ] One client leaving doesn't affect others

### Connection Stability

- [ ] Connection survives for 5 minutes
- [ ] Heartbeat keeps connection alive
- [ ] No disconnections during idle time
- [ ] Latency remains stable

### Reconnection

- [ ] Client reconnects after brief network loss
- [ ] Client shows "Reconnecting..." state
- [ ] Client gives up after 3 failed attempts
- [ ] Reconnected client rejoins member list

### Error Handling

- [ ] Joining full session shows error
- [ ] Joining non-existent session shows error
- [ ] Connection timeout shows error
- [ ] Network error shows appropriate message

### Edge Cases

- [ ] Host leaves while clients connected
- [ ] All clients leave, host remains
- [ ] Client joins, immediately leaves
- [ ] Client crashes, timeout detected
- [ ] Duplicate device ID rejected

---

## 6. Automated Test Scripts

### Connection Stress Test

```bash
#!/bin/bash
# test-connection-stress.sh

echo "Starting connection stress test..."

# Start host
npm run test:host &
HOST_PID=$!

sleep 2

# Launch 20 clients
for i in {1..20}; do
  npm run test:client -- --id client-$i &
  sleep 0.5
done

# Wait 30 seconds
sleep 30

# Kill all
kill $HOST_PID
killall node

echo "Stress test complete"
```

### Latency Monitor

```bash
#!/bin/bash
# monitor-latency.sh

while true; do
  LATENCY=$(npm run test:measure-latency)
  echo "$(date): $LATENCY ms"

  if [ "$LATENCY" -gt 200 ]; then
    echo "WARNING: High latency detected!"
  fi

  sleep 5
done
```

---

## 7. Test Environment Setup

### Local Network Setup

```bash
# Enable local network access in iOS Simulator
xcrun simctl privacy booted grant local-network com.yourapp

# Allow network in Android emulator (already enabled by default)

# Test on real devices on same WiFi
# Ensure port 8080 is open:
nc -zv 192.168.1.100 8080
```

### Mock WebSocket Server

```typescript
// test-utils/mockWebSocketServer.ts
export class MockWebSocketServer {
  constructor(private port: number) {}

  async start() {
    // Start mock server
  }

  simulateJoin(deviceInfo) {
    // Simulate client join
  }

  simulateLeave(clientId) {
    // Simulate client leave
  }

  simulateNetworkIssue() {
    // Simulate connection drop
  }

  async stop() {
    // Stop server
  }
}
```

---

## 8. CI/CD Integration

### GitHub Actions Workflow

```yaml
name: WebSocket Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:integration

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:e2e:ios
```

---

## 9. Debugging Tools

### WebSocket Inspector

```typescript
// debug/websocketInspector.ts
export class WebSocketInspector {
  static logMessage(direction: "sent" | "received", message: any) {
    console.log(`[WS ${direction}]`, {
      type: message.type,
      timestamp: new Date(message.timestamp).toISOString(),
      data: message,
    });
  }

  static measureLatency(client: WebSocketService) {
    setInterval(() => {
      const latency = client.getLatency();
      console.log(`[Latency] ${latency}ms`);
    }, 1000);
  }

  static monitorConnectionState(store: SessionStore) {
    store.subscribe(
      (state) => state.session?.isConnected,
      (isConnected) => {
        console.log(
          `[Connection] ${isConnected ? "Connected" : "Disconnected"}`,
        );
      },
    );
  }
}
```

### Network Traffic Analyzer

```bash
# Monitor WebSocket traffic on port 8080
tcpdump -i any -A 'tcp port 8080'

# Or use Wireshark with filter:
# tcp.port == 8080 && websocket
```

---

## 10. Performance Benchmarks

### Expected Metrics

| Metric                 | Target  | Acceptable | Poor    |
| ---------------------- | ------- | ---------- | ------- |
| Connection Time        | < 500ms | < 1s       | > 2s    |
| Average Latency        | < 30ms  | < 100ms    | > 200ms |
| Heartbeat Overhead     | < 1KB/s | < 2KB/s    | > 5KB/s |
| Member List Update     | < 100ms | < 500ms    | > 1s    |
| Reconnection Time      | < 2s    | < 5s       | > 10s   |
| Max Concurrent Clients | 20+     | 10+        | < 5     |

---

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** All critical flows
- **E2E Tests:** Happy path + 5 edge cases
- **Performance Tests:** All benchmarks passing

---

## Running All Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# With coverage
npm run test:coverage
```

---

## Continuous Monitoring

After deployment, monitor these metrics:

1. **Connection Success Rate** - Target: > 98%
2. **Average Session Duration** - Track over time
3. **Reconnection Success Rate** - Target: > 90%
4. **Heartbeat Timeout Rate** - Target: < 1%
5. **Average Latency** - Target: < 50ms

Use error tracking (Sentry, Crashlytics) to catch production issues.
