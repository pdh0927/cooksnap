import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share, Linking, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
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

  const deletingRef = useRef(false);

  function handleDelete() {
    Alert.alert("레시피 삭제", `"${recipe?.title}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (deletingRef.current) return;
          deletingRef.current = true;
          try {
            await deleteRecipe(id);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/");
            }
          } catch {
            Alert.alert("삭제 실패", "네트워크를 확인하고 다시 시도해주세요.");
          } finally {
            deletingRef.current = false;
          }
        },
      },
    ]);
  }

  async function handleShare() {
    if (!recipe) return;
    try {
      const ingredients = recipe.ingredients
        .map((i) => `- ${i.name} ${formatAmount(i.amount, i.unit)}`)
        .join("\n");
      const stepLines = recipe.steps
        .map((st) => `${st.order}. ${st.instruction}`)
        .join("\n");
      await Share.share({
        message: `${recipe.emoji} ${recipe.title}\n\n[재료]\n${ingredients}\n\n[조리 순서]\n${stepLines}`,
      });
    } catch {
      // Share cancelled or failed — no action needed
    }
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
          const op = inFolderIds.includes(f.id)
            ? removeRecipeFromFolder(f.id, id)
            : addRecipeToFolder(f.id, id);
          op.catch(() => {
            Alert.alert("실패", "폴더 작업에 실패했습니다. 네트워크를 확인해주세요.");
          });
        },
      })),
      { text: "닫기", style: "cancel" as const },
    ]);
  }

  function showMoreMenu() {
    Alert.alert("메뉴", undefined, [
      { text: "편집", onPress: () => router.push(`/recipe/edit/${id}`) },
      { text: "폴더에 추가", onPress: showFolderPicker },
      { text: "삭제", style: "destructive", onPress: handleDelete },
      { text: "닫기", style: "cancel" },
    ]);
  }

  function showCategoryPicker() {
    const categories = ["한식", "중식", "일식", "양식", "디저트", "간편식"] as const;
    Alert.alert("카테고리 변경", undefined, [
      ...categories.map((c) => ({
        text: c + (c === recipe?.category ? " ✓" : ""),
        onPress: () => {
          updateRecipe(id, { category: c }).catch(() => {
            Alert.alert("변경 실패", "네트워크를 확인하고 다시 시도해주세요.");
          });
        },
      })),
      { text: "취소", style: "cancel" as const },
    ]);
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: "center", justifyContent: "center", paddingHorizontal: space.x4, paddingTop: insets.top }}>
        <Text style={{ fontSize: 48, marginBottom: space.xxl }}>🍳</Text>
        <Text style={[typo.heading2, { color: colors.textPrimary, marginBottom: space.md }]}>레시피를 찾을 수 없어요</Text>
        <Text style={[typo.body2, { color: colors.textTertiary, textAlign: "center", marginBottom: space.xxl }]}>
          삭제되었거나 존재하지 않는 레시피예요
        </Text>
        <AnimatedPressable
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/")}
          style={{
            backgroundColor: colors.accent,
            borderRadius: radius.lg,
            paddingHorizontal: space.xxl,
            paddingVertical: space.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
          }}
        >
          <Ionicons name="chevron-back" size={16} color={colors.white} />
          <Text style={[typo.body2Bold, { color: colors.white }]}>돌아가기</Text>
        </AnimatedPressable>
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
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/")} style={[s.backBtn, { top: insets.top + 8 }]} accessibilityLabel="뒤로 가기" accessibilityRole="button">
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </Pressable>
            <View style={[s.actionRow, { top: insets.top + 8 }]}>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(id).catch(() => {}); }} style={s.actionBtn} accessibilityLabel={recipe.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"} accessibilityRole="button">
                <Ionicons
                  name={recipe.isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={recipe.isFavorite ? colors.red : colors.white}
                />
              </Pressable>
              <Pressable onPress={handleShare} style={s.actionBtn} accessibilityLabel="공유하기" accessibilityRole="button">
                <Ionicons name="share-outline" size={18} color={colors.white} />
              </Pressable>
              <Pressable onPress={showMoreMenu} style={s.actionBtn} accessibilityLabel="더보기 메뉴" accessibilityRole="button">
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
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/")} style={[s.backBtn, { top: insets.top + 8 }]} accessibilityLabel="뒤로 가기" accessibilityRole="button">
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </Pressable>
            <View style={[s.actionRow, { top: insets.top + 8 }]}>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(id).catch(() => {}); }} style={s.actionBtn} accessibilityLabel={recipe.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"} accessibilityRole="button">
                <Ionicons
                  name={recipe.isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={recipe.isFavorite ? colors.red : colors.white}
                />
              </Pressable>
              <Pressable onPress={handleShare} style={s.actionBtn} accessibilityLabel="공유하기" accessibilityRole="button">
                <Ionicons name="share-outline" size={18} color={colors.white} />
              </Pressable>
              <Pressable onPress={showMoreMenu} style={s.actionBtn} accessibilityLabel="더보기 메뉴" accessibilityRole="button">
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.white} />
              </Pressable>
            </View>
          </LinearGradient>
        )}

        {/* Info card */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>{recipe.title}</Text>
          {/* Category chip - tappable to change */}
          <Pressable onPress={showCategoryPicker} style={s.categoryChip} hitSlop={4}>
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
          {(recipe.tags ?? []).length > 0 ? (
            <View style={s.tagsRow}>
              {(recipe.tags ?? []).map((t) => (
                <View key={t} style={s.tagChip}>
                  <Text style={s.tagChipText}>#{t}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Pressable onPress={() => router.push(`/recipe/edit/${id}`)} style={s.tagsRow} hitSlop={4}>
              <Text style={[typo.caption1, { color: colors.textTertiary }]}>태그를 추가하려면 편집하세요</Text>
            </Pressable>
          )}
          {recipe.sourceUrl && (
            <Pressable onPress={() => Linking.openURL(recipe.sourceUrl!)} style={s.sourceBtn} hitSlop={4}>
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
              <Pressable key={t} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }} style={[s.tabBtn, tab === t && s.tabBtnActive]}>
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
                  onPress={() => { if (mult > 0.5) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMult((m) => m - 0.5); } }}
                  disabled={mult <= 0.5}
                  style={[s.servBtn, mult <= 0.5 && { opacity: 0.3 }]}
                  accessibilityLabel="인분 줄이기"
                  accessibilityRole="button"
                  hitSlop={4}
                >
                  <Ionicons name="remove" size={18} color={colors.textSecondary} />
                </Pressable>
                <Text style={[typo.body1Bold, { color: colors.textPrimary }]} accessibilityLabel={`${servings}인분`}>{servings}인분</Text>
                <Pressable
                  onPress={() => { if (mult < 5) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMult((m) => m + 0.5); } }}
                  disabled={mult >= 5}
                  style={[s.servBtn, mult >= 5 && { opacity: 0.3 }]}
                  accessibilityLabel="인분 늘리기"
                  accessibilityRole="button"
                  hitSlop={4}
                >
                  <Ionicons name="add" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              {recipe.ingredients.length === 0 ? (
                <View style={{ paddingVertical: space.x4, alignItems: "center" }}>
                  <Text style={[typo.body2, { color: colors.textTertiary }]}>등록된 재료가 없어요</Text>
                </View>
              ) : (
                recipe.ingredients.map((ing, i) => {
                  const scaled = ing.scalable ? ing.amount * mult : ing.amount;
                  return (
                    <View key={i} style={[s.ingRow, i === recipe.ingredients.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[typo.body1, { color: colors.textPrimary, fontWeight: "400" }]}>{ing.name}</Text>
                      <Text style={[typo.body2Bold, { color: colors.accent }]}>{formatAmount(scaled, ing.unit)}</Text>
                    </View>
                  );
                })
              )}

              <Pressable
                onPress={() => {
                  if (recipe.ingredients.length === 0) {
                    Alert.alert("알림", "추가할 재료가 없어요");
                    return;
                  }
                  const shoppingItems = recipe.ingredients.map((ing) => ({
                    name: ing.name,
                    amount: ing.scalable ? ing.amount * mult : ing.amount,
                    unit: ing.unit,
                    recipeTitle: recipe.title,
                  }));
                  addItems(shoppingItems)
                    .then(() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert(
                        "장보기 목록에 추가",
                        `${recipe.ingredients.length}개 재료가 장보기 목록에 추가됐어요`,
                        [{ text: "확인", style: "cancel" }]
                      );
                    })
                    .catch(() => {
                      Alert.alert("추가 실패", "네트워크를 확인하고 다시 시도해주세요.");
                    });
                }}
                style={s.shoppingBtn}
              >
                <Ionicons name="cart-outline" size={18} color={colors.textTertiary} />
                <Text style={[typo.body2Bold, { color: colors.textTertiary }]}>장보기 목록에 추가</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: space.xxl, marginTop: space.md }}>
              {recipe.steps.length === 0 && (
                <View style={{ paddingVertical: space.x4, alignItems: "center" }}>
                  <Text style={[typo.body2, { color: colors.textTertiary }]}>등록된 조리 순서가 없어요</Text>
                </View>
              )}
              {recipe.steps.map((step) => (
                <View key={step.order} style={s.stepRow}>
                  <View style={s.stepDot}>
                    <Text style={s.stepDotText}>{step.order}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.stepInstruction}>{step.instruction}</Text>
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

        {/* Warnings + Tips — compact inline style */}
        {(warnings.length > 0 || tips.length > 0) && (
          <View style={s.hintsCard}>
            {warnings.map((w, i) => (
              <View key={`w${i}`} style={s.hintRow}>
                <Ionicons name="warning-outline" size={14} color={colors.red} />
                <Text style={[typo.caption1, { color: colors.textSecondary, flex: 1 }]}>{w}</Text>
              </View>
            ))}
            {tips.map((tip, i) => (
              <View key={`t${i}`} style={s.hintRow}>
                <Ionicons name="bulb-outline" size={14} color={colors.yellow} />
                <Text style={[typo.caption1, { color: colors.textSecondary, flex: 1 }]}>{tip}</Text>
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
        <AnimatedPressable onPress={() => router.push(`/recipe/cook/${id}`)} style={s.ctaBtn} accessibilityLabel="요리 시작하기" accessibilityRole="button">
          <Ionicons name="play" size={22} color={colors.white} />
          <Text style={[typo.heading2, { color: colors.white }]}>요리 시작하기</Text>
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
    backgroundColor: "rgba(0,0,0,0.45)",
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
    backgroundColor: "rgba(0,0,0,0.45)",
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
  tabBtn: { flex: 1, paddingVertical: space.lg, borderRadius: radius.md, alignItems: "center", minHeight: 44 },
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  stepInstruction: { ...typo.body1, color: colors.textPrimary, lineHeight: 24 },
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
    borderRadius: radius.xl,
    height: size.ctaHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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
  hintsCard: {
    backgroundColor: colors.bgPrimary,
    marginHorizontal: space.gutter,
    marginTop: space.cardGap,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    marginBottom: space.md,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.yellow,
    marginTop: space.sm,
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
    minHeight: 48,
  },
});
