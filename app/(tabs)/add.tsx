import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typo, space, radius } from "../../src/theme";

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0);

  const steps = [
    "페이지 내용 가져오는 중...",
    "재료 목록 추출 중...",
    "조리 순서 정리 중...",
    "레시피 완성!",
  ];

  function startParsing() {
    if (!url.trim()) return;
    setParsing(true);
    setParseStep(0);
    setTimeout(() => setParseStep(1), 1200);
    setTimeout(() => setParseStep(2), 2400);
    setTimeout(() => setParseStep(3), 3600);
    setTimeout(() => {
      setParsing(false);
      router.push("/recipe/1");
    }, 4800);
  }

  if (parsing) {
    return (
      <View style={s.parsingRoot}>
        <View style={s.spinnerWrap}>
          <View style={s.spinner} />
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
      </View>

      <ScrollViewContent url={url} setUrl={setUrl} startParsing={startParsing} />
    </KeyboardAvoidingView>
  );
}

function ScrollViewContent({ url, setUrl, startParsing }: { url: string; setUrl: (v: string) => void; startParsing: () => void }) {
  const router = useRouter();
  return (
    <View style={s.content}>
      {/* URL Card */}
      <View style={s.card}>
        <Text style={[typo.caption1, { color: colors.textTertiary, marginBottom: space.lg }]}>
          링크를 붙여넣으면 AI가 레시피로 변환해요
        </Text>
        <View style={s.inputBox}>
          <Ionicons name="link-outline" size={18} color={colors.textDisabled} />
          <TextInput
            style={s.input}
            placeholder="유튜브, 블로그 링크 붙여넣기"
            placeholderTextColor={colors.textDisabled}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
        <Pressable
          onPress={startParsing}
          style={[s.primaryBtn, !url.trim() && { backgroundColor: colors.gray200 }]}
        >
          <Text style={[s.primaryBtnText, !url.trim() && { color: colors.textDisabled }]}>
            AI 레시피 변환
          </Text>
        </Pressable>
      </View>

      {/* Other options */}
      <View style={s.card}>
        <Pressable style={s.option} onPress={() => router.push("/recipe/create")}>
          <View style={[s.optIcon, { backgroundColor: "#EBF2FE" }]}>
            <Ionicons name="create-outline" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>직접 작성</Text>
            <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
              나만의 레시피를 직접 입력해요
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
        </Pressable>

        <View style={s.optDivider} />

        <Pressable style={s.option}>
          <View style={[s.optIcon, { backgroundColor: "#F3EEFF" }]}>
            <Ionicons name="camera-outline" size={20} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typo.body1Bold, { color: colors.textPrimary }]}>사진으로 추가</Text>
            <Text style={[typo.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
              레시피 사진을 찍으면 AI가 텍스트로 변환해요
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
        </Pressable>
      </View>
    </View>
  );
}

import { ScrollView } from "react-native";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  content: { padding: space.gutter, gap: space.cardGap },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  inputBox: {
    backgroundColor: colors.bgPage,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  input: { flex: 1, ...typo.body2, color: colors.textPrimary },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optDivider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginVertical: space.xl,
    marginLeft: 60,
  },
  // Parsing
  parsingRoot: {
    flex: 1,
    backgroundColor: colors.bgPage,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.x4,
  },
  spinnerWrap: { marginBottom: space.xxl },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: colors.gray200,
    borderTopColor: colors.accent,
  },
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
