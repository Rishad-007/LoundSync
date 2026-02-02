import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 300,
        }}
      >
        {/* Splash Screen */}
        <Stack.Screen
          name="index"
          options={{
            animation: "fade",
          }}
        />

        {/* Main Screens */}
        <Stack.Screen
          name="home"
          options={{
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="create-session"
          options={{
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="guest-room"
          options={{
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="join-session"
          options={{
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen
          name="player-room"
          options={{
            animation: "slide_from_right",
          }}
        />

        {/* Modal Stack */}
        <Stack.Screen
          name="modal/device-list"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            headerShown: false,
          }}
        />

        {/* Tabs (keeping for backward compatibility) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />

        {/* Examples */}
        <Stack.Screen
          name="examples/design-system"
          options={{
            presentation: "card",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
