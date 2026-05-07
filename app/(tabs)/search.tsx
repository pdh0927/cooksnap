import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "../../src/store/recipeStore";
import { colors, typo, space, radius, size } from "../../src/theme";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import RecipeThumb from "../../src/components/RecipeThumb";
import type { Recipe } from "../../src/types/recipe";


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
  if (percent >= 80) return colors.greenLight;
  if (percent >= 50) return colors.orangeLight;
  return colors.gray100;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes } = useRecipes();

  const dynamicTags = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const r of recipes) {
      for (const ing of r.ingredients) {
        // Use main ingredient name (remove parenthetical notes)
        const name = ing.name.replace(/\s*\(.*\)/, '').trim();
        if (name.length <= 1 || !ing.scalable) continue; // skip "약간" type
        freq[name] = (freq[name] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name]) => name);
  }, [recipes]);

  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mode, setMode] = useState<SearchMode>("search");
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  const [fridgeInput, setFridgeInput] = useState("");

  const params = useLocalSearchParams<{ q?: string; _ts?: string }>();

  useEffect(() => {
    if (params.q) {
      setMode("search");
      setQuery(params.q);
      setSelectedTag(null);
      setFridgeItems([]);
      setFridgeInput("");
    }
  }, [params.q, params._ts]);

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
        // Use scalable (main) ingredients for both numerator and denominator
        // so non-scalable items like "소금 약간" don't inflate the match count
        const baseIngredients = scalableIngredients.length > 0 ? scalableIngredients : recipe.ingredients;
        const totalIngredients = baseIngredients.length;

        const matchedIngredients = baseIngredients.filter((ing) =>
          fridgeItems.some((item) => ing.name.toLowerCase().includes(item.toLowerCase()))
        );
        const matchedCount = matchedIngredients.length;
        const matchPercent = totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0;

        const matchedNames = new Set(matchedIngredients.map((i) => i.name));
        const missingIngredients = baseIngredients
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Mode toggle */}
        <View style={s.modeToggle}>
          <Pressable
            onPress={() => { setMode("search"); setFridgeItems([]); setFridgeInput(""); }}
            style={[s.modeBtn, mode === "search" && s.modeBtnActive]}
          >
            <Ionicons name="search" size={16} color={mode === "search" ? colors.textPrimary : colors.textTertiary} />
            <Text style={[typo.body2Bold, { color: mode === "search" ? colors.textPrimary : colors.textTertiary }]}>레시피 검색</Text>
          </Pressable>
          <Pressable
            onPress={() => { setMode("fridge"); setQuery(""); setSelectedTag(null); }}
            style={[s.modeBtn, mode === "fridge" && s.modeBtnActive]}
          >
            <Text style={{ fontSize: 16 }}>🧊</Text>
            <Text style={[typo.body2Bold, { color: mode === "fridge" ? colors.textPrimary : colors.textTertiary }]}>냉장고 파먹기</Text>
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
                autoCorrect={false}
                autoCapitalize="none"
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
              {dynamicTags.map((t) => (
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
                  <>
                    {filtered.slice(0, 20).map((r) => (
                      <AnimatedPressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} style={s.resultCard}>
                        <RecipeThumb thumbnailUrl={r.thumbnailUrl} gradientColors={r.gradientColors as [string, string]} emoji={r.emoji} width={size.searchThumbW} height={size.searchThumbH} borderRadius={radius.lg} sourceType={r.sourceType} />
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
                    {filtered.length > 20 && (
                      <View style={s.limitMsg}>
                        <Text style={[typo.caption1, { color: colors.textTertiary, textAlign: "center" }]}>
                          더 많은 결과가 있어요. 검색어를 구체적으로 입력해보세요
                        </Text>
                      </View>
                    )}
                  </>
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
              <View style={[s.emptyCard, { marginTop: space.xxl }]}>
                <Text style={{ fontSize: 36, marginBottom: space.lg }}>🔍</Text>
                <Text style={[typo.body1Bold, { color: colors.textSecondary }]}>
                  레시피를 검색해보세요
                </Text>
                <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xs, textAlign: "center" }]}>
                  요리 이름이나 재료로 검색하거나{"\n"}위 태그를 눌러보세요
                </Text>
              </View>
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
                autoCorrect={false}
                autoCapitalize="none"
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
                  <>
                    {fridgeMatches.slice(0, 20).map((m) => (
                      <AnimatedPressable key={m.recipe.id} onPress={() => router.push(`/recipe/${m.recipe.id}`)} style={s.resultCard}>
                        <RecipeThumb thumbnailUrl={m.recipe.thumbnailUrl} gradientColors={m.recipe.gradientColors as [string, string]} emoji={m.recipe.emoji} width={size.searchThumbW} height={size.searchThumbH} borderRadius={radius.lg} sourceType={m.recipe.sourceType} />
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
                        <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
                      </AnimatedPressable>
                    ))}
                    {fridgeMatches.length > 20 && (
                      <View style={s.limitMsg}>
                        <Text style={[typo.caption1, { color: colors.textTertiary, textAlign: "center" }]}>
                          더 많은 결과가 있어요. 재료를 더 추가해보세요
                        </Text>
                      </View>
                    )}
                  </>
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
  header: { backgroundColor: colors.bgPrimary, paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.xl, borderBottomWidth: 0.5, borderBottomColor: colors.divider },
  scroll: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.bgPage,
    borderRadius: radius.xl,
    padding: space.xxs,
    gap: space.xxs,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingVertical: space.lg,
    borderRadius: radius.lg,
  },
  modeBtnActive: {
    backgroundColor: colors.bgPrimary,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
  badge: { backgroundColor: colors.accentLight, paddingHorizontal: space.md, paddingVertical: space.xxs, borderRadius: radius.full },
  chips: { gap: space.md, marginTop: space.xs },
  chip: { height: 30, paddingHorizontal: space.lg, borderRadius: radius.full, backgroundColor: colors.bgPrimary, justifyContent: "center" },
  chipActive: { backgroundColor: colors.accent },
  chipText: { ...typo.caption1, color: colors.textTertiary, fontWeight: "600" as const },
  resultCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.xs },
  metaText: { ...typo.caption1, color: colors.textTertiary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDisabled },
  limitMsg: { paddingVertical: space.xl, paddingHorizontal: space.lg },
  emptyCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
});
