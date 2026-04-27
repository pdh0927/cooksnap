import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRecipes } from "../../src/store/recipeStore";
import { colors, typo, space, radius, size } from "../../src/theme";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import type { Recipe } from "../../src/types/recipe";

const TAGS = ["돼지고기", "닭고기", "소고기", "해산물", "두부", "감자", "계란", "김치", "파스타", "아보카도"];

type SearchMode = "search" | "fridge";

interface FridgeMatch {
  recipe: Recipe;
  matchedCount: number;
  totalIngredients: number;
  matchPercent: number;
  missingIngredients: string[];
}

function getMatchColor(percent: number): string {
  if (percent >= 80) return colors.green;
  if (percent >= 50) return colors.orange;
  return colors.gray400;
}

function getMatchBgColor(percent: number): string {
  if (percent >= 80) return "#E8F8ED";
  if (percent >= 50) return "#FEF3E2";
  return colors.gray100;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes } = useRecipes();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mode, setMode] = useState<SearchMode>("search");
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  const [fridgeInput, setFridgeInput] = useState("");

  const filtered = recipes.filter((r) => {
    const q = query.trim().toLowerCase();
    const tag = selectedTag?.toLowerCase();

    // Tag filter: match ingredient names
    if (tag && !q) {
      return r.ingredients.some((ing) => ing.name.toLowerCase().includes(tag));
    }

    // Text search: match title or ingredients
    if (q) {
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchIng = r.ingredients.some((ing) => ing.name.toLowerCase().includes(q));
      return matchTitle || matchIng;
    }

    return false;
  });

  const showResults = query.trim() || selectedTag;

  const addFridgeItem = () => {
    const item = fridgeInput.trim();
    if (item && !fridgeItems.includes(item)) {
      setFridgeItems([...fridgeItems, item]);
    }
    setFridgeInput("");
  };

  const removeFridgeItem = (item: string) => {
    setFridgeItems(fridgeItems.filter((i) => i !== item));
  };

  const fridgeMatches = useMemo((): FridgeMatch[] => {
    if (fridgeItems.length === 0) return [];

    return recipes
      .map((recipe) => {
        const scalableIngredients = recipe.ingredients.filter((i) => i.scalable);
        const totalIngredients = scalableIngredients.length || recipe.ingredients.length;

        const matchedIngredients = recipe.ingredients.filter((ing) =>
          fridgeItems.some((item) => ing.name.toLowerCase().includes(item.toLowerCase()))
        );
        const matchedCount = matchedIngredients.length;
        const matchPercent = totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0;

        const matchedNames = new Set(matchedIngredients.map((i) => i.name));
        const missingIngredients = scalableIngredients
          .filter((i) => !matchedNames.has(i.name))
          .map((i) => i.name);

        return { recipe, matchedCount, totalIngredients, matchPercent, missingIngredients };
      })
      .filter((m) => m.matchPercent > 0)
      .sort((a, b) => b.matchPercent - a.matchPercent);
  }, [fridgeItems, recipes]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>검색</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Mode toggle */}
        <View style={s.modeToggle}>
          <Pressable
            onPress={() => setMode("search")}
            style={[s.modeBtn, mode === "search" && s.modeBtnActive]}
          >
            <Ionicons name="search" size={16} color={mode === "search" ? colors.white : colors.textTertiary} />
            <Text style={[typo.body2Bold, { color: mode === "search" ? colors.white : colors.textTertiary }]}>레시피 검색</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("fridge")}
            style={[s.modeBtn, mode === "fridge" && s.modeBtnActive]}
          >
            <Text style={{ fontSize: 16 }}>🧊</Text>
            <Text style={[typo.body2Bold, { color: mode === "fridge" ? colors.white : colors.textTertiary }]}>냉장고 파먹기</Text>
          </Pressable>
        </View>

        {mode === "search" ? (
          <>
            {/* Search input */}
            <View style={s.searchCard}>
              <Ionicons name="search" size={18} color={colors.textDisabled} />
              <TextInput
                style={s.searchInput}
                placeholder="레시피, 재료로 검색..."
                placeholderTextColor={colors.textDisabled}
                value={query}
                onChangeText={(v) => { setQuery(v); setSelectedTag(null); }}
                returnKeyType="search"
              />
              {(query || selectedTag) && (
                <Pressable onPress={() => { setQuery(""); setSelectedTag(null); }}>
                  <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
                </Pressable>
              )}
            </View>

            {/* Tags */}
            <View style={s.sectionRow}>
              <Text style={[typo.heading3, { color: colors.textPrimary }]}>재료로 찾기</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {TAGS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setSelectedTag(selectedTag === t ? null : t); setQuery(""); }}
                  style={[s.chip, selectedTag === t && s.chipActive]}
                >
                  <Text style={[s.chipText, selectedTag === t && { color: colors.white }]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Results */}
            {showResults ? (
              <>
                <View style={[s.sectionRow, { marginTop: space.xxl }]}>
                  <Text style={[typo.heading3, { color: colors.textPrimary }]}>검색 결과</Text>
                  <View style={s.badge}>
                    <Text style={[typo.caption2, { color: colors.accent }]}>{filtered.length}개</Text>
                  </View>
                </View>

                {filtered.length > 0 ? (
                  filtered.map((r) => (
                    <AnimatedPressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} style={s.resultCard}>
                      <LinearGradient
                        colors={r.gradientColors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.resultImg}
                      >
                        <Text style={{ fontSize: size.thumbEmoji }}>{r.emoji}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>{r.title}</Text>
                        <View style={s.meta}>
                          <Text style={s.metaText}>{r.cookTimeMinutes}분</Text>
                          <View style={s.dot} />
                          <Text style={s.metaText}>{r.servings}인분</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
                    </AnimatedPressable>
                  ))
                ) : (
                  <View style={s.emptyCard}>
                    <Text style={{ fontSize: 36, marginBottom: space.lg }}>🔍</Text>
                    <Text style={[typo.body1Bold, { color: colors.textSecondary }]}>
                      검색 결과가 없어요
                    </Text>
                    <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xs }]}>
                      다른 키워드로 검색해보세요
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={[s.sectionRow, { marginTop: space.xxl }]}>
                  <Text style={[typo.heading3, { color: colors.textPrimary }]}>전체 레시피</Text>
                  <View style={s.badge}>
                    <Text style={[typo.caption2, { color: colors.accent }]}>{recipes.length}개</Text>
                  </View>
                </View>
                {recipes.map((r) => (
                  <AnimatedPressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} style={s.resultCard}>
                    <LinearGradient
                      colors={r.gradientColors as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.resultImg}
                    >
                      <Text style={{ fontSize: size.thumbEmoji }}>{r.emoji}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>{r.title}</Text>
                      <View style={s.meta}>
                        <Text style={s.metaText}>{r.cookTimeMinutes}분</Text>
                        <View style={s.dot} />
                        <Text style={s.metaText}>{r.servings}인분</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
                  </AnimatedPressable>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* Fridge mode */}
            <View style={s.searchCard}>
              <Ionicons name="add-circle-outline" size={18} color={colors.textDisabled} />
              <TextInput
                style={s.searchInput}
                placeholder="보유한 재료를 입력하세요"
                placeholderTextColor={colors.textDisabled}
                value={fridgeInput}
                onChangeText={setFridgeInput}
                onSubmitEditing={addFridgeItem}
                returnKeyType="done"
              />
              {fridgeInput.trim() ? (
                <Pressable onPress={addFridgeItem} style={s.addBtn}>
                  <Text style={[typo.body2Bold, { color: colors.white }]}>추가</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Fridge ingredient chips */}
            {fridgeItems.length > 0 && (
              <View style={s.fridgeChips}>
                {fridgeItems.map((item) => (
                  <View key={item} style={s.fridgeChip}>
                    <Text style={[typo.body2Bold, { color: colors.white }]}>{item}</Text>
                    <Pressable onPress={() => removeFridgeItem(item)} hitSlop={8}>
                      <Ionicons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={() => setFridgeItems([])} style={s.clearAllBtn}>
                  <Text style={[typo.caption2, { color: colors.textTertiary }]}>전체 삭제</Text>
                </Pressable>
              </View>
            )}

            {/* Fridge results */}
            {fridgeItems.length > 0 ? (
              <>
                <View style={[s.sectionRow, { marginTop: space.xxl }]}>
                  <Text style={[typo.heading3, { color: colors.textPrimary }]}>만들 수 있는 레시피</Text>
                  <View style={s.badge}>
                    <Text style={[typo.caption2, { color: colors.accent }]}>{fridgeMatches.length}개</Text>
                  </View>
                </View>

                {fridgeMatches.length > 0 ? (
                  fridgeMatches.map((m) => (
                    <AnimatedPressable key={m.recipe.id} onPress={() => router.push(`/recipe/${m.recipe.id}`)} style={s.resultCard}>
                      <LinearGradient
                        colors={m.recipe.gradientColors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.resultImg}
                      >
                        <Text style={{ fontSize: size.thumbEmoji }}>{m.recipe.emoji}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>{m.recipe.title}</Text>
                        <View style={s.meta}>
                          <Text style={s.metaText}>{m.recipe.cookTimeMinutes}분</Text>
                          <View style={s.dot} />
                          <Text style={s.metaText}>{m.recipe.servings}인분</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.sm }}>
                          <View style={[s.matchBadge, { backgroundColor: getMatchBgColor(m.matchPercent) }]}>
                            <Text style={[typo.caption2, { color: getMatchColor(m.matchPercent) }]}>
                              재료 {m.matchedCount}/{m.totalIngredients} 보유 ({m.matchPercent}%)
                            </Text>
                          </View>
                        </View>
                        {m.missingIngredients.length > 0 && (
                          <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xs }]} numberOfLines={1}>
                            부족: {m.missingIngredients.join(", ")}
                          </Text>
                        )}
                      </View>
                    </AnimatedPressable>
                  ))
                ) : (
                  <View style={s.emptyCard}>
                    <Text style={{ fontSize: 36, marginBottom: space.lg }}>😅</Text>
                    <Text style={[typo.body1Bold, { color: colors.textSecondary }]}>
                      일치하는 레시피가 없어요
                    </Text>
                    <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xs }]}>
                      재료를 더 추가해보세요
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[s.emptyCard, { marginTop: space.xxl }]}>
                <Text style={{ fontSize: 36, marginBottom: space.lg }}>🧊</Text>
                <Text style={[typo.body1Bold, { color: colors.textSecondary }]}>
                  냉장고에 있는 재료를 추가해보세요
                </Text>
                <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xs }]}>
                  보유 재료로 만들 수 있는 레시피를 찾아드려요
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: { backgroundColor: colors.bgPrimary, paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.xl },
  scroll: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.xs,
    gap: space.xs,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingVertical: space.lg,
    borderRadius: radius.xl,
  },
  modeBtnActive: {
    backgroundColor: colors.accent,
  },
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
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  fridgeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    marginTop: space.xs,
  },
  fridgeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  clearAllBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
  },
  matchBadge: {
    paddingHorizontal: space.md,
    paddingVertical: space.xxs,
    borderRadius: radius.full,
  },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.lg },
  badge: { backgroundColor: colors.accentLight, paddingHorizontal: space.md, paddingVertical: space.xxs, borderRadius: radius.xs },
  chips: { gap: space.md, marginTop: space.xs },
  chip: { height: 34, paddingHorizontal: space.xl, borderRadius: radius.full, backgroundColor: colors.bgPrimary, justifyContent: "center" },
  chipActive: { backgroundColor: colors.accent },
  chipText: { ...typo.body2Bold, color: colors.textTertiary },
  resultCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  resultImg: { width: size.thumb, height: size.thumb, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.xs },
  metaText: { ...typo.caption1, color: colors.textTertiary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDisabled },
  emptyCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
});
