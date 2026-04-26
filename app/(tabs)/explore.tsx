import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRecipes } from "../../src/store/recipeStore";
import { colors, typo, space, radius } from "../../src/theme";

const CATS = ["전체", "인기", "쉬운", "한식", "중식", "일식", "양식", "제철"];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes } = useRecipes();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>탐색</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Search */}
        <View style={s.searchCard}>
          <Ionicons name="search" size={18} color={colors.textDisabled} />
          <TextInput style={s.searchInput} placeholder="레시피 검색..." placeholderTextColor={colors.textDisabled} />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {CATS.map((c, i) => (
            <View key={c} style={[s.chip, i === 0 && s.chipActive]}>
              <Text style={[s.chipText, i === 0 && { color: colors.white }]}>{c}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Section */}
        <View style={s.sectionRow}>
          <Text style={[typo.heading3, { color: colors.textPrimary }]}>인기 레시피</Text>
          <View style={s.badge}>
            <Text style={[typo.caption2, { color: colors.accent }]}>총 {recipes.length}개</Text>
          </View>
        </View>

        {/* Cards */}
        {recipes.map((r) => (
          <Pressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} style={s.recipeCard}>
            <LinearGradient
              colors={r.gradientColors as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.recipeImg}
            >
              <Text style={{ fontSize: 32 }}>{r.emoji}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.recipeName}>{r.title}</Text>
              <View style={s.recipeMeta}>
                <Text style={s.recipeMetaText}>{r.cookTimeMinutes}분</Text>
                <View style={s.dot} />
                <Text style={s.recipeMetaText}>{r.servings}인분</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: { backgroundColor: colors.bgPrimary, paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.xl },
  title: { ...typo.screenTitle, color: colors.textPrimary },
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
  chips: { gap: space.md, paddingVertical: space.xs },
  chip: { height: 34, paddingHorizontal: space.xl, borderRadius: radius.full, backgroundColor: colors.bgPrimary, justifyContent: "center" },
  chipActive: { backgroundColor: colors.accent },
  chipText: { ...typo.body2Bold, color: colors.textTertiary },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.md },
  badge: { backgroundColor: colors.accentLight, paddingHorizontal: space.md, paddingVertical: space.xxs, borderRadius: radius.xs },
  recipeCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  recipeImg: { width: 56, height: 56, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  recipeName: { ...typo.body1Bold, color: colors.textPrimary, marginBottom: space.xs },
  recipeMeta: { flexDirection: "row", alignItems: "center", gap: space.sm },
  recipeMetaText: { ...typo.caption1, color: colors.textTertiary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDisabled },
});
