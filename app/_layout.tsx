import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, Pressable } from "react-native";

/* ------------------------------------------------------------------ */
/*  Error Boundary — catches JS throws so the whole app doesn't crash */
/* ------------------------------------------------------------------ */
interface EBState { hasError: boolean }

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#F4F5F7", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>😵</Text>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#191F28", marginBottom: 8, textAlign: "center" }}>
            문제가 발생했어요
          </Text>
          <Text style={{ fontSize: 14, color: "#8B95A1", textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            일시적인 오류가 발생했습니다.{"\n"}아래 버튼을 눌러 다시 시도해주세요.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            style={{
              backgroundColor: "#3182F6",
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>다시 시도</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
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
        <Stack.Screen
          name="recipe/create/index"
          options={{
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="recipe/edit/[id]"
          options={{
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </AppErrorBoundary>
  );
}
