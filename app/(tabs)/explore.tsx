import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "../../src/store/recipeStore";
import { colors, typo, space, radius } from "../../src/theme";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import RecipeThumb from "../../src/components/RecipeThumb";
import Spinner from "../../src/components/Spinner";
import type { Recipe } from "../../src/types/recipe";

// Theme sections for curated explore
interface ThemeSection {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  bgColor: string;
  filter: (recipes: Recipe[]) => Recipe[];
}

const THEMES: ThemeSection[] = [
  {
    title: "10분 안에 뚝딱",
    subtitle: "바쁜 날 빠르게 만들어요",
    emoji: "⚡",
    color: colors.yellow,
    bgColor: colors.yellowLight,
    filter: (r) => r.filter((x) => x.cookTimeMinutes <= 15),
  },
  {
    title: "재료 3개 이하",
    subtitle: "심플하게, 맛있게",
    emoji: "🧂",
    color: colors.green,
    bgColor: colors.greenLight,
    filter: (r) => r.filter((x) => x.ingredients.filter((i) => i.scalable).length <= 3),
  },
  {
    title: "가성비 레시피",
    subtitle: "적은 재료로 든든하게",
    emoji: "💰",
    color: colors.accent,
    bgColor: colors.accentLight,
    filter: (r) => r.filter((x) => x.tags?.includes("가성비")),
  },
  {
    title: "혼밥 메뉴",
    subtitle: "1인분 레시피 모음",
    emoji: "🍽️",
    color: colors.purple,
    bgColor: colors.purpleLight,
    filter: (r) => r.filter((x) => x.servings === 1),
  },
  {
    title: "초보도 OK",
    subtitle: "누구나 쉽게 따라해요",
    emoji: "👩‍🍳",
    color: colors.pink,
    bgColor: colors.pinkLight,
    filter: (r) => r.filter((x) => x.difficulty === "쉬움"),
  },
  {
    title: "한식 모음",
    subtitle: "익숙하고 따뜻한 맛",
    emoji: "🇰🇷",
    color: colors.red,
    bgColor: colors.redLight,
    filter: (r) => r.filter((x) => x.category === "한식"),
  },
  {
    title: "양식 모음",
    subtitle: "파스타, 샐러드, 스테이크",
    emoji: "🍝",
    color: colors.orange,
    bgColor: colors.orangeLight,
    filter: (r) => r.filter((x) => x.category === "양식"),
  },
];

function RecipeHCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} style={s.hCard}>
      <View style={s.hCardThumb}>
        <RecipeThumb thumbnailUrl={recipe.thumbnailUrl} gradientColors={recipe.gradientColors as [string, string]} emoji={recipe.emoji} width={150} height={110} borderRadius={radius.lg} sourceType={recipe.sourceType} />
      </View>
      <Text style={s.hCardTitle} numberOfLines={2}>{recipe.title}</Text>
      <Text style={s.hCardMeta}>{recipe.cookTimeMinutes}분 · {recipe.difficulty}</Text>
    </AnimatedPressable>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes, loading } = useRecipes();

  // Collect all unique tags from recipes
  const allTags = Array.from(new Set(recipes.flatMap((r) => r.tags ?? [])));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>탐색</Text>
        <Text style={s.headerSub}>테마별로 레시피를 찾아보세요</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Loading state */}
        {loading && recipes.length === 0 && (
          <View style={s.emptyWrap}>
            <Spinner size={32} color={colors.accent} />
            <Text style={[typo.body1, { color: colors.textTertiary, marginTop: space.xl }]}>
              레시피를 불러오는 중...
            </Text>
          </View>
        )}

        {/* Empty state */}
        {recipes.length === 0 && !loading && (
          <View style={s.emptyWrap}>
            <Text style={{ fontSize: 48 }}>🍳</Text>
            <Text style={[typo.heading2, { color: colors.textPrimary, marginTop: space.xl }]}>
              아직 레시피가 없어요
            </Text>
            <Text style={[typo.body2, { color: colors.textTertiary, marginTop: space.md, textAlign: "center" }]}>
              레시피를 추가하면 테마별로{"\n"}탐색할 수 있어요
            </Text>
          </View>
        )}

        {/* Trending tags */}
        {allTags.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.accentBar, { backgroundColor: colors.orange }]} />
              <Text style={[typo.heading3, { color: colors.textPrimary }]}>인기 태그</Text>
            </View>
            <View style={s.tagWrap}>
              {allTags.slice(0, 12).map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => router.push({ pathname: "/(tabs)/search", params: { q: tag } })}
                  style={s.tag}
                >
                  <Text style={s.tagText}>#{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Theme sections */}
        {THEMES.map((theme) => {
          const matched = theme.filter(recipes);
          if (matched.length < 1) return null;

          return (
            <View key={theme.title} style={s.card}>
              {/* Theme header */}
              <View style={s.themeHeader}>
                <View style={[s.accentBar, { backgroundColor: theme.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[typo.heading3, { color: colors.textPrimary }]}>
                    {theme.title}
                  </Text>
                  <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xxs }]}>
                    {theme.subtitle}
                  </Text>
                </View>
                <View style={[s.countBadge, { backgroundColor: colors.bgPage }]}>
                  <Text style={[typo.caption2, { color: theme.color }]}>{matched.length}</Text>
                </View>
              </View>

              {/* Horizontal recipe scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hScroll}
              >
                {matched.map((r) => (
                  <RecipeHCard
                    key={r.id}
                    recipe={r}
                    onPress={() => router.push(`/recipe/${r.id}`)}
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}

        {/* All recipes */}
        {recipes.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.accentBar, { backgroundColor: colors.accent }]} />
              <Text style={[typo.heading3, { color: colors.textPrimary }]}>전체 레시피</Text>
              <View style={[s.countBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[typo.caption2, { color: colors.accent }]}>{recipes.length}</Text>
              </View>
            </View>
            <View style={s.allGrid}>
              {recipes.slice(0, 10).map((r) => (
                <AnimatedPressable
                  key={r.id}
                  onPress={() => router.push(`/recipe/${r.id}`)}
                  style={s.allCard}
                >
                  <RecipeThumb thumbnailUrl={r.thumbnailUrl} gradientColors={r.gradientColors as [string, string]} emoji={r.emoji} fullWidth height={140} borderRadius={radius.lg} sourceType={r.sourceType} />
                  <View style={{ paddingTop: space.md }}>
                    <Text style={[typo.body1Bold, { color: colors.textPrimary }]} numberOfLines={2}>{r.title}</Text>
                    <View style={s.listMeta}>
                      <Text style={s.listMetaText}>{r.cookTimeMinutes}분</Text>
                      <View style={s.dot} />
                      <Text style={s.listMetaText}>{r.servings}인분</Text>
                    </View>
                  </View>
                </AnimatedPressable>
              ))}
            </View>
            {recipes.length > 10 && (
              <Pressable
                onPress={() => router.push("/(tabs)/search")}
                style={s.showMoreBtn}
              >
                <Text style={[typo.body2Bold, { color: colors.accent }]}>
                  전체 {recipes.length}개 보기 →
                </Text>
              </Pressable>
            )}
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
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  headerTitle: { ...typo.screenTitle, color: colors.textPrimary },
  headerSub: { ...typo.caption1, color: colors.textTertiary, marginTop: space.sm },
  scroll: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  // Card
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.xl,
  },
  // Tags
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  tag: {
    height: 30,
    backgroundColor: colors.bgPage,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    justifyContent: "center" as const,
  },
  tagText: { ...typo.caption1, color: colors.accent },
  // Theme section
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    marginBottom: space.xl,
  },
  accentBar: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  countBadge: {
    paddingHorizontal: space.md,
    paddingVertical: space.xxs,
    borderRadius: radius.full,
  },
  // Horizontal card
  hScroll: { gap: space.lg },
  hCard: {
    width: 150,
  },
  hCardThumb: {
    marginBottom: space.md,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  hCardTitle: { ...typo.body2Bold, color: colors.textPrimary, lineHeight: 18 },
  hCardMeta: { ...typo.caption1, color: colors.textTertiary, marginTop: space.xs },
  // All recipes grid
  allGrid: {
    gap: space.xl,
  },
  allCard: {
    overflow: "hidden",
  },
  listMeta: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.xs },
  listMetaText: { ...typo.caption1, color: colors.textTertiary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDisabled },
  showMoreBtn: {
    alignItems: "center",
    paddingVertical: space.xl,
    marginTop: space.md,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space.x6,
  },
});
