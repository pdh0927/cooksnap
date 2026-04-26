// Design tokens — 커버링/토스 스타일
// 넉넉한 여백, 큰 라운딩, 그림자 없음, 배경색 대비

export const colors = {
  white: "#FFFFFF",
  gray50: "#F5F6F8",   // 앱 배경
  gray100: "#ECEDF0",
  gray200: "#E5E6EA",
  gray300: "#D5D7DC",
  gray400: "#B5B8BF",
  gray500: "#8E929A",
  gray600: "#6B7078",
  gray700: "#4A4F57",
  gray800: "#2D3137",
  gray900: "#1B1D21",

  accent: "#5B9BF5",    // 커버링 스타일 소프트 블루
  accentLight: "#EBF2FE",
  accentDark: "#3A7FE8",
  orange: "#F97316",

  green: "#34C759",
  red: "#FF3B30",

  textPrimary: "#1B1D21",
  textSecondary: "#6B7078",
  textTertiary: "#8E929A",
  textDisabled: "#B5B8BF",
  bgPrimary: "#FFFFFF",
  bgPage: "#F5F6F8",
  divider: "#ECEDF0",
};

export const typo = {
  screenTitle: { fontSize: 22, lineHeight: 30, fontWeight: "700" as const },
  heading1: { fontSize: 20, lineHeight: 28, fontWeight: "700" as const },
  heading2: { fontSize: 18, lineHeight: 25, fontWeight: "700" as const },
  heading3: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  body1: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  body1Bold: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
  body2: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  body2Bold: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption1: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption2: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  caption3: { fontSize: 11, lineHeight: 15, fontWeight: "400" as const },
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  x4: 32,
  x5: 40,
  gutter: 20,       // 커버링 스타일 넉넉한 좌우 패딩
  cardPad: 24,      // 카드 내부 패딩
  cardGap: 12,      // 카드 사이 간격
  sectionGap: 28,   // 섹션 간 간격
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const size = {
  thumb: 64,       // 레시피 리스트 썸네일
  thumbEmoji: 36,  // 썸네일 내 이모지 크기
  heroEmoji: 72,   // 상세 히어로 이모지
};

export const darkColors = {
  bg: "#0C0C0E",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  text: "rgba(255,255,255,0.65)",
  textDim: "rgba(255,255,255,0.35)",
  textFaint: "rgba(255,255,255,0.2)",
};
