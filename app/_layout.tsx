import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="recipe/[id]"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="recipe/cook/[id]"
          options={{
            animation: "slide_from_bottom",
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}
