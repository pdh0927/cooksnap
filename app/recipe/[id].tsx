import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share, Linking, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRecipes } from "../../src/store/recipeStore";
import { useShoppingList } from "../../src/store/shoppingStore";
import { useFolders } from "../../src/store/folderStore";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import StepText from "../../src/components/StepText";
import { formatAmount } from "../../src/components/formatAmount";
import { colors, typo, space, radius, size } from "../../src/theme";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getRecipe, deleteRecipe, updateRecipe, toggleFavorite } = useRecipes();
  const { addItems } = useShoppingList();
  const { folders, addRecipeToFolder, removeRecipeFromFolder, getFoldersForRecipe } = useFolders();
  const recipe = getRecipe(id);
  const recipeFolders = getFoldersForRecipe(id);

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

  function showFolderPicker() {
    if (folders.length === 0) {
      Alert.alert("폴더 없음", "내 레시피 탭에서 폴더를 먼저 만들어주세요");
      return;
    }
    const inFolderIds = recipeFolders.map((f) => f.id);
    Alert.alert("폴더에 추가/제거", undefined, [
      ...folders.map((f) => ({
        text: `${f.emoji} ${f.name}${inFolderIds.includes(f.id) ? " ✓" : ""}`,
        onPress: () => {
          if (inFolderIds.includes(f.id)) {
            removeRecipeFromFolder(f.id, id);
          } else {
            addRecipeToFolder(f.id, id);
          }
        },
      })),
      { text: "닫기", style: "cancel" as const },
    ]);
  }

  function showMoreMenu() {
    Alert.alert("메뉴", undefined, [
      { text: "✏️ 편집", onPress: () => router.push(`/recipe/edit/${id}`) },
      { text: "📁 폴더에 추가", onPress: showFolderPicker },
      { text: "🗑️ 삭제", style: "destructive", onPress: handleDelete },
      { text: "닫기", style: "cancel" },
    ]);
  }

  function showCategoryPicker() {
    const categories = ["한식", "중식", "일식", "양식", "디저트", "간편식"] as const;
    Alert.alert("카테고리 변경", undefined, [
      ...categories.map((c) => ({
        text: c + (c === recipe?.category ? " ✓" : ""),
        onPress: () => updateRecipe(id, { category: c }),
      })),
      { text: "취소", style: "cancel" as const },
    ]);
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: "center", justifyContent: "center" }}>
        <Text style={[typo.body1, { color: colors.textTertiary }]}>레시피를 찾을 수 없어요</Text>
      </View>
    );
  }

  const servings = recipe.servings * mult;

  const tips = recipe.tips ?? [];
  const warnings = recipe.warnings ?? [];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        {recipe.thumbnailUrl ? (
          <View style={s.hero}>
            <Image source={{ uri: recipe.thumbnailUrl }} style={s.heroImage} resizeMode="cover" />
            <View style={s.heroOverlay} />
            <Pressable onPress={() => router.back()} style={[s.backBtn, { top: insets.top + 8 }]}>
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </Pressable>
            <View style={[s.actionRow, { top: insets.top + 8 }]}>
              <Pressable onPress={() => toggleFavorite(id)} style={s.actionBtn}>
                <Ionicons
                  name={recipe.isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={recipe.isFavorite ? colors.red : colors.white}
                />
              </Pressable>
              <Pressable onPress={handleShare} style={s.actionBtn}>
                <Ionicons name="share-outline" size={18} color={colors.white} />
              </Pressable>
              <Pressable onPress={showMoreMenu} style={s.actionBtn}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.white} />
              </Pressable>
            </View>
          </View>
        ) : (
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
              <Pressable onPress={() => toggleFavorite(id)} style={s.actionBtn}>
                <Ionicons
                  name={recipe.isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={recipe.isFavorite ? colors.red : colors.white}
                />
              </Pressable>
              <Pressable onPress={handleShare} style={s.actionBtn}>
                <Ionicons name="share-outline" size={18} color={colors.white} />
              </Pressable>
              <Pressable onPress={showMoreMenu} style={s.actionBtn}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.white} />
              </Pressable>
            </View>
          </LinearGradient>
        )}

        {/* Info card */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>{recipe.title}</Text>
          {/* Category chip - tappable to change */}
          <Pressable onPress={showCategoryPicker} style={s.categoryChip}>
            <Text style={[typo.caption2, { color: colors.accent }]}>{recipe.category}</Text>
            <Ionicons name="chevron-down" size={12} color={colors.accent} />
          </Pressable>
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
              {(recipe.tags ?? []).map((t) => (
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
                원본 보기{recipe.sourceLabel ? ` (${recipe.sourceLabel})` : ""}
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
                    <Text style={[typo.body1, { color: colors.textPrimary, fontWeight: "400" }]}>{ing.name}</Text>
                    <Text style={[typo.body2Bold, { color: colors.accent }]}>{formatAmount(scaled, ing.unit)}</Text>
                  </View>
                );
              })}

              <Pressable
                onPress={() => {
                  const shoppingItems = recipe.ingredients.map((ing) => ({
                    name: ing.name,
                    amount: ing.scalable ? ing.amount * mult : ing.amount,
                    unit: ing.unit,
                    recipeTitle: recipe.title,
                  }));
                  addItems(shoppingItems);
                  Alert.alert(
                    "장보기 목록에 추가",
                    `${recipe.ingredients.length}개 재료가 장보기 목록에 추가됐어요`,
                    [{ text: "확인", style: "cancel" }]
                  );
                }}
                style={s.shoppingBtn}
              >
                <Ionicons name="cart-outline" size={18} color={colors.textTertiary} />
                <Text style={[typo.body2Bold, { color: colors.textTertiary }]}>장보기 목록에 추가</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: space.xxl, marginTop: space.md }}>
              {recipe.steps.map((step) => (
                <View key={step.order} style={s.stepRow}>
                  <View style={s.stepDot}>
                    <Text style={s.stepDotText}>{step.order}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <StepText instruction={step.instruction} fontSize={15} />
                    {step.timerSeconds != null && (
                      <View style={s.timerTag}>
                        <Ionicons name="time-outline" size={12} color={colors.accent} />
                        <Text style={[typo.caption2, { color: colors.accent, fontWeight: "600" }]}>
                          {formatDuration(step.timerSeconds)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={s.warningsCard}>
            <View style={s.tipsHeader}>
              <Ionicons name="warning-outline" size={18} color={colors.red} />
              <Text style={[typo.heading3, { color: colors.textPrimary }]}>주의사항</Text>
            </View>
            {warnings.map((w, i) => (
              <View key={i} style={s.tipRow}>
                <View style={[s.tipDot, { backgroundColor: colors.red }]} />
                <Text style={[typo.body2, { color: colors.textSecondary, flex: 1 }]}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <View style={s.tipsCard}>
            <View style={s.tipsHeader}>
              <Ionicons name="bulb-outline" size={18} color={colors.yellow} />
              <Text style={[typo.heading3, { color: colors.textPrimary }]}>꿀팁</Text>
            </View>
            {tips.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <View style={s.tipDot} />
                <Text style={[typo.body2, { color: colors.textSecondary, flex: 1 }]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* CTA */}
      <LinearGradient
        colors={[`${colors.bgPage}00`, colors.bgPage]}
        style={[s.ctaWrap, { paddingBottom: insets.bottom + space.lg }]}
      >
        <AnimatedPressable onPress={() => router.push(`/recipe/cook/${id}`)} style={s.ctaBtn}>
          <Ionicons name="play" size={20} color={colors.white} />
          <Text style={[typo.body1Bold, { color: colors.white }]}>요리 시작하기</Text>
        </AnimatedPressable>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  hero: { aspectRatio: 16 / 9, width: "100%" as any, alignItems: "center", justifyContent: "center" },
  heroImage: { width: "100%" as any, height: "100%" as any, position: "absolute" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  backBtn: {
    position: "absolute",
    left: space.gutter,
    width: size.heroBtn,
    height: size.heroBtn,
    borderRadius: size.heroBtn / 2,
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
    width: size.heroBtn,
    height: size.heroBtn,
    borderRadius: size.heroBtn / 2,
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
  statsRow: { flexDirection: "row", gap: space.sm },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
    backgroundColor: colors.bgPage,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    borderRadius: radius.full,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.lg },
  tagChip: {
    backgroundColor: colors.gray100,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  tagChipText: { ...typo.caption2, color: colors.textSecondary, fontWeight: "500" },
  sourceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.accentLight,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.lg,
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
  tabRow: { flexDirection: "row", backgroundColor: colors.bgPage, borderRadius: radius.lg, padding: space.xxs, gap: space.xxs },
  tabBtn: { flex: 1, paddingVertical: space.md, borderRadius: radius.md, alignItems: "center" },
  tabBtnActive: {
    backgroundColor: colors.bgPrimary,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
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
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.xxs,
  },
  stepDotText: { ...typo.caption2, color: colors.white, fontWeight: "700" },
  timerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: colors.accentLight,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
    marginTop: space.md,
  },
  ctaWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.gutter,
    paddingTop: space.x4,
  },
  ctaBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    height: size.ctaHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: colors.accentLight,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginBottom: space.lg,
  },
  warningsCard: {
    backgroundColor: colors.redLight,
    marginHorizontal: space.gutter,
    marginTop: space.cardGap,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  tipsCard: {
    backgroundColor: colors.yellowLight,
    marginHorizontal: space.gutter,
    marginTop: space.cardGap,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.xl,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.lg,
    marginBottom: space.lg,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.yellow,
    marginTop: 7,
  },
  shoppingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    marginTop: space.xxl,
  },
});
