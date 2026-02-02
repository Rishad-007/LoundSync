# LOUDSYNC Empty & Error States

Comprehensive guide to implementing friendly empty and error states throughout LOUDSYNC.

## 🎨 Components

### 1. EmptyState (Full Screen)

Large, centered empty state with icon, title, description, and optional action button.

**Use cases:**

- No devices connected
- No song selected
- No sessions found
- No recent sessions
- Empty playlists

**Props:**

```tsx
interface EmptyStateProps {
  icon?: IconName; // Ionicons name (default: "albums-outline")
  title: string; // Main heading
  description: string; // Supporting text
  actionLabel?: string; // Button text
  onAction?: () => void; // Button handler
  gradient?: GradientType; // Color theme
  illustration?: React.ReactNode; // Custom illustration
}
```

**Example:**

```tsx
<EmptyState
  icon="phone-portrait-outline"
  title="No Devices Connected"
  description="Invite friends to join your session! Share the session code to start the party together."
  actionLabel="Share Session Code"
  onAction={() => handleShare()}
  gradient="electric"
/>
```

### 2. ErrorState (Full Screen)

Error state with animated pulse icon, error type detection, and retry/dismiss actions.

**Use cases:**

- Network disconnected
- Sync failure
- Permission denied
- Generic errors
- API failures

**Props:**

```tsx
interface ErrorStateProps {
  type?: "network" | "sync" | "generic" | "permission";
  icon?: IconName; // Override default icon
  title?: string; // Override default title
  description?: string; // Override default description
  retryLabel?: string; // Retry button text
  onRetry?: () => void; // Retry handler
  dismissLabel?: string; // Dismiss button text
  onDismiss?: () => void; // Dismiss handler
}
```

**Example:**

```tsx
// Automatic type-based defaults
<ErrorState
  type="network"
  onRetry={() => reconnect()}
  onDismiss={() => router.back()}
/>

// Custom error
<ErrorState
  icon="flash-off-outline"
  title="Sync Failed"
  description="Devices are out of sync by more than 500ms."
  retryLabel="Force Resync"
  onRetry={() => forceSync()}
/>
```

### 3. InlineEmptyState (Compact)

Small, inline empty state for use within lists, sections, or cards.

**Use cases:**

- Empty device list section
- No search results
- Empty section within page
- No items in grid

**Props:**

```tsx
interface InlineEmptyStateProps {
  icon?: IconName; // Ionicons name
  title: string; // Short message
  description?: string; // Optional details
  iconColor?: string; // Icon color
  compact?: boolean; // Even more compact
}
```

**Example:**

```tsx
<InlineEmptyState
  icon="people-outline"
  title="No devices connected"
  description="Waiting for others to join..."
  iconColor={theme.colors.neon.cyan}
/>
```

## 📍 Usage by Screen

### Player Room Screen

**Scenarios:**

1. **No devices connected** - Show in device grid section
2. **No song selected** - Show in player card area
3. **Sync error** - Modal or inline error
4. **Network lost** - Full screen error state

**Implementation:**

```tsx
// Device grid section
{
  connectedDevices === 0 ? (
    <InlineEmptyState
      icon="phone-portrait-outline"
      title="No devices connected"
      description="Share your session code to invite friends"
      iconColor={theme.colors.neon.cyan}
    />
  ) : (
    <View style={styles.deviceGrid}>{/* Device cards */}</View>
  );
}

// Player section
{
  !currentSong ? (
    <EmptyState
      icon="musical-notes-outline"
      title="No Song Selected"
      description="Choose a track to get the party started."
      actionLabel="Add Music"
      onAction={() => router.push("/music-select")}
      gradient="party"
    />
  ) : (
    <View style={styles.player}>{/* Player controls */}</View>
  );
}
```

### Join Session Screen

**Scenarios:**

1. **No nearby sessions** - After radar scan completes
2. **No recent sessions** - In recent section
3. **Failed to join** - Network or invalid code error

**Implementation:**

```tsx
// Nearby sessions
{
  nearbySessions.length === 0 && !isScanning && (
    <EmptyState
      icon="radio-outline"
      title="No Sessions Found"
      description="No nearby sessions detected. Make sure you're on the same network."
      actionLabel="Create Session"
      onAction={() => router.push("/create-session")}
      gradient="secondary"
    />
  );
}

// Recent sessions
{
  recentSessions.length === 0 ? (
    <InlineEmptyState
      icon="time-outline"
      title="No recent sessions"
      description="Your join history is empty"
      compact
    />
  ) : (
    <View>
      {recentSessions.map((session) => (
        <SessionCard key={session.id} {...session} />
      ))}
    </View>
  );
}
```

### Device List Modal

**Scenarios:**

1. **Only host connected** - No other devices
2. **Connection lost** - Network error
3. **Kick failed** - Error state

**Implementation:**

```tsx
{
  devices.filter((d) => !d.isHost).length === 0 && (
    <InlineEmptyState
      icon="people-outline"
      title="Waiting for others"
      description="Share your session code to invite friends"
      iconColor={theme.colors.neon.purple}
    />
  );
}
```

## 🎭 Error Types & Defaults

### Network Error

```tsx
{
  icon: "wifi-outline",
  title: "Connection Lost",
  description: "Unable to connect to the network. Check your internet connection and try again."
}
```

### Sync Error

```tsx
{
  icon: "sync-circle-outline",
  title: "Sync Error",
  description: "Failed to synchronize with other devices. Please check your connection and retry."
}
```

