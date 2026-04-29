import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { useRecipes } from "../../../src/store/recipeStore";
import StepText from "../../../src/components/StepText";
import { colors, darkColors, typo, space, radius } from "../../../src/theme";
import type { Ingredient } from "../../../src/types/recipe";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
}

export default function CookingModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getRecipe } = useRecipes();
  const recipe = getRecipe(id);

  const [cur, setCur] = useState(0);
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [allSteps, setAllSteps] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useKeepAwake();

  const step = recipe?.steps[cur];
  const total = recipe?.steps.length ?? 0;

  // Find relevant ingredients for current step by matching ingredient names in instruction
  const stepIngredients: Ingredient[] = (recipe?.ingredients ?? []).filter(
    (ing) => step?.instruction?.includes(ing.name)
  ).slice(0, 3);

  useEffect(() => {
    if (ref.current) clearInterval(ref.current);
    ref.current = null;
    if (pulseRef.current) clearInterval(pulseRef.current);
    pulseRef.current = null;
    setRunning(false);
    setTimerDone(false);
    setSec(step?.timerSeconds ?? 0);
  }, [cur, step?.timerSeconds]);

  useEffect(() => {
    if (!running || sec <= 0) return;
    ref.current = setInterval(() => {
      setSec((p) => {
        if (p <= 1) {
          clearInterval(ref.current!);
          ref.current = null;
          setRunning(false);
          setTimerDone(true);
          // Vibrate 3 times on completion
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 500);
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 1000);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const nav = useCallback((d: number) => {
    const n = cur + d;
    if (n >= 0 && n < total) {
      setCur(n);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [cur, total]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!recipe || !step) {
    return <View style={st.root}><Text style={{ color: darkColors.text }}>레시피를 찾을 수 없어요</Text></View>;
  }

  if (allSteps) {
    return (
      <View style={st.root}>
        <StatusBar style="light" />
        <View style={[st.topBar, { paddingTop: insets.top + space.md }]}>
          <Text style={[typo.heading1, { color: colors.white }]}>전체 조리 순서</Text>
          <Pressable onPress={() => setAllSteps(false)} style={st.iconBtn}>
            <Ionicons name="close" size={18} color={colors.white} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.x5 }}>
          {recipe.steps.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => { setCur(i); setAllSteps(false); }}
              style={[st.allRow, i === cur && st.allRowActive]}
            >
              <View style={[st.allDot, i === cur && { backgroundColor: colors.orange }]}>
                <Text style={[st.allDotText, i === cur && { color: colors.white }]}>{i + 1}</Text>
              </View>
              <Text style={[st.allText, i === cur && { color: colors.white, fontWeight: "600" }]}>
                {s.instruction}{s.timerSeconds ? ` (${formatDuration(s.timerSeconds)})` : ""}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar style="light" />
      <View style={[st.topBar, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} style={st.iconBtn}>
          <Ionicons name="close" size={18} color={colors.white} />
        </Pressable>
        <Text style={[typo.body2Bold, { color: darkColors.text }]}>{recipe.title}</Text>
        <Pressable onPress={() => setAllSteps(true)} style={st.iconBtn}>
          <Ionicons name="list" size={18} color={colors.white} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={st.progRow}>
        <View style={st.progBg}>
          <View style={[st.progFill, { width: `${((cur + 1) / total) * 100}%` }]} />
        </View>
        <Text style={[typo.caption2, { color: darkColors.textDim }]}>{cur + 1} / {total}</Text>
      </View>

      {/* Step */}
      <View style={st.body}>
        <Text style={st.stepLabel}>STEP {cur + 1}</Text>

        {/* Ingredient pills for current step */}
        {stepIngredients.length > 0 && (
          <View style={st.ingPillRow}>
            {stepIngredients.map((ing) => (
              <View key={ing.name} style={st.ingPill}>
                <Text style={st.ingPillText}>{ing.name}</Text>
              </View>
            ))}
          </View>
        )}

        <StepText instruction={step.instruction} fontSize={24} dark />

        {step.timerSeconds != null && (
          <View style={st.timerCard}>
            <View style={st.timerLeft}>
              <View style={st.timerIcon}>
                <Ionicons name="time" size={18} color={colors.white} />
              </View>
              <View>
                <Text style={[st.timerVal, timerDone && { color: colors.green }]}>{fmt(sec)}</Text>
                <Text style={[typo.caption3, { color: darkColors.textDim }]}>이 단계 타이머</Text>
              </View>
            </View>
            <Pressable
              onPress={() => { if (sec > 0) { setRunning((r) => !r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } }}
              style={[st.timerBtn, sec === 0 && { backgroundColor: colors.green }, running && { backgroundColor: darkColors.border }]}
            >
              <Text style={[typo.body2Bold, { color: colors.white }]}>
                {sec === 0 ? "완료!" : running ? "정지" : "시작"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Step tip */}
        {step.tip && (
          <View style={st.tipCard}>
            <Ionicons name="bulb-outline" size={16} color={colors.yellow} />
            <Text style={st.tipText}>{step.tip}</Text>
          </View>
        )}
      </View>

      {/* Next */}
      {cur < total - 1 && (
        <View style={st.nextCard}>
          <Text style={st.nextLabel}>STEP {cur + 2} · 다음 단계</Text>
          <StepText instruction={recipe.steps[cur + 1].instruction} fontSize={15} dark />
        </View>
      )}

      <View style={[st.navRow, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable
          onPress={() => nav(-1)}
          style={[st.navBtn, st.navPrev, cur === 0 && { opacity: 0.3 }]}
          disabled={cur === 0}
        >
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.5)" />
          <Text style={[typo.body2Bold, { color: darkColors.text }]}>이전</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (cur === total - 1) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                `${recipe.emoji} 요리 완성!`,
                `"${recipe.title}" 맛있게 드세요!`,
                [{ text: "확인", onPress: () => router.back() }]
              );
            } else {
              nav(1);
            }
          }}
          style={[st.navBtn, st.navNext]}
        >
          <Text style={[typo.body2Bold, { color: colors.white }]}>{cur === total - 1 ? "완성!" : "다음"}</Text>
          {cur < total - 1 && <Ionicons name="chevron-forward" size={16} color={colors.white} />}
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: darkColors.bg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.gutter, paddingBottom: space.xl },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: darkColors.card, alignItems: "center", justifyContent: "center" },
  progRow: { flexDirection: "row", alignItems: "center", gap: space.lg, paddingHorizontal: space.gutter, paddingBottom: space.xxl },
  progBg: { flex: 1, height: 4, backgroundColor: darkColors.card, borderRadius: 2, overflow: "hidden" },
  progFill: { height: 4, backgroundColor: colors.orange, borderRadius: 2 },
  body: { flex: 1, paddingHorizontal: space.cardPad, paddingTop: space.xxxl },
  stepLabel: { ...typo.caption2, color: colors.orange, letterSpacing: 2, marginBottom: space.lg, fontWeight: "700" },
  ingPillRow: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginBottom: space.xl },
  ingPill: { backgroundColor: "rgba(249,115,22,0.15)", paddingHorizontal: space.lg, paddingVertical: space.xs, borderRadius: radius.full },
  ingPillText: { ...typo.caption2, color: colors.orange, fontWeight: "600" },
  tipCard: {
    flexDirection: "row",
    gap: space.md,
    backgroundColor: "rgba(245,158,11,0.12)",
    padding: space.xl,
    borderRadius: radius.lg,
    marginTop: space.xl,
    alignItems: "flex-start",
  },
  tipText: { ...typo.body2, color: "rgba(255,255,255,0.7)", flex: 1, lineHeight: 20 },
  stepInst: { fontSize: 24, fontWeight: "700", color: colors.white, lineHeight: 36 },
  timerCard: {
    backgroundColor: darkColors.card,
    borderRadius: radius.xl,
    padding: space.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.xxl,
  },
  timerLeft: { flexDirection: "row", alignItems: "center", gap: space.lg },
  timerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  timerVal: { fontSize: 28, fontWeight: "800", color: colors.white, letterSpacing: -1 },
  timerBtn: { backgroundColor: colors.orange, paddingHorizontal: space.xxl, paddingVertical: space.lg, borderRadius: radius.lg },
  nextCard: {
    marginHorizontal: space.cardPad,
    padding: space.xxl,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: radius.xl,
    marginBottom: space.lg,
  },
  nextLabel: { ...typo.caption2, color: "rgba(255,255,255,0.7)", letterSpacing: 1, marginBottom: space.md, textTransform: "uppercase", fontWeight: "700" },
  navRow: { flexDirection: "row", gap: space.lg, paddingHorizontal: space.cardPad, paddingTop: space.lg },
  navBtn: { flex: 1, height: 48, borderRadius: radius.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  navPrev: { backgroundColor: darkColors.card },
  navNext: { backgroundColor: colors.orange },
  // All steps
  allRow: { flexDirection: "row", gap: space.lg, paddingVertical: space.xl, borderBottomWidth: 0.5, borderBottomColor: darkColors.card },
  allRowActive: { backgroundColor: "rgba(249,115,22,0.08)", marginHorizontal: -space.gutter, paddingHorizontal: space.gutter, borderRadius: radius.lg, borderBottomWidth: 0 },
  allDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: darkColors.card, alignItems: "center", justifyContent: "center", marginTop: 2 },
  allDotText: { ...typo.caption2, color: darkColors.textDim, fontWeight: "700" },
  allText: { flex: 1, ...typo.body2, color: darkColors.textDim, lineHeight: 20 },
});
