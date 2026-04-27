// Design tokens — 토스/커버링 스타일
// 넉넉한 여백, 큰 라운딩, 그림자 없음, 배경색 대비

export const colors = {
  // Backgrounds
  white: "#FFFFFF",
  bgPrimary: "#FFFFFF",      // cards, surfaces
  bgPage: "#F4F5F7",         // page background (slightly cooler gray)

  // Text hierarchy (Toss style - very clear contrast)
  textPrimary: "#191F28",    // titles, headings
  textSecondary: "#4E5968",  // body text
  textTertiary: "#8B95A1",   // captions, meta
  textDisabled: "#B0B8C1",   // placeholder, disabled

  // Borders & Dividers
  divider: "#E5E8EB",        // 0.5px dividers
  border: "#D1D6DB",         // input borders

  // Brand
  accent: "#3182F6",         // Toss blue (primary action)
  accentLight: "#EBF3FE",    // light blue bg
  accentDark: "#1B64DA",

  // Secondary accent (warm, for food-related actions)
  orange: "#F97316",
  orangeLight: "#FFF7ED",

  // Semantic
  red: "#F04452",
  redLight: "#FFF0F1",
  green: "#03B26C",
  greenLight: "#E8FAF0",
  yellow: "#F59E0B",
  yellowLight: "#FFFBEB",
  purple: "#8B5CF6",
  purpleLight: "#F3EEFF",
  pink: "#EC4899",
  pinkLight: "#FDF2F8",

  // Grays (Toss scale)
  gray50: "#F9FAFB",
  gray100: "#F2F4F6",
  gray200: "#E5E8EB",
  gray300: "#D1D6DB",
  gray400: "#B0B8C1",
  gray500: "#8B95A1",
  gray600: "#6B7684",
  gray700: "#4E5968",
  gray800: "#333D4B",
  gray900: "#191F28",
};

// Typography - match Toss's clean hierarchy
export const typo = {
  screenTitle: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.4 },
  heading1: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const, letterSpacing: -0.4 },
  heading2: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const, letterSpacing: -0.3 },
  heading3: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const, letterSpacing: -0.2 },
  body1: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  body1Bold: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
  body2: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  body2Bold: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption1: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption2: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  caption3: { fontSize: 11, lineHeight: 14, fontWeight: "400" as const },
};

// Spacing - strict 4px grid
export const space = {
  xxs: 2, xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, xxxl: 24, x4: 32, x5: 40, x6: 48,
  gutter: 20,      // screen horizontal padding
  cardPad: 20,     // card internal padding
  cardGap: 10,     // gap between cards
  sectionGap: 28,  // gap between sections
};

// Border radius
export const radius = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, full: 9999,
};

// Sizes
export const size = {
  thumb: 56,       // recipe list thumbnail (slightly smaller, cleaner)
  thumbEmoji: 28,  // emoji inside thumbnail
  heroEmoji: 64,   // detail hero emoji
};

// Dark mode tokens (cooking mode)
export const darkColors = {
  bg: "#0C0C0E",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  text: "rgba(255,255,255,0.65)",
  textDim: "rgba(255,255,255,0.35)",
  textFaint: "rgba(255,255,255,0.2)",
};
