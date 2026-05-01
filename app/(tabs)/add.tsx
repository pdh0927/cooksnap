import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typo, space, radius, size } from "../../src/theme";
import Spinner from "../../src/components/Spinner";
import AnimatedPressable from "../../src/components/AnimatedPressable";
import { extractRecipeFromUrl, generateRecipeFromName, isUrl, ExtractStep } from "../../src/services/extractRecipe";
import { useRecipes } from "../../src/store/recipeStore";

const STEP_INDEX: Record<ExtractStep, number> = {
  fetch: 0,
  extract: 1,
  structure: 2,
  done: 3,
};

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const cancelled = useRef(false);

  const inputIsUrl = isUrl(input);

  const steps = inputIsUrl
    ? ["페이지 내용 가져오는 중...", "재료 목록 추출 중...", "조리 순서 정리 중...", "레시피 완성!"]
    : ["레시피 검색 중...", "레시피 만드는 중...", "조리 순서 정리 중...", "레시피 완성!"];

  async function startParsing() {
    const trimmed = input.trim();
    if (!trimmed) {
      Alert.alert("입력 없음", "URL이나 요리명을 입력해주세요");
      return;
    }

    // 디버깅: 실제 전달되는 입력값 확인
    console.log("[CookSnap] 입력값:", trimmed);
    console.log("[CookSnap] URL여부:", inputIsUrl);

    setParsing(true);
    setParseStep(0);
    cancelled.current = false;

    try {
      const onProgress = (p: { step: string }) => {
        if (cancelled.current) return;
        setParseStep(STEP_INDEX[p.step as ExtractStep]);
      };

      const recipe = inputIsUrl
        ? await extractRecipeFromUrl(trimmed, onProgress)
        : await generateRecipeFromName(trimmed, onProgress);

      if (cancelled.current) return;

      await addRecipe(recipe);
      setParsing(false);
      setInput("");
      router.push(`/recipe/${recipe.id}`);
    } catch (err: any) {
      if (cancelled.current) return;
      setParsing(false);
      Alert.alert("실패", err.message || "레시피를 만들 수 없습니다. 다시 시도해주세요.");
    }
  }

  function cancelParsing() {
    cancelled.current = true;
    setParsing(false);
    setParseStep(0);
  }

  if (parsing) {
    return (
      <View style={s.parsingRoot}>
        <View style={s.spinnerWrap}>
          <Spinner />
        </View>
        <Text style={[typo.heading2, { color: colors.textPrimary, marginBottom: space.sm, textAlign: "center" }]}>
          AI가 레시피를 분석하고 있어요
        </Text>
        <Text style={[typo.body2, { color: colors.textTertiary, marginBottom: space.x4 }]}>
          잠시만 기다려주세요...
        </Text>
        <View style={s.parseCard}>
          {steps.map((step, i) => (
            <View key={i} style={s.pRow}>
              <View style={[s.pDot, i < parseStep && s.pDone, i === parseStep && s.pCurr]}>
                {i < parseStep && <Ionicons name="checkmark" size={11} color={colors.white} />}
              </View>
              <Text
                style={[
                  typo.body2,
                  { color: colors.textDisabled },
                  i < parseStep && { color: colors.green },
                  i === parseStep && { color: colors.textPrimary, fontWeight: "500" },
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
        <Pressable onPress={cancelParsing} style={{ marginTop: space.xl }}>
          <Text style={[typo.body2, { color: colors.textTertiary }]}>취소</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>레시피 추가</Text>
        <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xs }]}>URL이나 요리명을 입력하세요</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Input Card */}
        <View style={s.card}>
          <Text style={[typo.caption1, { color: colors.textTertiary, marginBottom: space.lg }]}>
            요리 이름이나 링크를 입력하면 AI가 레시피를 만들어요
          </Text>
          <View style={s.inputBox}>
            <Ionicons name={inputIsUrl ? "link-outline" : "restaurant-outline"} size={18} color={colors.textDisabled} />
            <TextInput
              style={s.input}
              placeholder="파스타, 김치찌개, YouTube 링크..."
              placeholderTextColor={colors.textDisabled}
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={startParsing}
            />
            {input.length > 0 && (
              <Pressable onPress={() => setInput("")}>
                <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
              </Pressable>
            )}
          </View>
          <AnimatedPressable
            onPress={startParsing}
            style={[s.primaryBtn, !input.trim() && { backgroundColor: colors.gray200 }]}
          >
            <Ionicons name="sparkles" size={18} color={input.trim() ? colors.white : colors.textDisabled} />
            <Text style={[s.primaryBtnText, !input.trim() && { color: colors.textDisabled }]}>
              {inputIsUrl ? "AI 레시피 변환" : "AI 레시피 생성"}
            </Text>
          </AnimatedPressable>
          <Text style={[typo.caption3, { color: colors.textTertiary, textAlign: "center", marginTop: space.md }]}>
            지원: YouTube, 네이버 블로그, 티스토리, 요리명
          </Text>
        </View>

        {/* Other options */}
        <View style={s.card}>
          <AnimatedPressable style={s.option} onPress={() => router.push("/recipe/create")}>
            <View style={[s.optIcon, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="create-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>직접 작성</Text>
              <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xxs }]}>
                나만의 레시피를 직접 입력해요
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
          </AnimatedPressable>

          <View style={s.optDivider} />

          <View style={[s.option, { opacity: 0.4 }]}>
            <View style={[s.optIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="camera-outline" size={20} color={colors.gray600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>사진으로 추가</Text>
              <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: space.xxs }]}>
                레시피 사진을 찍으면 AI가 텍스트로 변환해요
              </Text>
            </View>
            <View style={s.comingSoonBadge}>
              <Text style={[typo.caption3, { color: colors.white }]}>준비 중</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: { padding: space.gutter, paddingBottom: 120, gap: space.cardGap },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  inputBox: {
    backgroundColor: colors.bgPage,
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  input: { flex: 1, ...typo.body2, color: colors.textPrimary },
  primaryBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    height: size.ctaHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    marginTop: space.xl,
  },
  primaryBtnText: { ...typo.body1Bold, color: colors.white },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
    paddingVertical: space.xs,
  },
  optIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
    backgroundColor: colors.gray400,
    borderRadius: radius.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.xxs,
  },
  optDivider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginVertical: space.xl,
    marginLeft: 60,
  },
  parsingRoot: {
    flex: 1,
    backgroundColor: colors.bgPage,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.x4,
  },
  spinnerWrap: { marginBottom: space.xxl },
  parseCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
    width: "100%",
    gap: space.xl,
  },
  pRow: { flexDirection: "row", alignItems: "center", gap: space.lg },
  pDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  pDone: { backgroundColor: colors.green, borderColor: colors.green },
  pCurr: { borderColor: colors.accent },
});