### Generic Error

```tsx
{
  icon: "alert-circle-outline",
  title: "Something Went Wrong",
  description: "An unexpected error occurred. Don't worry, we're working on it."
}
```

### Permission Error

```tsx
{
  icon: "shield-outline",
  title: "Permission Required",
  description: "This feature requires additional permissions. Please grant access in settings."
}
```

## 🎨 Visual Design

### Empty State

- **Icon**: 140×140px gradient circle with 64px Ionicon
- **Neon glow**: Shadow effect on icon circle
- **Background**: Subtle gradient overlay (10% opacity)
- **Animation**: FadeIn + staggered FadeInDown
- **Card**: GlassCard with heavy intensity
- **Max width**: 400px for content

### Error State

- **Icon**: Animated pulse effect (1→1.1 scale, 800ms)
- **Color**: Error gradient (red to orange)
- **Background**: Error tint overlay (40% opacity)
- **Animation**: FadeIn entrance
- **Buttons**: Full-width stacked (retry, dismiss)

### Inline Empty State

- **Icon**: 32-48px, 50% opacity
- **Text**: Centered, gray colors
- **Padding**: XL vertical spacing
- **Compact mode**: Reduced padding for tight spaces

## 🚀 Animation Details

### Empty State

```tsx
// Container
entering={FadeIn.duration(600)}

// Icon
entering={FadeInDown.delay(200).duration(600).springify()}

// Text
entering={FadeInDown.delay(300).duration(600).springify()}

// Button
entering={FadeInDown.delay(400).duration(600).springify()}
```

### Error State Icon Pulse

```tsx
const pulse = useSharedValue(1);

pulse.value = withRepeat(
  withSequence(
    withTiming(1.1, { duration: 800 }),
    withTiming(1, { duration: 800 }),
  ),
  -1, // infinite
  false,
);
```

## 💡 Best Practices

### Do's ✅

- Use friendly, encouraging language
- Provide clear action buttons when possible
- Match gradient theme to context
- Animate entrance for smooth UX
- Keep descriptions concise (2-3 lines max)
- Use appropriate icons that match the context

### Don'ts ❌

- Don't blame the user ("You didn't...")
- Don't use technical jargon
- Don't show empty state without context
- Don't overload with multiple actions
- Don't skip animations
- Don't use red for non-error empty states

## 🎯 Custom Illustrations

### Creating Custom Empty States

```tsx
<EmptyState
  illustration={
    <View style={styles.customIllustration}>
      <Ionicons name="planet" size={80} color={theme.colors.neon.cyan} />
      <Ionicons
        name="star"
        size={20}
        color={theme.colors.neon.yellow}
        style={{ position: "absolute", top: 10, right: 20 }}
      />
    </View>
  }
  title="Nothing Here Yet"
  description="This is a custom empty state!"
/>
```

### Tips for Custom Illustrations

- Keep it simple (2-3 icons max)
- Use neon colors for consistency
- Maintain 140×140px size
- Add subtle animations if desired
- Test on both light/dark themes

## 📦 Import & Usage

```tsx
import {
  EmptyState,
  ErrorState,
  InlineEmptyState
} from '@/components';

// Full screen empty
<EmptyState
  icon="musical-notes-outline"
  title="No Music"
  description="Add your first track"
  actionLabel="Browse Music"
  onAction={handleBrowse}
  gradient="party"
/>

// Full screen error
<ErrorState
  type="network"
  onRetry={reconnect}
  onDismiss={goBack}
/>

// Inline empty
<InlineEmptyState
  icon="people-outline"
  title="No users online"
  compact
/>
```

## 🧪 Testing States

Use the example page to preview all variations:

```bash
# Navigate to examples
app/examples/empty-error-states.tsx
```

This page includes:

- 10 pre-configured states
- Interactive state selector
- All gradient themes
- Custom illustration examples
- Error type variations

## 📱 Responsive Behavior

- **Mobile**: Full width cards with max-width constraint
- **Tablet**: Centered with max-width 400px
- **Landscape**: Adjusted padding for better fit
- **Compact variant**: Reduces vertical spacing by 25%

## 🎬 Demo Scenarios

### Example 1: No Devices Flow

```tsx
const [hasDevices, setHasDevices] = useState(false);

{
  !hasDevices ? (
    <EmptyState
      icon="phone-portrait-outline"
      title="Party of One?"
      description="Don't party alone! Invite friends to join your session."
      actionLabel="Share Code"
      onAction={() => shareSessionCode()}
      gradient="electric"
    />
  ) : (
    <DeviceGrid devices={devices} />
  );
}
```

### Example 2: Network Error with Retry

```tsx
const [networkError, setNetworkError] = useState(false);

{
  networkError && (
    <ErrorState
      type="network"
      onRetry={async () => {
        setNetworkError(false);
        await attemptReconnect();
      }}
      onDismiss={() => router.push("/home")}
    />
  );
}
```

### Example 3: Inline Search Results

```tsx
{
  searchResults.length === 0 ? (
    <InlineEmptyState
      icon="search-outline"
      title="No results found"
      description={`No sessions matching "${searchQuery}"`}
      iconColor={theme.colors.neon.purple}
    />
  ) : (
    searchResults.map((result) => <ResultCard key={result.id} {...result} />)
  );
}
```

---

**Status**: ✅ Complete & Production Ready
