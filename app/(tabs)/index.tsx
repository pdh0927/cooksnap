import { View, Text, ScrollView, FlatList, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "../../src/store/recipeStore";
import { useFolders } from "../../src/store/folderStore";
import { colors, typo, space, radius } from "../../src/theme";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import Spinner from "../../src/components/Spinner";
import RecipeThumb from "../../src/components/RecipeThumb";

type ViewMode = "all" | "favorites" | "folder";

const FOLDER_EMOJIS = ["📁", "🍳", "🥗", "🍜", "🍖", "🎂", "🥘", "🍕", "🌮", "🍱", "☕", "🧁", "💪", "🎉", "❄️", "☀️"];

export default function MyRecipesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recipes, loading } = useRecipes();
  const { folders, createFolder, deleteFolder } = useFolders();
  const [mode, setMode] = useState<ViewMode>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderEmoji, setNewFolderEmoji] = useState("📁");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "time">("newest");

  const sortLabel = sortBy === "newest" ? "최신순" : sortBy === "name" ? "이름순" : "조리시간순";
  function cycleSortBy() {
    setSortBy((prev) => (prev === "newest" ? "name" : prev === "name" ? "time" : "newest"));
  }

  // Filter logic
  const filtered =
    mode === "favorites"
      ? recipes.filter((r) => r.isFavorite)
      : mode === "folder" && selectedFolderId
      ? recipes.filter((r) => {
          const folder = folders.find((f) => f.id === selectedFolderId);
          return folder?.recipeIds.includes(r.id) ?? false;
        })
      : recipes;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title, "ko");
    if (sortBy === "time") return a.cookTimeMinutes - b.cookTimeMinutes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim(), newFolderEmoji);
    setNewFolderName("");
    setNewFolderEmoji("📁");
    setShowNewFolder(false);
  }

  function handleDeleteFolder(id: string, name: string) {
    Alert.alert(`"${name}" 폴더 삭제`, "폴더만 삭제되고 레시피는 유지됩니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: () => {
          deleteFolder(id);
          if (selectedFolderId === id) {
            setMode("all");
            setSelectedFolderId(null);
          }
        },
      },
    ]);
  }

  const sectionTitle =
    mode === "all" ? "모든 레시피" : mode === "favorites" ? "즐겨찾기" : selectedFolder?.name ?? "";

  const renderRecipeCard = useCallback(({ item: recipe }: { item: typeof sorted[number] }) => (
    <AnimatedPressable
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      style={s.recipeCard}
    >
      <RecipeThumb thumbnailUrl={recipe.thumbnailUrl} gradientColors={recipe.gradientColors as [string, string]} emoji={recipe.emoji} />
      <View style={s.recipeInfo}>
        <Text style={s.recipeName} numberOfLines={1}>{recipe.title}</Text>
        <View style={s.recipeMeta}>
          <Text style={s.recipeMetaText}>{recipe.cookTimeMinutes}분</Text>
          <View style={s.dot} />
          <Text style={s.recipeMetaText}>{recipe.servings}인분</Text>
          {recipe.isFavorite && (
            <>
              <View style={s.dot} />
              <Ionicons name="heart" size={11} color={colors.red} />
            </>
          )}
        </View>
        {recipe.sourceLabel && recipe.sourceLabel !== "직접 작성" && (
          <Text style={s.sourceText} numberOfLines={1}>{recipe.sourceLabel}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
    </AnimatedPressable>
  ), [router]);

  const listHeader = (
    <View style={{ gap: space.cardGap }}>
      {/* Filter chips: 전체, 즐겨찾기 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipScroll}
      >
        <Pressable
          onPress={() => { setMode("all"); setSelectedFolderId(null); }}
          style={[s.chip, mode === "all" && s.chipActive]}
        >
          <Text style={[s.chipText, mode === "all" && s.chipTextActive]}>전체</Text>
        </Pressable>
        <Pressable
          onPress={() => { setMode("favorites"); setSelectedFolderId(null); }}
          style={[s.chip, mode === "favorites" && s.chipActive]}
        >
          <Ionicons
            name="heart"
            size={12}
            color={mode === "favorites" ? colors.white : colors.red}
            style={{ marginRight: 4 }}
          />
          <Text style={[s.chipText, mode === "favorites" && s.chipTextActive]}>즐겨찾기</Text>
        </Pressable>
      </ScrollView>

      {/* Folders section */}
      <View style={s.sectionHeader}>
        <Text style={[typo.heading3, { color: colors.textPrimary }]}>내 폴더</Text>
        <Pressable onPress={() => setShowNewFolder(true)} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      {/* New folder input */}
      {showNewFolder && (
        <View style={s.newFolderCard}>
          {/* Emoji picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, marginBottom: space.lg }}>
            {FOLDER_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setNewFolderEmoji(e)}
                style={[s.emojiBtn, newFolderEmoji === e && s.emojiBtnActive]}
              >
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={s.newFolderRow}>
            <TextInput
              style={s.newFolderInput}
              placeholder="폴더 이름 (예: 주말 브런치)"
              placeholderTextColor={colors.textDisabled}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateFolder}
            />
            <Pressable onPress={handleCreateFolder} style={s.newFolderBtn}>
              <Text style={[typo.body2Bold, { color: colors.white }]}>만들기</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setShowNewFolder(false)} style={{ alignSelf: "center", marginTop: space.md }}>
            <Text style={[typo.caption1, { color: colors.textTertiary }]}>취소</Text>
          </Pressable>
        </View>
      )}

      {/* Folder grid */}
      {folders.length > 0 ? (
        <View style={s.folderGrid}>
          {folders.map((folder) => {
            const count = folder.recipeIds.length;
            const isSelected = mode === "folder" && selectedFolderId === folder.id;
            return (
              <AnimatedPressable
                key={folder.id}
                onPress={() => {
                  setMode("folder");
                  setSelectedFolderId(folder.id);
                }}
                onLongPress={() => handleDeleteFolder(folder.id, folder.name)}
                style={[s.folderCard, isSelected && s.folderCardActive]}
              >
                <Text style={s.folderEmoji}>{folder.emoji}</Text>
                <Text style={[s.folderName, isSelected && { color: colors.accent }]} numberOfLines={1}>
                  {folder.name}
                </Text>
                <Text style={s.folderCount}>{count}개</Text>
              </AnimatedPressable>
            );
          })}
        </View>
      ) : !showNewFolder ? (
        <Pressable onPress={() => setShowNewFolder(true)} style={s.folderEmpty}>
          <Ionicons name="folder-open-outline" size={24} color={colors.textDisabled} />
          <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.md }]}>
            폴더를 만들어 레시피를 정리해보세요
          </Text>
        </Pressable>
      ) : null}

      {/* Selected folder header */}
      {mode === "folder" && selectedFolder && (
        <View style={s.folderHeader}>
          <Text style={{ fontSize: 20 }}>{selectedFolder.emoji}</Text>
          <Text style={[typo.heading3, { color: colors.textPrimary, flex: 1 }]}>
            {selectedFolder.name}
          </Text>
          <Text style={[typo.caption2, { color: colors.textTertiary }]}>
            {filtered.length}개
          </Text>
        </View>
      )}

      {/* Unified recipe list header with sort button */}
      <View style={s.sectionHeader}>
        <Text style={[typo.heading3, { color: colors.textPrimary }]}>
          {sectionTitle}
        </Text>
        <Pressable onPress={cycleSortBy} style={s.sortBtn} hitSlop={8}>
          <Ionicons name="swap-vertical" size={16} color={colors.accent} />
          <Text style={[typo.caption1, { color: colors.accent }]}>{sortLabel}</Text>
        </Pressable>
      </View>

      {/* Loading state */}
      {loading && recipes.length === 0 && (
        <View style={s.loadingWrap}>
          <Spinner size={36} />
        </View>
      )}
    </View>
  );

  const listEmpty = !loading ? (
    <View style={s.emptyCard}>
      <Text style={{ fontSize: 44, marginBottom: space.xl }}>
        {mode === "favorites" ? "💝" : mode === "folder" ? "📂" : "📖"}
      </Text>
      <Text style={[typo.heading3, { color: colors.textPrimary, marginBottom: space.md }]}>
        {mode === "favorites"
          ? "즐겨찾기한 레시피가 없어요"
          : mode === "folder"
          ? "이 폴더가 비어있어요"
          : "레시피가 없어요"}
      </Text>
      <Text style={[typo.body2, { color: colors.textTertiary, textAlign: "center" }]}>
        {mode === "favorites"
          ? "레시피 상세에서 ♥를 눌러 추가해보세요"
          : mode === "folder"
          ? "레시피 상세에서 폴더에 추가할 수 있어요"
          : "아래 + 버튼을 눌러 레시피를 추가해보세요"}
      </Text>
      {mode === "all" && (
        <AnimatedPressable
          onPress={() => router.push("/(tabs)/add")}
          style={s.ctaBtn}
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={[typo.body2Bold, { color: colors.white }]}>레시피 추가하기</Text>
        </AnimatedPressable>
      )}
    </View>
  ) : null;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>내 레시피</Text>
        <Text style={[typo.caption1, { color: colors.textTertiary }]}>
          {recipes.length}개
        </Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  title: { ...typo.screenTitle, color: colors.textPrimary },
  scroll: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  // Chips
  chipScroll: { gap: space.md, marginBottom: space.xs },
  chip: {
    height: 34,
    paddingHorizontal: space.xl,
    borderRadius: radius.full,
    backgroundColor: colors.bgPrimary,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { ...typo.body2Bold, color: colors.textTertiary },
  chipTextActive: { color: colors.white },
  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: space.lg,
    marginBottom: space.xs,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  // Folders
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
  },
  folderCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xl,
    padding: space.xl,
    width: "48.5%" as any,
    minHeight: 88,
  },
  folderCardActive: {
    backgroundColor: colors.accentLight,
  },
  folderEmoji: { fontSize: 24, marginBottom: space.md },
  folderName: { ...typo.body2Bold, color: colors.textPrimary, marginBottom: space.xxs },
  folderCount: { ...typo.caption2, color: colors.textTertiary },
  folderEmpty: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.xxl,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderStyle: "dashed",
  },
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginTop: space.lg,
  },
  // New folder
  newFolderCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgPage,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnActive: { backgroundColor: colors.accentLight },
  newFolderRow: {
    flexDirection: "row",
    gap: space.md,
  },
  newFolderInput: {
    flex: 1,
    backgroundColor: colors.bgPage,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    ...typo.body2,
    color: colors.textPrimary,
  },
  newFolderBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: space.xxl,
    justifyContent: "center",
  },
  // Recipe cards
  recipeCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  recipeInfo: { flex: 1 },
  recipeName: { ...typo.body1Bold, color: colors.textPrimary, marginBottom: space.xs },
  recipeMeta: { flexDirection: "row", alignItems: "center", gap: space.sm },
  recipeMetaText: { ...typo.caption1, color: colors.textTertiary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDisabled },
  sourceText: { ...typo.caption2, color: colors.textTertiary, marginTop: space.xs },
  tagRow: { flexDirection: "row", gap: space.sm, marginTop: space.xs },
  tagText: { ...typo.caption3, color: colors.accent },
  // Loading
  loadingWrap: {
    paddingVertical: space.x5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Empty
  emptyCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
  ctaBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
    marginTop: space.xxl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
});
