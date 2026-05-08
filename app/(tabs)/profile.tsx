import { View, Text, Pressable, ScrollView, StyleSheet, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typo, space, radius } from "../../src/theme";
import Constants from "expo-constants";

interface SettingsRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const MENU_ITEMS: SettingsRow[] = [
  { icon: "information-circle-outline", label: "버전 정보", value: APP_VERSION },
  { icon: "document-text-outline", label: "오픈소스 라이선스" },
  { icon: "chatbubble-outline", label: "문의하기" },
  { icon: "star-outline", label: "앱 평가하기" },
  { icon: "shield-checkmark-outline", label: "개인정보 처리방침" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>설정</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* App info card */}
        <View style={s.card}>
          <View style={s.appInfo}>
            <View style={s.appIcon}>
              <Text style={{ fontSize: 32 }}>🍳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typo.heading2, { color: colors.textPrimary }]}>CookSnap</Text>
              <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xxs }]}>
                레시피를 쉽고 정확하게
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer divider */}
        <View style={{ height: space.sm }} />

        {/* Menu items */}
        <View style={s.card}>
          {MENU_ITEMS.map((item, i) => (
            <View key={item.label}>
              <Pressable
                style={({ pressed }) => [s.menuRow, pressed && s.menuRowPressed]}
                onPress={() => {
                  if (item.label === "버전 정보") {
                    Alert.alert(
                      "버전 정보",
                      `CookSnap v${APP_VERSION}\nExpo SDK ${Constants.expoConfig?.sdkVersion ?? "54"}\nReact Native 0.81\nPlatform: ${Platform.OS} ${Platform.Version}`,
                    );
                  } else {
                    Alert.alert("준비 중", "다음 업데이트에서 만나요!");
                  }
                }}
              >
                <Ionicons name={item.icon} size={20} color={colors.textTertiary} />
                <Text style={[typo.body1, { color: colors.textPrimary, flex: 1 }]}>{item.label}</Text>
                {item.value && (
                  <Text style={[typo.body2, { color: colors.textTertiary, marginRight: space.xs }]}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
              </Pressable>
              {i < MENU_ITEMS.length - 1 && <View style={s.menuDivider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  scroll: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
    paddingVertical: space.xl,
    minHeight: 48,
  },
  menuRowPressed: {
    opacity: 0.5,
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginLeft: 20 + space.xl, // icon(20) + gap(xl=16)
  },
});
