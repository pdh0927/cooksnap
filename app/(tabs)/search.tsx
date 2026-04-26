import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRecipes } from "../../src/store/recipeStore";
import { colors, typo, space, radius, size } from "../../src/theme";
import AnimatedPressable from "../../src/components/AnimatedPressable";

const TAGS = ["돼지고기", "닭고기", "소고기", "해산물", "두부", "감자", "계란", "김치", "파스타", "아보카도"];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes } = useRecipes();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>검색</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
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
