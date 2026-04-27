import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typo, space, radius } from "../../src/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>설정</Text>
      </View>

      <View style={s.content}>
        <View style={s.card}>
          <Text style={[typo.heading3, { color: colors.textPrimary, marginBottom: space.md }]}>
            CookSnap
          </Text>
          <Text style={[typo.body2, { color: colors.textTertiary, marginBottom: space.xxl }]}>
            버전 1.0.0
          </Text>
          <View style={s.divider} />
          <Text style={[typo.body1, { color: colors.textSecondary, marginTop: space.xxl, textAlign: "center", lineHeight: 24 }]}>
            추후 업데이트 예정
          </Text>
        </View>
      </View>
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
  },
  content: { padding: space.gutter, marginTop: space.cardGap },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
    alignItems: "center",
  },
  divider: {
    width: "100%",
    height: 0.5,
    backgroundColor: colors.divider,
  },
});
