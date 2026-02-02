# LOUDSYNC State Quick Reference
**Phase 1: Session Hosting & Joining**

---

## Import Everything

```typescript
import {
  // Hooks
  useSession,
  useSessionDiscovery,
  useMemberList,
  useSessionInfo,
  
  // Selectors
  useLocalDevice,
  useSessionStatus,
  useCurrentSession,
  useMembers,
  useIsHost,
  
  // Actions
  useSessionActions,
  useMemberActions,
  useUserActions,
  
  // Types
  type Session,
  type Member,
  type ConnectionStatus,
} from "@/src/state";
```

---

## Common Patterns

### Initialize Device
```typescript
const { generateDeviceId } = useUserActions();
useEffect(() => {
  if (!localDevice) generateDeviceId();
}, []);
```

### Create & Host
```typescript
const { createSession, startHosting } = useSessionActions();
await createSession(name);
await startHosting();
```

### Discover & Join
```typescript
const { discover, joinSession } = useSessionDiscovery();
useEffect(() => { discover(); }, []);
await joinSession(sessionId);
```

### Display Members
```typescript
const { members } = useMemberList();
<FlatList data={members} ... />
```

### Accept Request (Host)
```typescript
const { acceptRequest } = useMemberActions();
await acceptRequest(memberId);
```

---

## Status Values

```typescript
"idle" | "hosting" | "discovering" | "joining" | "connected" | "disconnected"
```

---

## Mock Data

`discoverSessions()` returns 2 fake sessions after 1.5s

---

## See Full Docs

- `SESSION-ARCHITECTURE.md` - System design
- `ZUSTAND-IMPLEMENTATION-GUIDE.md` - Complete reference
- `ZUSTAND-USAGE-EXAMPLES.md` - Screen examples
- `STATE-IMPLEMENTATION-COMPLETE.md` - Summary
