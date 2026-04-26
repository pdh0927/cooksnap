import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "../../src/store/recipeStore";
import { colors, typo, space, radius, size } from "../../src/theme";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import type { Category } from "../../src/types/recipe";

const CATEGORIES: (Category | "전체")[] = [
  "전체", "한식", "중식", "일식", "양식", "디저트", "간편식",
];

export default function MyRecipesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes, loading } = useRecipes();
  const [selected, setSelected] = useState<Category | "전체">("전체");

  const filtered =
    selected === "전체" ? recipes : recipes.filter((r) => r.category === selected);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header - white area */}
      <View style={s.header}>
        <Text style={s.title}>내 레시피</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Greeting card */}
        <View style={s.card}>
          <Text style={s.greetingSub}>저장된 레시피 {recipes.length}개</Text>
          <Text style={s.greetingMain}>
            오늘은 어떤 요리를{"\n"}
            <Text style={{ color: colors.accent }}>만들어</Text> 볼까요?
          </Text>

          {/* Chips inside card */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: space.xxl }}
            contentContainerStyle={{ gap: space.md }}
          >
            {CATEGORIES.map((cat) => {
              const active = selected === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelected(cat)}
                  style={[s.chip, active && s.chipActive]}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Recipe cards */}
        {filtered.map((recipe) => (
          <AnimatedPressable
            key={recipe.id}
            onPress={() => router.push(`/recipe/${recipe.id}`)}
            style={s.recipeCard}
          >
            <LinearGradient
              colors={recipe.gradientColors as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.recipeImg}
            >
              <Text style={{ fontSize: size.thumbEmoji }}>{recipe.emoji}</Text>
            </LinearGradient>
            <View style={s.recipeInfo}>
              <Text style={s.recipeName}>{recipe.title}</Text>
              <View style={s.recipeMeta}>
                <Text style={s.recipeMetaText}>{recipe.cookTimeMinutes}분</Text>
                <View style={s.dot} />
                <Text style={s.recipeMetaText}>{recipe.servings}인분</Text>
                <View style={s.dot} />
                <Text style={s.recipeMetaText}>{recipe.difficulty}</Text>
              </View>
              {recipe.sourceLabel && (
                <Text style={s.recipeSource}>{recipe.sourceLabel}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
          </AnimatedPressable>
        ))}

        {filtered.length === 0 && !loading && (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 44, marginBottom: space.xl }}>📖</Text>
            <Text style={[typo.heading3, { color: colors.textPrimary, marginBottom: space.md }]}>
              레시피가 없어요
            </Text>
            <Text style={[typo.body2, { color: colors.textTertiary, textAlign: "center" }]}>
              + 버튼을 눌러 레시피를 추가해보세요
            </Text>
          </View>
        )}
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
  },
  title: { ...typo.screenTitle, color: colors.textPrimary },
  scroll: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  // Greeting card
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  greetingSub: { ...typo.caption1, color: colors.textTertiary, marginBottom: space.md },
  greetingMain: { ...typo.heading1, color: colors.textPrimary, lineHeight: 30 },
  // Chips
  chip: {
    height: 34,
    paddingHorizontal: space.xl,
    borderRadius: radius.full,
    backgroundColor: colors.bgPage,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { ...typo.body2Bold, color: colors.textTertiary },
  chipTextActive: { color: colors.white },
  // Recipe cards
  recipeCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  recipeImg: {
    width: size.thumb,
    height: size.thumb,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeInfo: { flex: 1 },
  recipeName: { ...typo.body1Bold, color: colors.textPrimary, marginBottom: space.xs },
  recipeMeta: { flexDirection: "row", alignItems: "center", gap: space.sm },
  recipeMetaText: { ...typo.caption1, color: colors.textTertiary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDisabled },
  recipeSource: { ...typo.caption2, color: colors.accent, marginTop: space.xs },
  // Empty
  emptyCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
});
