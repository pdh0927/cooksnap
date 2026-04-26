import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { useRecipes } from "../../../src/store/recipeStore";
import { colors, typo, space, radius } from "../../../src/theme";

const BG = "#0C0C0E";
const CARD = "rgba(255,255,255,0.06)";

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
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useKeepAwake();

  const step = recipe?.steps[cur];
  const total = recipe?.steps.length ?? 0;

  useEffect(() => {
    if (ref.current) clearInterval(ref.current);
    ref.current = null;
    setRunning(false);
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    return <View style={st.root}><Text style={{ color: "rgba(255,255,255,0.4)" }}>레시피를 찾을 수 없어요</Text></View>;
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
              <View style={[st.allDot, i === cur && { backgroundColor: colors.accent }]}>
                <Text style={[st.allDotText, i === cur && { color: colors.white }]}>{i + 1}</Text>
              </View>
              <Text style={[st.allText, i === cur && { color: colors.white, fontWeight: "600" }]}>
                {s.instruction}{s.timerSeconds ? ` (${Math.floor(s.timerSeconds / 60)}분)` : ""}
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
        <Text style={[typo.body2Bold, { color: "rgba(255,255,255,0.5)" }]}>{recipe.title}</Text>
        <Pressable onPress={() => setAllSteps(true)} style={st.iconBtn}>
          <Ionicons name="list" size={18} color={colors.white} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={st.progRow}>
        <View style={st.progBg}>
          <View style={[st.progFill, { width: `${((cur + 1) / total) * 100}%` }]} />
        </View>
        <Text style={[typo.caption2, { color: "rgba(255,255,255,0.35)" }]}>{cur + 1} / {total}</Text>
      </View>

      {/* Step */}
      <View style={st.body}>
        <Text style={st.stepLabel}>STEP {cur + 1}</Text>
        <Text style={st.stepInst}>{step.instruction}</Text>

        {step.timerSeconds != null && (
          <View style={st.timerCard}>
            <View style={st.timerLeft}>
              <View style={st.timerIcon}>
                <Ionicons name="time" size={18} color={colors.white} />
              </View>
              <View>
                <Text style={st.timerVal}>{fmt(sec)}</Text>
                <Text style={[typo.caption3, { color: "rgba(255,255,255,0.35)" }]}>이 단계 타이머</Text>
              </View>
            </View>
            <Pressable
              onPress={() => { if (sec > 0) { setRunning((r) => !r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } }}
              style={[st.timerBtn, sec === 0 && { backgroundColor: colors.green }, running && { backgroundColor: "rgba(255,255,255,0.12)" }]}
            >
              <Text style={[typo.body2Bold, { color: colors.white }]}>
                {sec === 0 ? "완료!" : running ? "정지" : "시작"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Next */}
      {cur < total - 1 && (
        <View style={st.nextCard}>
          <Text style={st.nextLabel}>다음 단계</Text>
          <Text style={[typo.body2, { color: "rgba(255,255,255,0.4)", lineHeight: 20 }]}>
            {recipe.steps[cur + 1].instruction}
          </Text>
        </View>
      )}

      <View style={st.voiceRow}>
        <Ionicons name="mic-outline" size={13} color="rgba(255,255,255,0.18)" />
        <Text style={[typo.caption3, { color: "rgba(255,255,255,0.18)" }]}>"다음"이라고 말하면 다음 단계로 넘어가요</Text>
      </View>

      <View style={[st.navRow, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable
          onPress={() => nav(-1)}
          style={[st.navBtn, st.navPrev, cur === 0 && { opacity: 0.3 }]}
          disabled={cur === 0}
        >
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.5)" />
          <Text style={[typo.body2Bold, { color: "rgba(255,255,255,0.5)" }]}>이전</Text>
        </Pressable>
        <Pressable
          onPress={() => cur === total - 1 ? router.back() : nav(1)}
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
  root: { flex: 1, backgroundColor: BG },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.gutter, paddingBottom: space.xl },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: CARD, alignItems: "center", justifyContent: "center" },
  progRow: { flexDirection: "row", alignItems: "center", gap: space.lg, paddingHorizontal: space.gutter, paddingBottom: space.xxl },
  progBg: { flex: 1, height: 3, backgroundColor: CARD, borderRadius: 2, overflow: "hidden" },
  progFill: { height: 3, backgroundColor: colors.accent, borderRadius: 2 },
  body: { flex: 1, paddingHorizontal: space.cardPad, justifyContent: "center" },
  stepLabel: { ...typo.caption2, color: colors.accent, letterSpacing: 2, marginBottom: space.xl, fontWeight: "700" },
  stepInst: { fontSize: 24, fontWeight: "700", color: colors.white, lineHeight: 36 },
  timerCard: {
    backgroundColor: CARD,
    borderRadius: radius.xl,
    padding: space.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.xxxl,
  },
  timerLeft: { flexDirection: "row", alignItems: "center", gap: space.lg },
  timerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  timerVal: { fontSize: 28, fontWeight: "800", color: colors.white, letterSpacing: -1 },
  timerBtn: { backgroundColor: colors.accent, paddingHorizontal: space.xxl, paddingVertical: space.lg, borderRadius: radius.md },
  nextCard: {
    marginHorizontal: space.cardPad,
    padding: space.xxl,
    backgroundColor: CARD,
    borderRadius: radius.xl,
    marginBottom: space.xl,
  },
  nextLabel: { ...typo.caption3, color: "rgba(255,255,255,0.25)", letterSpacing: 1, marginBottom: space.md, textTransform: "uppercase", fontWeight: "700" },
  voiceRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs, paddingBottom: space.md },
  navRow: { flexDirection: "row", gap: space.lg, paddingHorizontal: space.cardPad, paddingTop: space.lg },
  navBtn: { flex: 1, height: 52, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  navPrev: { backgroundColor: CARD },
  navNext: { backgroundColor: colors.accent },
  // All steps
  allRow: { flexDirection: "row", gap: space.lg, paddingVertical: space.xl, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.06)" },
  allRowActive: { backgroundColor: "rgba(91,155,245,0.08)", marginHorizontal: -space.gutter, paddingHorizontal: space.gutter, borderRadius: radius.lg, borderBottomWidth: 0 },
  allDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: CARD, alignItems: "center", justifyContent: "center", marginTop: 2 },
  allDotText: { ...typo.caption2, color: "rgba(255,255,255,0.35)", fontWeight: "700" },
  allText: { flex: 1, ...typo.body2, color: "rgba(255,255,255,0.35)", lineHeight: 20 },
});
