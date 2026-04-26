import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, typo, space, radius } from "../../../src/theme";
import { useRecipes } from "../../../src/store/recipeStore";
import type { Recipe, Category, Difficulty, Ingredient, Step } from "../../../src/types/recipe";

const CATEGORIES: Category[] = ["한식", "중식", "일식", "양식", "디저트", "간편식"];
const DIFFICULTIES: Difficulty[] = ["쉬움", "보통", "어려움"];
const EMOJIS = ["🍲", "🍝", "🥗", "🍖", "🍛", "🍜", "🥘", "🍕", "🍰", "🍣"];
const GRADIENTS: [string, string][] = [
  ["#DC2626", "#F97316"],
  ["#F59E0B", "#EF4444"],
  ["#10B981", "#3B82F6"],
  ["#7C3AED", "#EC4899"],
  ["#0EA5E9", "#6366F1"],
  ["#F97316", "#FBBF24"],
];

export default function CreateRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addRecipe } = useRecipes();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🍲");
  const [category, setCategory] = useState<Category>("한식");
  const [difficulty, setDifficulty] = useState<Difficulty>("보통");
  const [cookTime, setCookTime] = useState("30");
  const [servings, setServings] = useState("2");
  const [ingredients, setIngredients] = useState<{ name: string; amount: string }[]>([
    { name: "", amount: "" },
  ]);
  const [steps, setSteps] = useState<string[]>([""]);

  function addIngredient() {
    setIngredients([...ingredients, { name: "", amount: "" }]);
  }

  function removeIngredient(i: number) {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, idx) => idx !== i));
  }

  function updateIngredient(i: number, field: "name" | "amount", val: string) {
    const copy = [...ingredients];
    copy[i] = { ...copy[i], [field]: val };
    setIngredients(copy);
  }

  function addStep() {
    setSteps([...steps, ""]);
  }

  function removeStep(i: number) {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, idx) => idx !== i));
  }

  function updateStep(i: number, val: string) {
    const copy = [...steps];
    copy[i] = val;
    setSteps(copy);
  }

  function parseTimerFromStep(text: string): number | null {
    const match = text.match(/(\d+)\s*분/);
    if (match) return parseInt(match[1], 10) * 60;
    const secMatch = text.match(/(\d+)\s*초/);
    if (secMatch) return parseInt(secMatch[1], 10);
    return null;
  }

  function parseIngredientAmount(raw: string): { amount: number; unit: string } {
    const match = raw.match(/^([\d./]+)\s*(.*)$/);
    if (match) {
      let num = 0;
      if (match[1].includes("/")) {
        const [a, b] = match[1].split("/");
        num = parseFloat(a) / parseFloat(b);
      } else {
        num = parseFloat(match[1]);
      }
      return { amount: isNaN(num) ? 0 : num, unit: match[2] || "개" };
    }
    return { amount: 0, unit: raw || "약간" };
  }

  async function save() {
    if (!title.trim()) {
      Alert.alert("알림", "레시피 이름을 입력해주세요");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    const validSteps = steps.filter((s) => s.trim());

    if (validIngredients.length === 0) {
      Alert.alert("알림", "재료를 최소 1개 입력해주세요");
      return;
    }
    if (validSteps.length === 0) {
      Alert.alert("알림", "조리 순서를 최소 1개 입력해주세요");
      return;
    }

    const recipe: Recipe = {
      id: Date.now().toString(),
      title: title.trim(),
      emoji,
      category,
      difficulty,
      cookTimeMinutes: parseInt(cookTime, 10) || 30,
      servings: parseInt(servings, 10) || 2,
      ingredients: validIngredients.map((ing) => {
        const parsed = parseIngredientAmount(ing.amount);
        return {
          name: ing.name.trim(),
          amount: parsed.amount,
          unit: parsed.unit,
          scalable: parsed.amount > 0,
        };
      }),
      steps: validSteps.map((s, i) => ({
        order: i + 1,
        instruction: s.trim(),
        timerSeconds: parseTimerFromStep(s),
        tip: null,
      })),
      sourceUrl: null,
      sourceType: "manual",
      sourceLabel: "직접 작성",
      tags: [],
      tips: [],
      warnings: [],
      gradientColors: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      createdAt: new Date().toISOString(),
    };

    await addRecipe(recipe);
    router.replace(`/recipe/${recipe.id}`);
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={[typo.heading3, { color: colors.textPrimary }]}>레시피 작성</Text>
        <Pressable onPress={save} style={s.saveBtn}>
          <Text style={[typo.body2Bold, { color: colors.white }]}>저장</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <View style={s.card}>
          <Text style={s.label}>레시피 이름</Text>
          <TextInput
            style={s.input}
            placeholder="예: 김치찌개"
            placeholderTextColor={colors.textDisabled}
            value={title}
            onChangeText={setTitle}
          />

          {/* Emoji picker */}
          <Text style={[s.label, { marginTop: space.xxl }]}>이모지</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.emojiRow}>
            {EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[s.emojiBtn, emoji === e && s.emojiBtnActive]}
              >
                <Text style={{ fontSize: 28 }}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Category */}
          <Text style={[s.label, { marginTop: space.xxl }]}>카테고리</Text>
          <View style={s.chipRow}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[s.chip, category === c && s.chipActive]}
              >
                <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          {/* Difficulty */}
          <Text style={[s.label, { marginTop: space.xxl }]}>난이도</Text>
          <View style={s.chipRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDifficulty(d)}
                style={[s.chip, difficulty === d && s.chipActive]}
              >
                <Text style={[s.chipText, difficulty === d && s.chipTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          {/* Time & Servings */}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { marginTop: space.xxl }]}>조리시간(분)</Text>
              <TextInput
                style={s.input}
                placeholder="30"
                placeholderTextColor={colors.textDisabled}
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { marginTop: space.xxl }]}>인분</Text>
              <TextInput
                style={s.input}
                placeholder="2"
                placeholderTextColor={colors.textDisabled}
                value={servings}
                onChangeText={setServings}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={[typo.heading3, { color: colors.textPrimary }]}>재료</Text>
            <Pressable onPress={addIngredient} style={s.addBtn}>
              <Ionicons name="add" size={18} color={colors.accent} />
              <Text style={[typo.body2Bold, { color: colors.accent }]}>추가</Text>
            </Pressable>
          </View>
          {ingredients.map((ing, i) => (
            <View key={i} style={s.ingRow}>
              <TextInput
                style={[s.input, { flex: 2 }]}
                placeholder="재료명"
                placeholderTextColor={colors.textDisabled}
                value={ing.name}
                onChangeText={(v) => updateIngredient(i, "name", v)}
              />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="200g"
                placeholderTextColor={colors.textDisabled}
                value={ing.amount}
                onChangeText={(v) => updateIngredient(i, "amount", v)}
              />
              {ingredients.length > 1 && (
                <Pressable onPress={() => removeIngredient(i)} style={s.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={colors.textDisabled} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Steps */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={[typo.heading3, { color: colors.textPrimary }]}>조리 순서</Text>
            <Pressable onPress={addStep} style={s.addBtn}>
              <Ionicons name="add" size={18} color={colors.accent} />
              <Text style={[typo.body2Bold, { color: colors.accent }]}>추가</Text>
            </Pressable>
          </View>
          <Text style={[typo.caption1, { color: colors.textTertiary, marginBottom: space.xl }]}>
            시간을 포함하면 타이머가 자동 생성돼요 (예: "5분간 볶아주세요")
          </Text>
          {steps.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder={`${i + 1}단계 설명`}
                placeholderTextColor={colors.textDisabled}
                value={step}
                onChangeText={(v) => updateStep(i, v)}
                multiline
              />
              {steps.length > 1 && (
                <Pressable onPress={() => removeStep(i)} style={s.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={colors.textDisabled} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: space.x5 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    backgroundColor: colors.bgPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgPage, alignItems: "center", justifyContent: "center" },
  saveBtn: { backgroundColor: colors.accent, paddingHorizontal: space.xl, paddingVertical: space.md, borderRadius: radius.md },
  scroll: { padding: space.gutter, gap: space.cardGap },
  card: { backgroundColor: colors.bgPrimary, borderRadius: radius.xxl, padding: space.cardPad },
  label: { ...typo.caption2, color: colors.textTertiary, marginBottom: space.md, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.bgPage,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    ...typo.body1,
    color: colors.textPrimary,
  },
  emojiRow: { gap: space.md },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bgPage,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnActive: { backgroundColor: colors.accentLight },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  chip: { height: 34, paddingHorizontal: space.xl, borderRadius: radius.full, backgroundColor: colors.bgPage, justifyContent: "center" },
  chipActive: { backgroundColor: colors.accent },
  chipText: { ...typo.body2Bold, color: colors.textTertiary },
  chipTextActive: { color: colors.white },
  row: { flexDirection: "row", gap: space.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.xl },
  addBtn: { flexDirection: "row", alignItems: "center", gap: space.xs },
  ingRow: { flexDirection: "row", gap: space.md, marginBottom: space.md, alignItems: "center" },
  removeBtn: { padding: space.xs },
  stepRow: { flexDirection: "row", gap: space.md, marginBottom: space.lg, alignItems: "flex-start" },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.gray900, alignItems: "center", justifyContent: "center", marginTop: space.lg },
  stepNumText: { ...typo.caption2, color: colors.white, fontWeight: "700" },
});
