import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRecipes } from "../../src/store/recipeStore";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import { formatAmount } from "../../src/components/formatAmount";
import { colors, typo, space, radius, size } from "../../src/theme";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getRecipe, deleteRecipe } = useRecipes();
  const recipe = getRecipe(id);

  function handleDelete() {
    Alert.alert("레시피 삭제", `"${recipe?.title}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await deleteRecipe(id);
          router.back();
        },
      },
    ]);
  }

  async function handleShare() {
    if (!recipe) return;
    const ingredients = recipe.ingredients
      .map((i) => `- ${i.name} ${formatAmount(i.amount, i.unit)}`)
      .join("\n");
    const steps = recipe.steps
      .map((s) => `${s.order}. ${s.instruction}`)
      .join("\n");
    await Share.share({
      message: `${recipe.emoji} ${recipe.title}\n\n[재료]\n${ingredients}\n\n[조리 순서]\n${steps}`,
    });
  }

  const [tab, setTab] = useState<"ing" | "steps">("ing");
  const [mult, setMult] = useState(1);

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: "center", justifyContent: "center" }}>
        <Text style={[typo.body1, { color: colors.textTertiary }]}>레시피를 찾을 수 없어요</Text>
      </View>
    );
  }

  const servings = recipe.servings * mult;

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={recipe.gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <Text style={{ fontSize: size.heroEmoji }}>{recipe.emoji}</Text>
          <Pressable onPress={() => router.back()} style={[s.backBtn, { top: insets.top + 8 }]}>
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <View style={[s.actionRow, { top: insets.top + 8 }]}>
            <Pressable onPress={handleShare} style={s.actionBtn}>
              <Ionicons name="share-outline" size={18} color={colors.white} />
            </Pressable>
            <Pressable onPress={handleDelete} style={s.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.white} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Info card */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>{recipe.title}</Text>
          <View style={s.statsRow}>
            {[
              { icon: "time-outline" as const, t: `${recipe.cookTimeMinutes}분` },
              { icon: "people-outline" as const, t: `${recipe.servings}인분` },
              { icon: "bar-chart-outline" as const, t: recipe.difficulty },
            ].map((item) => (
              <View key={item.icon} style={s.statChip}>
                <Ionicons name={item.icon} size={14} color={colors.textTertiary} />
                <Text style={[typo.caption1, { color: colors.textTertiary }]}>{item.t}</Text>
              </View>
            ))}
          </View>
          {(recipe.tags ?? []).length > 0 && (
            <View style={s.tagsRow}>
              {recipe.tags.map((t) => (
                <View key={t} style={s.tagChip}>
                  <Text style={s.tagChipText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}
          {recipe.sourceUrl && (
            <Pressable onPress={() => Linking.openURL(recipe.sourceUrl!)} style={s.sourceBtn}>
              <Ionicons name="open-outline" size={14} color={colors.accent} />
              <Text style={[typo.caption1, { color: colors.accent, fontWeight: "600" }]}>
                원본 보기 ({recipe.sourceLabel})
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View style={s.tabsCard}>
          <View style={s.tabRow}>
            {(["ing", "steps"] as const).map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={[s.tabBtn, tab === t && s.tabBtnActive]}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === "ing" ? "재료" : "조리 순서"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "ing" ? (
            <View>
              {/* Serving adjuster */}
              <View style={s.servRow}>
                <Pressable
                  onPress={() => mult > 0.5 && setMult((m) => m - 0.5)}
                  style={s.servBtn}
                >
                  <Ionicons name="remove" size={18} color={colors.textSecondary} />
                </Pressable>
                <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>{servings}인분</Text>
                <Pressable
                  onPress={() => mult < 5 && setMult((m) => m + 0.5)}
                  style={s.servBtn}
                >
                  <Ionicons name="add" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              {recipe.ingredients.map((ing, i) => {
                const scaled = ing.scalable ? ing.amount * mult : ing.amount;
                return (
                  <View key={i} style={[s.ingRow, i === recipe.ingredients.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[typo.body1, { color: colors.textPrimary }]}>{ing.name}</Text>
                    <Text style={[typo.body2Bold, { color: colors.textTertiary }]}>{formatAmount(scaled, ing.unit)}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ gap: space.xxl, marginTop: space.md }}>
              {recipe.steps.map((step) => (
                <View key={step.order} style={s.stepRow}>
                  <View style={s.stepDot}>
                    <Text style={s.stepDotText}>{step.order}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typo.body1, { color: colors.textPrimary, lineHeight: 24 }]}>
                      {step.instruction}
                    </Text>
                    {step.timerSeconds != null && (
                      <View style={s.timerTag}>
                        <Ionicons name="time-outline" size={12} color={colors.accent} />
                        <Text style={[typo.caption2, { color: colors.accent, fontWeight: "600" }]}>
                          {Math.floor(step.timerSeconds / 60)}분
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA */}
      <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
        <AnimatedPressable onPress={() => router.push(`/recipe/cook/${id}`)} style={s.ctaBtn}>
          <Ionicons name="play" size={20} color={colors.white} />
          <Text style={[typo.body1Bold, { color: colors.white }]}>요리 시작하기</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  hero: { height: 240, alignItems: "center", justifyContent: "center" },
  backBtn: {
    position: "absolute",
    left: space.gutter,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    position: "absolute",
    right: space.gutter,
    flexDirection: "row",
    gap: space.md,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: colors.bgPrimary,
    marginHorizontal: space.gutter,
    marginTop: -space.xxl,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  infoTitle: { ...typo.heading1, color: colors.textPrimary, marginBottom: space.lg },
  statsRow: { flexDirection: "row", gap: space.md },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: colors.bgPage,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.xl },
  tagChip: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    borderRadius: radius.full,
  },
  tagChipText: { ...typo.caption2, color: colors.accent, fontWeight: "600" },
  sourceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.accentLight,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignSelf: "flex-start",
    marginTop: space.xl,
  },
  tabsCard: {
    backgroundColor: colors.bgPrimary,
    marginHorizontal: space.gutter,
    marginTop: space.cardGap,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  tabRow: { flexDirection: "row", backgroundColor: colors.bgPage, borderRadius: radius.md, padding: space.xs },
  tabBtn: { flex: 1, paddingVertical: space.lg, borderRadius: radius.sm, alignItems: "center" },
  tabBtnActive: { backgroundColor: colors.bgPrimary },
  tabText: { ...typo.body2Bold, color: colors.textTertiary },
  tabTextActive: { color: colors.textPrimary },
  servRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xxl,
    paddingVertical: space.xxl,
  },
  servBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgPage,
    alignItems: "center",
    justifyContent: "center",
  },
  ingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  stepRow: { flexDirection: "row", gap: space.lg },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray900,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepDotText: { ...typo.caption2, color: colors.white, fontWeight: "700" },
  timerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: colors.accentLight,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.xs,
    alignSelf: "flex-start",
    marginTop: space.md,
  },
  ctaWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    backgroundColor: colors.bgPage,
  },
  ctaBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
  },
});
