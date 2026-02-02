# Testing Guide - Session Connection Fix

## Quick Test in Expo Go

### Prerequisites

- Expo Go app installed on device/simulator
- Metro bundler running: `npm start` or `npx expo start`

### Test Flow

## 1. Test Session Creation & Code Generation

**Steps:**

1. Launch app in Expo Go
2. Tap "Host Party"
3. Enter session name: "Test Party"
4. Enter host name: "Host"
5. Tap "Create Session"

**Expected Results:**

- ✅ Session code displayed in XXX-XXX format (e.g., "A1B-2C3")
- ✅ Console log: `✅ Session registered: A1B-2C3 (ID: A1B2C3)`
- ✅ Navigate to player room as host
- ✅ Host badge visible in top right
- ✅ Share button works with formatted code

**Console Logs to Watch:**

```
✅ Session registered: A1B-2C3 (ID: A1B2C3)
🎙️ Starting host broadcast for session: A1B2C3
[HostBroadcast] Starting broadcast for session: A1B2C3
[HostBroadcast] mDNS registration failed (UDP will be used): ...
[HostBroadcast] UDP setup failed: ...
```

_Note: mDNS/UDP failures are expected in Expo Go - this is normal_

---

## 2. Test Session Code Validation (Invalid Codes)

**Steps:**

1. Go back to home screen
2. Tap "Join Party"
3. Enter code: "XXX-XXX" (random invalid code)
4. Tap "Join Session"

**Expected Results:**

