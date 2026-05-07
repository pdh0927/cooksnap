import { View, Text, StyleSheet } from "react-native";
import { colors, darkColors, space, radius } from "../theme";

/* ------------------------------------------------------------------ */
/*  Badge category definitions                                        */
/* ------------------------------------------------------------------ */

type BadgeKind = "fire" | "time" | "cut" | "temp" | "done";

interface BadgeStyle {
  bg: string;
  bgDark: string;
  fg: string;
  fgDark: string;
  icon: string;
}

const badgeStyles: Record<BadgeKind, BadgeStyle> = {
  fire: {
    bg: colors.orangeLight,
    bgDark: "rgba(249,115,22,0.18)",
    fg: colors.orange,
    fgDark: darkColors.orangeTint,
    icon: "\uD83D\uDD25", // fire emoji
  },
  time: {
    bg: colors.accentLight,
    bgDark: "rgba(49,130,246,0.18)",
    fg: colors.accent,
    fgDark: darkColors.blueTint,
    icon: "\u23F1", // stopwatch
  },
  cut: {
    bg: colors.greenLight,
    bgDark: "rgba(3,178,108,0.18)",
    fg: colors.green,
    fgDark: darkColors.greenTint,
    icon: "\uD83D\uDD2A", // knife
  },
  temp: {
    bg: colors.violetLight,
    bgDark: "rgba(171,71,188,0.18)",
    fg: colors.violet,
    fgDark: darkColors.violetTint,
    icon: "\uD83C\uDF21", // thermometer
  },
  done: {
    bg: colors.gray100,
    bgDark: "rgba(255,255,255,0.06)",
    fg: colors.gray600,
    fgDark: "rgba(255,255,255,0.45)",
    icon: "",
  },
};

/* ------------------------------------------------------------------ */
/*  Regex patterns — ordered by specificity (longer matches first)    */
/* ------------------------------------------------------------------ */

interface PatternDef {
  kind: BadgeKind;
  re: RegExp;
}

const patterns: PatternDef[] = [
  // Temperature: 180도, 200도 예열, etc. — require digit before 도 to avoid "각도", "정도"
  { kind: "temp", re: /\d+\s*도(?:\s*예열)?(?=\s|,|$|[을를으로에서])/ },
  { kind: "temp", re: /예열/ },
  // Fire level
  { kind: "fire", re: /(?:약불|중불|센불|강불|중약불|중강불)/ },
  // Time: 5분, 30초, 1시간, 1~2분, 10-15분 etc. — use word boundary after unit to avoid partial matches
  { kind: "time", re: /\d+(?:\s*[~\-]\s*\d+)?\s*(?:분|초|시간)(?:\s*(?:정도|간|동안))?(?=\s|,|$|[을를으로에서])/ },
  // Cut size: 2cm, 1.5cm, etc.
  { kind: "cut", re: /\d+(?:\.\d+)?\s*cm/ },
  // Cut techniques
  { kind: "cut", re: /(?:깍둑썰기|깍둑썰어|송송|어슷|채썰기|채썰어|다지기|다져|편썰기|편썰어|잘게\s*썰어|잘게\s*썰기|한입\s*크기)/ },
  // Done signals: ~때까지, ~되면, ~나면, ~날때까지 — require Korean preceding chars only
  { kind: "done", re: /[\uAC00-\uD7A3]{1,8}(?:때까지|되면|나면|날\s*때)/ },
];

/* ------------------------------------------------------------------ */
/*  Text segment types                                                */
/* ------------------------------------------------------------------ */

interface PlainSegment {
  type: "plain";
  text: string;
}

interface BadgeSegment {
  type: "badge";
  text: string;
  kind: BadgeKind;
}

type Segment = PlainSegment | BadgeSegment;

/* ------------------------------------------------------------------ */
/*  Parser: split instruction text into segments                      */
/* ------------------------------------------------------------------ */

function parseInstruction(text: string): Segment[] {
  // Build a combined regex from all patterns
  const combined = new RegExp(
    patterns.map((p) => `(${p.re.source})`).join("|"),
    "g",
  );

  const segments: Segment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = combined.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      segments.push({ type: "plain", text: text.slice(lastIndex, match.index) });
    }

    // Determine which pattern group matched
    const matched = match[0];
    let kind: BadgeKind = "done"; // fallback
    for (let i = 1; i <= patterns.length; i++) {
      if (match[i] != null) {
        kind = patterns[i - 1].kind;
        break;
      }
    }

    segments.push({ type: "badge", text: matched, kind });
    lastIndex = match.index + matched.length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    segments.push({ type: "plain", text: text.slice(lastIndex) });
  }

  return segments;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface StepTextProps {
  instruction: string;
  fontSize: number;
  dark?: boolean;
}

export default function StepText({ instruction, fontSize, dark = false }: StepTextProps) {
  const segments = parseInstruction(instruction);
  const lineHeight = Math.round(fontSize * 1.5);
  const badgeFontSize = fontSize - 1;

  return (
    <View style={s.container}>
      {segments.map((seg, i) => {
        if (seg.type === "plain") {
          return (
            <Text
              key={i}
              style={{
                fontSize,
                lineHeight,
                color: dark ? colors.white : colors.textPrimary,
                fontWeight: dark ? "700" : "400",
              }}
            >
              {seg.text}
            </Text>
          );
        }

        const bs = badgeStyles[seg.kind];

        if (seg.kind === "done") {
          // Done signals render as subtle italic text, not a pill
          return (
            <Text
              key={i}
              style={{
                fontSize,
                lineHeight,
                color: dark ? bs.fgDark : bs.fg,
                fontStyle: "italic",
                fontWeight: dark ? "700" : "500",
              }}
            >
              {seg.text}
            </Text>
          );
        }

        return (
          <View
            key={i}
            style={[
              s.badge,
              {
                backgroundColor: dark ? bs.bgDark : bs.bg,
                paddingHorizontal: space.sm,
                paddingVertical: space.xxs,
                borderRadius: radius.xs,
                // Vertically center badge inline with text
                marginVertical: space.xxs,
              },
            ]}
          >
            {bs.icon ? (
              <Text style={{ fontSize: badgeFontSize - 2, lineHeight: badgeFontSize }}>
                {bs.icon}
              </Text>
            ) : null}
            <Text
              style={{
                fontSize: badgeFontSize,
                lineHeight: Math.round(badgeFontSize * 1.4),
                fontWeight: "600",
                color: dark ? bs.fgDark : bs.fg,
              }}
            >
              {seg.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
  },
});
