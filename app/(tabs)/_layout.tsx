import { Tabs } from "expo-router";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

function AddButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      style={{ alignItems: "center", justifyContent: "center", top: -14 }}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          backgroundColor: colors.orange,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.divider,
          borderTopWidth: 0.5,
          height: 88,
          paddingTop: 8,
          paddingBottom: 30,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "내 레시피",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "탐색",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={24} color={color} />
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
            <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "설정",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
