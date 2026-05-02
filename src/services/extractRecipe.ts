import { Recipe, Category, Difficulty } from "../types/recipe";

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";

const GRADIENTS: [string, string][] = [
  ["#DC2626", "#F97316"],
  ["#F59E0B", "#EF4444"],
  ["#10B981", "#3B82F6"],
  ["#7C3AED", "#EC4899"],
  ["#0EA5E9", "#6366F1"],
  ["#F97316", "#FBBF24"],
  ["#EF4444", "#F97316"],
  ["#8B5CF6", "#3B82F6"],
];

// ============================================================
// 1) URL에서 텍스트 콘텐츠 추출
// ============================================================

function detectUrlType(url: string): "youtube" | "blog" {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "blog";
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
    /youtube\.com\/embed\/([\w-]+)/,
    /youtube\.com\/shorts\/([\w-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

async function fetchYoutubeContent(url: string): Promise<string> {
  // 백엔드 API 서버에서 yt-dlp로 추출
  const resp = await fetch(
    `${API_BASE}/api/youtube?url=${encodeURIComponent(url)}`
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "서버 오류" }));
    throw new Error(err.error || "YouTube 영상 정보를 가져올 수 없습니다");
  }

  const data = await resp.json();
  const { title, description, transcript } = data;

  const parts: string[] = [];
  parts.push(`YouTube 요리 영상 제목: ${title}`);

  if (transcript && transcript.length > 50) {
    parts.push(`\n영상 자막:\n${transcript}`);
  }

  if (description && description.length > 30) {
    parts.push(`\n영상 설명:\n${description}`);
  }

  parts.push(
    `\n위 영상의 내용을 기반으로 레시피를 정확하게 추출해주세요. 설명이나 자막에 재료와 조리법이 있으면 그대로 사용하세요.`
  );

  return parts.join("\n");
}

async function fetchBlogContent(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  const html = await resp.text();

  // 제목 추출
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // schema.org Recipe JSON-LD 추출 시도
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      const json = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
      try {
        const data = JSON.parse(json);
        const recipe = Array.isArray(data) ? data.find((d: any) => d["@type"] === "Recipe") : data["@type"] === "Recipe" ? data : null;
        if (recipe) {
          return `제목: ${recipe.name || title}\n\nSchema.org Recipe 데이터:\n${JSON.stringify(recipe, null, 2)}`;
        }
      } catch {}
    }
  }

  // HTML에서 텍스트만 추출 (태그 제거)
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 너무 길면 잘라냄 (토큰 절약)
  if (text.length > 8000) text = text.slice(0, 8000);

  return `제목: ${title}\n\n본문:\n${text}`;
}

// ============================================================
// 2) Claude API로 레시피 구조화
// ============================================================

