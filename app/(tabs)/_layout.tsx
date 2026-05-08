import { Tabs } from "expo-router";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, space } from "../../src/theme";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

function AddButton({ style: _style, ref: _ref, ...props }: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityLabel="레시피 추가"
      accessibilityRole="button"
      accessibilityHint="새 레시피를 추가합니다"
      style={{ alignItems: "center", justifyContent: "center", top: -space.lg }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: radius.xl,
          backgroundColor: colors.orange,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.divider,
          borderTopWidth: 0.5,
          height: 84,
          paddingTop: space.sm,
          paddingBottom: space.sectionGap,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: space.xxs,
          letterSpacing: -0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "내 레시피",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "탐색",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: "", tabBarButton: AddButton }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "검색",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "설정",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