- ❌ Alert shown: "Cannot Join Session"
- ❌ Message: "Invalid session code"
- ✅ Stay on join screen (don't navigate)

**Console Logs:**

```
[SessionRegistry] Validating code: XXXXXX
[SessionRegistry] ❌ Invalid session code
```

---

## 3. Test Session Code Validation (Valid Code)

**Steps:**

1. On "Join Party" screen
2. Enter the code from Step 1 (e.g., "A1B-2C3")
3. Tap "Join Session"

**Expected Results:**

- ✅ No alert shown
- ✅ Navigate to player room as guest
- ✅ No "HOST" badge shown
- ✅ Can see same party name

**Console Logs:**

```
[SessionRegistry] Validating code: A1B2C3
[SessionRegistry] ✅ Valid session found
```

---

## 4. Test Discovery Scanning (Simulated Mode)

**Steps:**

1. Create a session as host (Step 1)
2. Copy the session code
3. Go back to home
4. Tap "Join Party"
5. Wait 2-5 seconds

**Expected Results:**

- ✅ Radar animation playing
- ✅ "Scanning nearby sessions..." text
- ✅ After 2-3 seconds: Session appears in "Nearby Sessions" list
- ✅ Session card shows: session name, host name, member count
- ✅ Tap session card to join directly (no code needed)

**Console Logs:**

```
[DiscoveryManager] Starting discovery...
[DiscoveryManager] mDNS failed, trying UDP fallback
[DiscoveryManager] UDP also failed, using simulated discovery (Expo Go mode)
[SimulatedDiscovery] Starting simulated scan (Expo Go mode)
[SimulatedDiscovery] Found session: A1B2C3
[DiscoveryManager] New session: A1B2C3 (Test Party)
[DiscoveryManager] Discovery complete. Found 1 sessions
```

---

## 5. Test Session Expiry (30 Minutes)

**Steps:**

1. Create a session
2. Wait 31 minutes (or modify `SESSION_EXPIRY_MS` in sessionRegistry.ts to 10 seconds for faster testing)
3. Try to join with the code

**Expected Results:**

- ❌ Alert: "Cannot Join Session"
- ❌ Message: "Session has expired"

**Console Logs:**

```
[SessionRegistry] Cleaned up 1 expired sessions
[SessionRegistry] Validating code: A1B2C3
[SessionRegistry] ❌ Session has expired
```

---

## 6. Test Full Session (Max Members)

**Steps:**

1. Create session with max 2 members (modify in create-session.tsx)
2. Join as guest (simulated second device)
3. Try to join again as third guest

**Expected Results:**

- ❌ Alert: "Cannot Join Session"
- ❌ Message: "Session is full"

---

## 7. Test Code Format Auto-Formatting

**Steps:**

1. On "Join Party" screen
2. Slowly type: "A1B2C3"
3. Watch the input field

**Expected Results:**

- ✅ After typing "A1B", dash auto-inserted: "A1B-"
- ✅ Continue typing "2C3" → shows "A1B-2C3"
- ✅ Max length enforced: 7 characters (XXX-XXX)
- ✅ Auto-uppercase: typing "a1b2c3" → shows "A1B-2C3"

---

## 8. Test Share Session Code

**Steps:**

1. Create session as host
2. Tap share icon (top right)
3. Check share message

**Expected Results:**

- ✅ Message includes: `Join my LOUDSYNC party "Test Party"! 🎵`
- ✅ Code formatted: `Code: A1B-2C3`
- ✅ WiFi reminder: `Make sure you're on the same WiFi network!`

---

## Common Issues & Solutions

### Issue: "No sessions found" in discovery

**Cause:** No active sessions in registry  
**Solution:** Create a session first as host

### Issue: mDNS/UDP errors in console

**Cause:** Native modules unavailable in Expo Go  
**Solution:** This is expected - simulated discovery will activate automatically

### Issue: TypeScript errors in store.ts

**Cause:** Module resolution configuration  
**Solution:** These are pre-existing, not related to our changes. App runs fine.

### Issue: Session immediately expires

**Cause:** System clock issues or `SESSION_EXPIRY_MS` too short  
**Solution:** Check sessionRegistry.ts line 9, should be 30 _ 60 _ 1000 (30 minutes)

---

## Debugging Tips

### Enable Verbose Logging

Add to any file:

```typescript
console.log("[DEBUG]", "Your debug message", data);
```

### Check Session Registry State

In any component:

```typescript
import { sessionRegistry } from "../src/network";

// Log all active sessions
console.log("Active sessions:", sessionRegistry.getAllActiveSessions());

// Test validation
const result = sessionRegistry.validateSessionCode("A1B2C3");
console.log("Validation result:", result);
```

### Monitor Discovery State

In join-session.tsx:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    console.log("Discovered:", discoveryManager.getDiscoveredSessions());
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

---

## Production Testing (Real Network)

### Prerequisites

- Two physical devices or simulators
- Both on same WiFi network
- Production build (not Expo Go): `eas build` or `expo prebuild`

### Expected Differences from Expo Go

- ✅ mDNS discovery works (real network broadcast)
- ✅ UDP discovery works (real network broadcast)
- ✅ No "simulated discovery" logs
- ✅ Faster discovery (2-3 seconds vs polling interval)
- ✅ Real IP addresses shown in logs

### Test Flow

1. Device A: Create session → Note the code
2. Device B: Open join screen → Wait for scan
3. ✅ Device B should see Device A's session appear within 3 seconds
4. Device B: Tap session or enter code → Join successfully
5. Both devices: Verify same session ID, name, member count

---

## Automated Testing (Future)

### Unit Tests (Jest)

```typescript
import { sessionRegistry } from "./sessionRegistry";

describe("SessionRegistry", () => {
  it("should validate valid session codes", () => {
    sessionRegistry.registerSession({
      sessionId: "ABC123",
      sessionCode: "ABC123",
      sessionName: "Test",
      hostId: "host1",
      hostName: "Host",
      maxMembers: 8,
    });

    const result = sessionRegistry.validateSessionCode("ABC123");
    expect(result.valid).toBe(true);
  });

  it("should reject invalid session codes", () => {
    const result = sessionRegistry.validateSessionCode("INVALID");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Invalid session code");
  });
});
```

### Integration Tests (Detox)

```typescript
describe("Session Flow", () => {
  it("should create and join session", async () => {
    // Create session
    await element(by.text("Host Party")).tap();
    await element(by.id("session-name-input")).typeText("Test Party");
    await element(by.text("Create Session")).tap();

    // Extract session code from UI
    const code = await element(by.id("session-code")).getText();

    // Join session
    await device.launchApp({ newInstance: true });
    await element(by.text("Join Party")).tap();
    await element(by.id("code-input")).typeText(code);
    await element(by.text("Join Session")).tap();

    // Verify joined
    await expect(element(by.text("Test Party"))).toBeVisible();
  });
});
```

---

## Performance Benchmarks

### Expected Performance

- Session creation: < 50ms
- Code validation: < 5ms
- Discovery scan start: < 100ms
- Session found (simulated): 2-3 seconds
- Session found (mDNS/UDP): 1-3 seconds

### Memory Usage

- Session Registry: ~1KB per session
- Discovery Manager: ~5KB overhead
- Total for 10 active sessions: ~15KB

---

## Security Considerations

### Session Code Security

- ✅ 6 alphanumeric characters = 36^6 = ~2 billion combinations
- ✅ 30 minute expiry limits brute force window
- ✅ No session list exposed publicly (only via discovery)

### Network Security

- ⚠️ Local network only (same WiFi required)
- ⚠️ No encryption in current implementation
- ⚠️ No authentication beyond session code

### Future Enhancements

- [ ] Add TLS/SSL for WebSocket connections
- [ ] Implement session passwords
- [ ] Add rate limiting for code validation
- [ ] Add session owner verification
