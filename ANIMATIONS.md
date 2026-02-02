# LOUDSYNC Animation System

Complete animation implementation guide for LOUDSYNC using React Native Reanimated and Lottie.

## 📦 Installed Packages

```json
{
  "react-native-reanimated": "~4.1.1",
  "lottie-react-native": "^7.3.5"
}
```

## 🎨 Animation Categories

### 1. Button Press Ripple

**Implementation**: GradientButton.tsx, IconButton.tsx

```tsx
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const scale = useSharedValue(1);
const rippleScale = useSharedValue(0);
const rippleOpacity = useSharedValue(0);

const handlePressIn = () => {
  scale.value = withSpring(0.95);
  rippleScale.value = withTiming(1, { duration: 600 });
  rippleOpacity.value = withSequence(
    withTiming(0.5, { duration: 0 }),
    withTiming(0, { duration: 600 }),
  );
};

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

**Features**:

- Scale down to 95% on press
- Ripple expands from center
- Haptic feedback on press
- Continuous neon glow pulse

### 2. Screen Transitions

**Implementation**: create-session.tsx, join-session.tsx, player-room.tsx

```tsx
import Animated, {
  FadeInUp,
  FadeInDown,
  SlideInLeft,
  Layout
} from 'react-native-reanimated';

// Staggered card entrance
<AnimatedGlassCard
  entering={FadeInUp.delay(100).duration(600).springify()}
  layout={Layout.springify()}
/>

// Header slide down
<Animated.View
  entering={FadeInDown.duration(600).springify()}
/>

// Side slide with stagger
<AnimatedGlassCard
  entering={SlideInLeft.delay(200).duration(600).springify()}
/>
```

**Timing**:

- Header: 0ms delay
- First card: 100ms delay
- Subsequent cards: +100ms increments
- Duration: 600ms with spring physics

### 3. Waveform Animation

**Implementation**: player-room.tsx

```tsx
// 20 individual waveform bars
const waveAnims = Array.from({ length: 20 }, () => useSharedValue(0.3));

useEffect(() => {
  if (isPlaying) {
    waveAnims.forEach((anim) => {
      anim.value = withRepeat(
        withSequence(
          withTiming(Math.random() * 0.8 + 0.4, {
            duration: 300 + Math.random() * 200,
          }),
          withTiming(Math.random() * 0.5 + 0.2, {
            duration: 300 + Math.random() * 200,
          }),
        ),
        -1,
        false,
      );
    });
  }
}, [isPlaying]);

// Render
{
  waveAnims.map((anim, index) => {
    const waveStyle = useAnimatedStyle(() => ({
      transform: [{ scaleY: anim.value }],
    }));

    return <Animated.View key={index} style={[styles.waveBar, waveStyle]} />;
  });
}
```

**Characteristics**:

- 20 bars with independent animation
- Random height: 20%-100%
- Random duration: 300-500ms
- Continuous loop when playing
- Smooth return to rest state

### 4. Neon Glow Pulse

**Implementation**: All pages (background effects, badges)

```tsx
const glowPulse = useSharedValue(0);

useEffect(() => {
  glowPulse.value = withRepeat(
    withSequence(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
    ),
    -1,
    false,
  );
}, []);

const glowStyle = useAnimatedStyle(() => ({
  opacity: interpolate(glowPulse.value, [0, 1], [0.5, 1]),
  transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.02]) }],
}));
```

**Usage**:

- Button glow backgrounds
- Neon badge pulses
- "NOW PLAYING" indicator
- Party color effects (top/bottom gradients)

### 5. Card Hover/Press Effects

**Implementation**: GlassCard.tsx

```tsx
const scale = useSharedValue(1);
const glowOpacity = useSharedValue(0);

const handlePressIn = () => {
  if (pressable) {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0.4, { duration: 200 });
  }
};

const handlePressOut = () => {
  if (pressable) {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  }
};
```

**Features**:

- 98% scale on press
- White glow overlay (40% opacity)
- Spring physics for natural feel
- Disabled when `pressable={false}`

## 🎭 Microinteraction Logic

### Session Code Input

```tsx
// Format as XXX-XXX while typing
const formatSessionCode = (text: string) => {
  const cleaned = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
};
```

### Radar Scanner

```tsx
// Rotating scan line + pulse circles
const radarRotation = useSharedValue(0);
const pulseAnim = useSharedValue(0);

radarRotation.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);