const SYSTEM_PROMPT = `당신은 10년 경력 한식/양식 셰프입니다. 주어진 콘텐츠에서 레시피를 추출하여 JSON으로 반환하세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "title": "레시피 이름",
  "emoji": "음식을 대표하는 이모지 1개",
  "category": "한식|중식|일식|양식|디저트|간편식 중 하나",
  "difficulty": "쉬움|보통|어려움 중 하나",
  "cookTimeMinutes": 숫자,
  "servings": 숫자,
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "ingredients": [
    {"name": "재료명", "amount": 숫자, "unit": "단위", "scalable": true/false}
  ],
  "steps": [
    {
      "order": 1,
      "instruction": "조리 설명",
      "timerSeconds": 숫자 또는 null,
      "details": {
        "tip": "이 단계 꿀팁 또는 null",
        "warning": "이 단계 주의사항 또는 null",
        "highlights": [
          {"text": "중불", "type": "fire"},
          {"text": "3분", "type": "time"},
          {"text": "2cm 깍둑썰기", "type": "cut"},
          {"text": "180도", "type": "temp"}
        ],
        "ingredientRefs": [0, 1]
      }
    }
  ],
  "tips": ["전체 요리 꿀팁1", "꿀팁2"],
  "warnings": ["주의사항1", "주의사항2"]
}

## 단계 쪼개기 규칙 (가장 중요!)
- **한 단계에 타이머는 반드시 1개만!**
- 하나의 동작에 시간이 2개 이상 필요하면 별도 단계로 분리하세요
  - BAD: "면을 8분 삶는 동안 소스를 5분 졸여주세요" (타이머 2개)
  - GOOD: 단계1 "면을 8분 삶아주세요" (타이머 480초) → 단계2 "면을 삶는 동안 소스를 5분 졸여주세요" (타이머 300초)
- 한 단계에는 하나의 핵심 동작만 넣으세요

## 조리 순서 작성 규칙
- 요리 초보가 바로 따라할 수 있게 구체적으로
- 불 세기 반드시 명시: "중불", "약불", "센불"
- 썰기 크기/모양 명시: "2cm 깍둑썰기", "송송 0.5cm", "어슷썰기"
- 완성 판단 기준: "양파가 투명해지면", "국물이 반으로 줄면"
- 온도: "180도 예열", "팔팔 끓는 물"
- 소스에 디테일 있으면 그대로 살리고, 없으면 셰프 지식으로 보충

## details 필드 규칙
- highlights: instruction 텍스트에서 강조할 키워드를 추출
  - type "fire": 불 세기 (약불, 중불, 센불, 중약불 등)
  - type "time": 시간 (3분, 30초, 1시간 등)
  - type "cut": 썰기 방법/크기 (2cm, 깍둑썰기, 송송, 채썰기, 한입 크기 등)
  - type "temp": 온도 (180도, 예열 등)
- ingredientRefs: 이 단계에서 사용하는 재료의 ingredients 배열 인덱스 (0부터 시작)
- tip: 해당 단계의 셰프 노하우 (없으면 null)
- warning: 해당 단계의 주의사항 (없으면 null)

## 기타 규칙
- tags 3~5개
- amount "약간"이면 amount=0, unit="약간", scalable=false
- timerSeconds: 시간 있을 때만 초 단위
- tips: 전체 꿀팁 2~3개
- warnings: 전체 주의사항 1~2개
- 단위: g, ml, 큰술, 작은술, 컵, 개, 모, 대, 쪽 등
- 콘텐츠에서 추출 불가하면 제목 기반으로 정확한 레시피 생성`;

async function callAI(content: string): Promise<string> {
  if (!API_KEY) throw new Error("API 키가 설정되지 않았습니다");

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `다음 콘텐츠에서 레시피를 추출해주세요:\n\n${content}` },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API 오류 (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}

// ============================================================
// 3) 메인 추출 함수
// ============================================================

export type ExtractStep = "fetch" | "extract" | "structure" | "done";

export interface ExtractProgress {
  step: ExtractStep;
  message: string;
}

export async function extractRecipeFromUrl(
  url: string,
  onProgress: (p: ExtractProgress) => void
): Promise<Recipe> {
  // Step 1: 콘텐츠 가져오기
  console.log("[CookSnap] extractRecipeFromUrl 호출:", url);
  onProgress({ step: "fetch", message: "페이지 내용 가져오는 중..." });

  const urlType = detectUrlType(url);
  let content: string;

  if (urlType === "youtube") {
    console.log("[CookSnap] YouTube 추출 시작");
    content = await fetchYoutubeContent(url);
  } else {
    console.log("[CookSnap] 블로그 추출 시작");
    content = await fetchBlogContent(url);
  }
  console.log("[CookSnap] 추출된 콘텐츠:", content.slice(0, 200));

  // Step 2: AI 추출
  onProgress({ step: "extract", message: "재료 목록 추출 중..." });

  const jsonText = await callAI(content);

  // Step 3: 구조화
  onProgress({ step: "structure", message: "조리 순서 정리 중..." });

  // JSON 파싱 (코드블럭 제거)
  const cleaned = jsonText.replace(/```json\n?|```\n?/g, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // 부분 JSON 추출 시도
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("AI 응답을 파싱할 수 없습니다");
    }
  }

  // Step 4: Recipe 객체로 변환
  onProgress({ step: "done", message: "레시피 완성!" });

  const recipe: Recipe = {
    id: Date.now().toString(),
    title: parsed.title || "새 레시피",
    emoji: parsed.emoji || "🍽️",
    category: (parsed.category as Category) || "한식",
    difficulty: (parsed.difficulty as Difficulty) || "보통",
    cookTimeMinutes: parsed.cookTimeMinutes || 30,
    servings: parsed.servings || 2,
    ingredients: (parsed.ingredients || []).map((ing: any) => ({
      name: ing.name || "",
      amount: typeof ing.amount === "number" ? ing.amount : 0,
      unit: ing.unit || "개",
      scalable: ing.scalable !== false,
    })),
    steps: (parsed.steps || []).map((step: any, i: number) => ({
      order: step.order || i + 1,
      instruction: step.instruction || "",
      timerSeconds: step.timerSeconds || null,
      tip: step.details?.tip || step.tip || null,
      details: {
        tip: step.details?.tip || step.tip || null,
        warning: step.details?.warning || null,
        highlights: Array.isArray(step.details?.highlights) ? step.details.highlights : [],
        ingredientRefs: Array.isArray(step.details?.ingredientRefs) ? step.details.ingredientRefs : [],
      },
    })),
    thumbnailUrl: null,
    sourceUrl: url,
    sourceType: urlType === "youtube" ? "youtube" : "blog",
    sourceLabel: urlType === "youtube" ? "YouTube" : new URL(url).hostname.replace("www.", ""),
    tags: parsed.tags || [],
    tips: parsed.tips || [],
    warnings: parsed.warnings || [],
    isFavorite: false,
    gradientColors: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
    createdAt: new Date().toISOString(),
  };

  return recipe;
}

