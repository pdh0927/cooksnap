import { View, Text, ScrollView, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useState, useRef, useMemo, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRecipes } from "../../src/store/recipeStore";
import { useFolders } from "../../src/store/folderStore";
import { colors, typo, space, radius, size } from "../../src/theme";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import Spinner from "../../src/components/Spinner";
import RecipeThumb from "../../src/components/RecipeThumb";

type ViewMode = "all" | "favorites" | "folder";

const FOLDER_EMOJIS = ["📁", "🍳", "🥗", "🍜", "🍖", "🎂", "🥘", "🍕", "🌮", "🍱", "☕", "🧁", "💪", "🎉", "❄️", "☀️"];
const MAX_FOLDER_NAME_LENGTH = 20;

export default function MyRecipesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const { recipes, loading, refresh } = useRecipes();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refresh();
    } catch {
      setError("레시피를 불러올 수 없습니다. 네트워크를 확인해주세요.");
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);
  const { folders, createFolder, deleteFolder } = useFolders();
  const [mode, setMode] = useState<ViewMode>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderEmoji, setNewFolderEmoji] = useState("📁");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "time">("newest");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const sortLabel = sortBy === "newest" ? "최신순" : sortBy === "name" ? "이름순" : "조리시간순";
  const cycleSortBy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy((prev) => (prev === "newest" ? "name" : prev === "name" ? "time" : "newest"));
  }, []);

  /** Scroll list to top after filter/folder changes */
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Filter logic
  const filtered = useMemo(() =>
    mode === "favorites"
      ? recipes.filter((r) => r.isFavorite)
      : mode === "folder" && selectedFolderId
      ? recipes.filter((r) => {
          const folder = folders.find((f) => f.id === selectedFolderId);
          return folder?.recipeIds.includes(r.id) ?? false;
        })
      : recipes,
    [recipes, mode, selectedFolderId, folders]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title, "ko");
    if (sortBy === "time") return a.cookTimeMinutes - b.cookTimeMinutes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), [filtered, sortBy]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim() || creatingFolder) return;
    setCreatingFolder(true);
    try {
      await createFolder(newFolderName.trim(), newFolderEmoji);
      setNewFolderName("");
      setNewFolderEmoji("📁");
      setShowNewFolder(false);
    } catch {
      Alert.alert("폴더 생성 실패", "네트워크를 확인해주세요.");
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, newFolderEmoji, creatingFolder, createFolder]);

  const handleDeleteFolder = useCallback((id: string, name: string) => {
    Alert.alert(`"${name}" 폴더 삭제`, "폴더만 삭제되고 레시피는 유지됩니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: async () => {
          try {
            await deleteFolder(id);
          } catch {
            Alert.alert("삭제 실패", "네트워크를 확인해주세요.");
            return;
          }
          if (selectedFolderId === id) {
            setMode("all");
            setSelectedFolderId(null);
          }
        },
      },
    ]);
  }, [deleteFolder, selectedFolderId]);

  const handleSelectAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode("all");
    setSelectedFolderId(null);
    scrollToTop();
  }, [scrollToTop]);

  const handleSelectFavorites = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode("favorites");
    setSelectedFolderId(null);
    scrollToTop();
  }, [scrollToTop]);

  const handleSelectFolder = useCallback((folderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode("folder");
    setSelectedFolderId(folderId);
    // Delay scroll slightly so FlatList re-renders with new data first
    setTimeout(scrollToTop, 100);
  }, [scrollToTop]);

  const sectionTitle =
    mode === "all" ? "모든 레시피" : mode === "favorites" ? "즐겨찾기" : selectedFolder?.name ?? "";

  const renderRecipeCard = useCallback(({ item: recipe }: { item: typeof sorted[number] }) => (
    <AnimatedPressable
      onPress={() => routerRef.current.push(`/recipe/${recipe.id}`)}
      style={s.recipeCard}
    >
      <RecipeThumb
        thumbnailUrl={recipe.thumbnailUrl}
        gradientColors={recipe.gradientColors as [string, string]}
        emoji={recipe.emoji}
        fullWidth
        height={size.cardThumbH}
        borderRadius={0}
        sourceType={recipe.sourceType}
      />
      <View style={s.recipeInfo}>
        <View style={s.recipeTopRow}>
          <Text style={s.recipeName} numberOfLines={2}>{recipe.title}</Text>
          {recipe.isFavorite && (
            <Ionicons name="heart" size={14} color={colors.red} />
          )}
        </View>
        <View style={s.recipeMeta}>
          <Text style={s.recipeMetaText}>{recipe.cookTimeMinutes}분</Text>
          <View style={s.dot} />
          <Text style={s.recipeMetaText}>{recipe.servings}인분</Text>
          <View style={s.dot} />
          <Text style={s.recipeMetaText}>{recipe.difficulty}</Text>
        </View>
        {recipe.sourceLabel && recipe.sourceLabel !== "직접 작성" && (
          <Text style={s.sourceText} numberOfLines={1}>{recipe.sourceLabel}</Text>
        )}
      </View>
    </AnimatedPressable>
  ), []);

  const listHeader = useMemo(() => (
    <View style={s.headerSection}>
      {/* Subtle greeting caption */}
      {recipes.length > 0 && (
        <Text style={[typo.caption1, { color: colors.textTertiary }]}>
          저장된 레시피 {recipes.length}개
        </Text>
      )}

      {/* Filter chips: 전체, 즐겨찾기 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipScroll}
      >
        <Pressable
          onPress={handleSelectAll}
          style={[s.chip, mode === "all" && s.chipActive]}
        >
          <Text style={[s.chipText, mode === "all" && s.chipTextActive]}>전체</Text>
        </Pressable>
        <Pressable
          onPress={handleSelectFavorites}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.emojiScroll}>
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
              onChangeText={(text) => setNewFolderName(text.slice(0, MAX_FOLDER_NAME_LENGTH))}
              autoFocus
              maxLength={MAX_FOLDER_NAME_LENGTH}
              returnKeyType="done"
              onSubmitEditing={handleCreateFolder}
            />
            <Pressable
              onPress={handleCreateFolder}
              style={[s.newFolderBtn, (!newFolderName.trim() || creatingFolder) && s.newFolderBtnDisabled]}
              disabled={!newFolderName.trim() || creatingFolder}
            >
              <Text style={[typo.body2Bold, { color: colors.white }]}>
                {creatingFolder ? "..." : "만들기"}
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={() => { setShowNewFolder(false); setNewFolderName(""); setNewFolderEmoji("📁"); }} style={s.cancelBtn}>
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
                onPress={() => handleSelectFolder(folder.id)}
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

      {/* Unified recipe list header with sort button */}
      <View style={s.sectionHeader}>
        <Text style={[typo.heading3, { color: colors.textPrimary }]}>
          {sectionTitle}
        </Text>
        {/* Show filtered count for folder/favorites mode */}
        {mode !== "all" && (
          <Text style={[typo.caption2, { color: colors.textTertiary, marginLeft: space.sm }]}>
            {filtered.length}개
          </Text>
        )}
        <View style={{ flex: 1 }} />
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

      {/* Error state */}
      {error && (
        <View style={s.errorCard}>
          <Ionicons name="cloud-offline-outline" size={24} color={colors.red} />
          <Text style={[typo.body2, { color: colors.textSecondary, textAlign: "center", marginTop: space.md }]}>
            {error}
          </Text>
          <AnimatedPressable onPress={handleRefresh} style={s.retryBtn}>
            <Ionicons name="refresh" size={16} color={colors.accent} />
            <Text style={[typo.body2Bold, { color: colors.accent }]}>다시 시도</Text>
          </AnimatedPressable>
        </View>
      )}
    </View>
  ), [recipes.length, mode, selectedFolderId, showNewFolder, newFolderName, newFolderEmoji,
      creatingFolder, folders, filtered.length, sectionTitle, sortLabel, loading, error,
      handleCreateFolder, handleDeleteFolder, handleSelectAll, handleSelectFavorites,
      handleSelectFolder, cycleSortBy, handleRefresh]);

  const listEmpty = useMemo(() => {
    if (loading) return null;
    return (
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
            onPress={() => routerRef.current.push("/(tabs)/add")}
            style={s.ctaBtn}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={[typo.body2Bold, { color: colors.white }]}>레시피 추가하기</Text>
          </AnimatedPressable>
        )}
      </View>
    );
  }, [loading, mode]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>내 레시피</Text>
      </View>

      <FlatList
        ref={listRef}
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
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
  // Header section wrapper for consistent gap
  headerSection: { gap: space.cardGap },
  // Chips
  chipScroll: { gap: space.md },
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
    borderRadius: radius.xxl,
    padding: space.xl,
    // Use calculated width: (100% - gap) / 2
    // With flexBasis and flexGrow, two cards fill each row evenly
    flexBasis: "47%",
    flexGrow: 1,
    maxWidth: "49%",
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
  // New folder
  newFolderCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  emojiScroll: { gap: space.sm, marginBottom: space.lg },
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
  newFolderBtnDisabled: {
    opacity: 0.5,
  },
  cancelBtn: {
    alignSelf: "center",
    marginTop: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.xl,
  },
  // Recipe cards — vertical layout (thumbnail on top)
  recipeCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    overflow: "hidden",
  },
  recipeInfo: { padding: space.xl },
  recipeTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md },
  recipeName: { ...typo.heading3, color: colors.textPrimary, flex: 1 },
  recipeMeta: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.md },
  recipeMetaText: { ...typo.caption1, color: colors.textTertiary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDisabled },
  sourceText: { ...typo.caption2, color: colors.textTertiary, marginTop: space.sm },
  // Loading
  loadingWrap: {
    paddingVertical: space.x5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Error
  errorCard: {
    backgroundColor: colors.redLight,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.xl,
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.lg,
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
