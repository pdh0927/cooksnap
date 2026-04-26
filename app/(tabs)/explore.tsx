import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRecipes } from "../../src/store/recipeStore";
import { colors, typo, space, radius } from "../../src/theme";
import type { Category } from "../../src/types/recipe";

const CATS: { label: string; filter: string | null }[] = [
  { label: "전체", filter: null },
  { label: "한식", filter: "한식" },
  { label: "중식", filter: "중식" },
  { label: "일식", filter: "일식" },
  { label: "양식", filter: "양식" },
  { label: "디저트", filter: "디저트" },
  { label: "간편식", filter: "간편식" },
  { label: "쉬운", filter: "__easy" },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes } = useRecipes();
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = selected === null
    ? recipes
    : selected === "__easy"
    ? recipes.filter((r) => r.difficulty === "쉬움")
    : recipes.filter((r) => r.category === selected);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>탐색</Text>
        <Text style={s.subtitle}>다른 사람들의 레시피를 구경해보세요</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Search */}
        <Pressable style={s.searchCard} onPress={() => router.push("/(tabs)/search")}>
          <Ionicons name="search" size={18} color={colors.textDisabled} />
          <Text style={[typo.body2, { color: colors.textDisabled }]}>레시피 검색...</Text>
        </Pressable>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {CATS.map((c) => {
            const active = selected === c.filter;
            return (
              <Pressable
                key={c.label}
                onPress={() => setSelected(active ? null : c.filter)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && { color: colors.white }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section */}
        <View style={s.sectionRow}>
          <Text style={[typo.heading3, { color: colors.textPrimary }]}>
            {selected === null ? "전체 레시피" : selected === "__easy" ? "쉬운 레시피" : `${selected} 레시피`}
          </Text>
          <View style={s.badge}>
            <Text style={[typo.caption2, { color: colors.accent }]}>총 {filtered.length}개</Text>
          </View>
        </View>

        {/* Cards */}
        {filtered.length > 0 ? (
          filtered.map((r) => (
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
                  <View style={s.dot} />
                  <Text style={s.recipeMetaText}>{r.difficulty}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
            </Pressable>
          ))
        ) : (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: space.lg }}>📭</Text>
            <Text style={[typo.body1Bold, { color: colors.textSecondary }]}>레시피가 없어요</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: { backgroundColor: colors.bgPrimary, paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.xxl },
  title: { ...typo.screenTitle, color: colors.textPrimary },
  subtitle: { ...typo.caption1, color: colors.textTertiary, marginTop: space.xs },
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
  emptyCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
});