// ============================================================
// 4) 요리명으로 레시피 생성
// ============================================================

export async function generateRecipeFromName(
  dishName: string,
  onProgress: (p: ExtractProgress) => void
): Promise<Recipe> {
  onProgress({ step: "fetch", message: "레시피 검색 중..." });

  // 바로 AI에게 요리명으로 레시피 생성 요청
  onProgress({ step: "extract", message: "레시피 만드는 중..." });

  const jsonText = await callAI(
    `"${dishName}" 레시피를 만들어주세요. 한국에서 일반적으로 만드는 방식으로, 정확한 계량과 실용적인 조리 순서로 작성해주세요.`
  );

  onProgress({ step: "structure", message: "조리 순서 정리 중..." });

  const cleaned = jsonText.replace(/```json\n?|```\n?/g, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("AI 응답을 파싱할 수 없습니다");
    }
  }

  onProgress({ step: "done", message: "레시피 완성!" });

  const recipe: Recipe = {
    id: Date.now().toString(),
    title: parsed.title || dishName,
    emoji: parsed.emoji || "🍽️",
    category: (parsed.category as Category) || "한식",
    difficulty: (parsed.difficulty as Difficulty) || "보통",
    cookTimeMinutes: parsed.cookTimeMinutes || 30,
    servings: parsed.servings || 2,
    ingredients: (parsed.ingredients || []).map((ing: any) => ({
      name: ing.name || "",
      amount: typeof ing.amount === "number" ? ing.amount : 0,
      unit: ing.unit || "개",
      scalable: ing.scalable !== false,
    })),
    steps: (parsed.steps || []).map((step: any, i: number) => ({
      order: step.order || i + 1,
      instruction: step.instruction || "",
      timerSeconds: step.timerSeconds || null,
      tip: step.details?.tip || step.tip || null,
      details: {
        tip: step.details?.tip || step.tip || null,
        warning: step.details?.warning || null,
        highlights: Array.isArray(step.details?.highlights) ? step.details.highlights : [],
        ingredientRefs: Array.isArray(step.details?.ingredientRefs) ? step.details.ingredientRefs : [],
      },
    })),
    thumbnailUrl: null,
    sourceUrl: null,
    sourceType: null,
    sourceLabel: "AI 생성",
    tags: parsed.tags || [],
    tips: parsed.tips || [],
    warnings: parsed.warnings || [],
    isFavorite: false,
    gradientColors: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
    createdAt: new Date().toISOString(),
  };

  return recipe;
}

// URL인지 요리명인지 판별
export function isUrl(input: string): boolean {
  return /^https?:\/\/.+\..+/.test(input.trim());
}
