import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typo, space, radius } from "../../src/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>내 정보</Text>
      </View>
      <View style={s.content}>
        <View style={s.card}>
          <View style={s.avatar}>
            <Ionicons name="person" size={28} color={colors.accent} />
          </View>
          <Text style={[typo.heading2, { color: colors.textPrimary, marginBottom: space.sm, textAlign: "center" }]}>
            프로필 설정
          </Text>
          <Text style={[typo.body2, { color: colors.textTertiary, textAlign: "center", lineHeight: 22 }]}>
            추후 업데이트에서 프로필, 설정,{"\n"}구독 관리 기능이 추가될 예정이에요
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: { backgroundColor: colors.bgPrimary, paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.xl },
  content: { padding: space.gutter },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xxl,
  },
});