const radarRotate = radarRotation.interpolate({
  inputRange: [0, 1],
  outputRange: ["0deg", "360deg"],
});
```

### Device Kick Animation

```tsx
const handleKickDevice = (deviceId: string) => {
  const index = devices.findIndex((d) => d.id === deviceId);

  // Slide out + fade
  Animated.parallel([
    Animated.timing(slideAnims[index], {
      toValue: 100,
      duration: 300,
    }),
    Animated.timing(fadeAnims[index], {
      toValue: 0,
      duration: 300,
    }),
  ]).start(() => {
    // Remove from array after animation
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  });
};
```

## 📱 Page-by-Page Implementation

### app/index.tsx (Splash)

- ✅ Fade in + scale logo
- ✅ Rotating gradient ring
- ✅ Continuous pulse

### app/home.tsx

- ✅ Floating party icons (5 icons)
- ✅ Different speeds (6s-9s)
- ✅ Glow pulse on cards

### app/create-session.tsx

- ✅ Header: FadeInDown
- ✅ Session Details: FadeInUp (100ms)
- ✅ Music Source: FadeInUp (200ms)
- ✅ Song Preview: ZoomIn (animated on upload)
- ✅ Settings: FadeInUp (300ms)
- ✅ Info Card: SlideInRight (400ms)
- ✅ Button: FadeInUp (500ms)

### app/join-session.tsx

- ✅ Header: FadeInDown
- ✅ Radar: FadeIn (200ms)
- ✅ Nearby Sessions: FadeInUp (100ms delay), cards staggered 100ms each
- ✅ Manual Code: FadeInUp (200ms)
- ✅ Recent: FadeInUp (300ms)
- ✅ Info: FadeInUp (400ms)
- ✅ Button: FadeInUp (500ms)

### app/player-room.tsx

- ✅ Party effects: Continuous pulse
- ✅ Header: FadeIn
- ✅ Info card: FadeInUp (100ms)
- ✅ Player card: FadeInUp (200ms)
- ✅ Waveform: 20 animated bars
- ✅ Actions: FadeInUp (300ms)
- ✅ Device Grid: FadeInUp (400ms)

### app/modal/device-list.tsx

- ✅ Device cards: Slide in (staggered 100ms)
- ✅ Volume sliders: Per-device control
- ✅ Kick animation: Slide out + fade

## 🎨 Lottie Integration Example

### 1. Add Lottie Animation

```tsx
import LottieView from "lottie-react-native";

// Auto-playing loading animation
<LottieView
  source={require("../assets/lottie/loading.json")}
  autoPlay
  loop
  style={{ width: 100, height: 100 }}
/>;

// Controlled animation
const animationRef = useRef<LottieView>(null);

useEffect(() => {
  animationRef.current?.play();
}, []);

<LottieView
  ref={animationRef}
  source={require("../assets/lottie/success.json")}
  loop={false}
  style={{ width: 200, height: 200 }}
/>;
```

### 2. Recommended Lottie Animations

Download from LottieFiles:

- **loading.json**: Circular loading spinner with neon glow
- **success.json**: Checkmark animation for successful actions
- **sync.json**: Connecting dots for device synchronization
- **waveform.json**: Alternative waveform visualization
- **party.json**: Confetti/celebration for session start

### 3. Trigger Lottie on Events

```tsx
const [showSuccess, setShowSuccess] = useState(false);

const handleJoinSession = () => {
  setShowSuccess(true);
  setTimeout(() => {
    router.push("/player-room");
  }, 1500);
};

{
  showSuccess && (
    <LottieView
      source={require("../assets/lottie/success.json")}
      autoPlay
      loop={false}
      style={styles.successAnimation}
    />
  );
}
```

## ⚡ Performance Tips

1. **useNativeDriver**: Always set to `true` when possible
2. **Worklets**: Use `'worklet'` directive for shared value computations
3. **Memoization**: Wrap animated styles in `useAnimatedStyle`
4. **Cleanup**: Clear animations in `useEffect` cleanup
5. **Reduce Complexity**: Limit simultaneous animations to 20-30

## 🎯 Animation Timing Reference

| Element          | Delay          | Duration    | Easing               |
| ---------------- | -------------- | ----------- | -------------------- |
| Header           | 0ms            | 600ms       | Spring               |
| First Card       | 100ms          | 600ms       | Spring               |
| Subsequent Cards | +100ms each    | 600ms       | Spring               |
| Button Press     | 0ms            | 150ms       | Spring (damping: 15) |
| Ripple           | 0ms            | 600ms       | Timing               |
| Glow Pulse       | 0ms            | 1500ms loop | Ease In-Out          |
| Waveform         | 0-50ms stagger | 300-500ms   | Ease In-Out          |

## 📦 Animation Presets

Import from `src/animations/presets.ts`:

```tsx
import { neonGlowPulse, buttonPress, cardPress } from "@/animations/presets";

// Use preset
const glow = useSharedValue(0);
glow.value = neonGlowPulse(2000);
```

## 🚀 Next Steps

1. Add Lottie success animation to session creation
2. Implement haptic feedback on all button presses (already in IconButton)
3. Add confetti animation when sync reaches 100%
4. Create custom loading animation for joining sessions
5. Add particle effects behind waveform

---

**Implementation Status**: ✅ Complete

- All pages have entrance animations
- Button ripple effects implemented
- Waveform fully animated
- Neon glow pulses active
- Card press interactions working
- Lottie package installed and ready
