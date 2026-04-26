import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typo, space, radius } from "../../src/theme";

const TAGS = ["돼지고기", "닭고기", "소고기", "해산물", "두부", "감자", "계란"];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>검색</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Search */}
        <View style={s.searchCard}>
          <Ionicons name="search" size={18} color={colors.textDisabled} />
          <TextInput style={s.searchInput} placeholder="레시피, 재료로 검색..." placeholderTextColor={colors.textDisabled} />
        </View>

        {/* Tags */}
        <View style={s.sectionRow}>
          <Text style={[typo.heading3, { color: colors.textPrimary }]}>재료로 찾기</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {TAGS.map((t) => (
            <View key={t} style={s.chip}><Text style={s.chipText}>{t}</Text></View>
          ))}
        </ScrollView>

        {/* Recent */}
        <View style={s.sectionRow}>
          <Text style={[typo.heading3, { color: colors.textPrimary }]}>최근 검색</Text>
        </View>
        <View style={s.recentCard}>
          {["김치찌개", "파스타"].map((term, i, arr) => (
            <View key={term}>
              <Pressable style={s.recentRow}>
                <View style={s.recentLeft}>
                  <Ionicons name="time-outline" size={16} color={colors.textDisabled} />
                  <Text style={[typo.body1, { color: colors.textSecondary }]}>{term}</Text>
                </View>
                <Ionicons name="close" size={16} color={colors.textDisabled} />
              </Pressable>
              {i < arr.length - 1 && <View style={s.rowDivider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: { backgroundColor: colors.bgPrimary, paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.xl },
  scroll: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  searchCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    paddingHorizontal: space.xxl,
    paddingVertical: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  searchInput: { flex: 1, ...typo.body2, color: colors.textPrimary },
  sectionRow: { marginTop: space.lg },
  chips: { gap: space.md, marginTop: space.xs },
  chip: { height: 34, paddingHorizontal: space.xl, borderRadius: radius.full, backgroundColor: colors.bgPrimary, justifyContent: "center" },
  chipText: { ...typo.body2Bold, color: colors.textTertiary },
  recentCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
    marginTop: space.xs,
  },
  recentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: space.sm },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: space.lg },
  rowDivider: { height: 0.5, backgroundColor: colors.divider, marginVertical: space.lg },
});
