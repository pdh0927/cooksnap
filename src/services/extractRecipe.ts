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

async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  // YouTube 페이지에서 자막 데이터 추출
  const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const resp = await fetch(pageUrl, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  const html = await resp.text();

  // 제목 추출
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "";

  // 설명란(description) 추출
  const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  const description = descMatch
    ? descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
    : "";

  // 자막 URL 추출 시도
  const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
  if (captionMatch) {
    const koUrl = captionMatch[1].match(/"baseUrl":"(.*?ko.*?)"/)?.[1];
    const anyUrl = captionMatch[1].match(/"baseUrl":"(.*?)"/)?.[1];
    const captionUrl = koUrl || anyUrl;

    if (captionUrl) {
      try {
        const cleanUrl = captionUrl.replace(/\\u0026/g, "&");
        const captionResp = await fetch(cleanUrl);
        const captionXml = await captionResp.text();
        const texts = captionXml.match(/<text[^>]*>(.*?)<\/text>/g);
        if (texts && texts.length > 0) {
          const transcript = texts
            .map((t) => t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
            .join(" ");
          return `제목: ${title}\n\n자막:\n${transcript}\n\n설명:\n${description}`;
        }
      } catch {
        // 자막 파싱 실패 시 설명란만 사용
      }
    }
  }

  // 자막이 없으면 설명란 사용
  if (description.length > 50) {
    return `제목: ${title}\n\n설명:\n${description}`;
  }

  return `제목: ${title}\n\n(자막과 설명을 가져올 수 없습니다. 제목을 기반으로 일반적인 레시피를 생성해주세요.)`;
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

const SYSTEM_PROMPT = `당신은 요리 레시피 전문가입니다. 주어진 콘텐츠에서 레시피 정보를 추출하여 정확한 JSON 형식으로 반환하세요.

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
    {"order": 1, "instruction": "조리 설명", "timerSeconds": 숫자 또는 null}
  ]
}

규칙:
- tags는 3~5개, 예: 가성비, 자취생, 매운맛, 다이어트, 초간단, 밥도둑, 브런치, 혼밥, 겨울, 여름 등
- amount가 "약간", "적당량"이면 amount=0, unit="약간", scalable=false
- timerSeconds는 조리 단계에 시간이 명시된 경우만 초 단위로 (예: 5분 → 300)
- 단위: g, ml, 큰술, 작은술, 컵, 개, 모, 대, 쪽 등
- 조리 순서는 구체적이고 실용적으로, 한국어로 작성
- 콘텐츠에서 레시피를 명확히 추출할 수 없으면 제목을 기반으로 일반적인 레시피를 생성`;

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
  onProgress({ step: "fetch", message: "페이지 내용 가져오는 중..." });

  const urlType = detectUrlType(url);
  let content: string;

  if (urlType === "youtube") {
    const videoId = extractYoutubeId(url);
    if (!videoId) throw new Error("유효한 YouTube URL이 아닙니다");
    content = await fetchYoutubeTranscript(videoId);
  } else {
    content = await fetchBlogContent(url);
  }

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
    })),
    sourceUrl: url,
    sourceType: urlType === "youtube" ? "youtube" : "blog",
    sourceLabel: urlType === "youtube" ? "YouTube" : new URL(url).hostname.replace("www.", ""),
    tags: parsed.tags || [],
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
    })),
    sourceUrl: null,
    sourceType: null,
    sourceLabel: "AI 생성",
    tags: parsed.tags || [],
    gradientColors: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
    createdAt: new Date().toISOString(),
  };

  return recipe;
}

// URL인지 요리명인지 판별
export function isUrl(input: string): boolean {
  return /^https?:\/\/.+\..+/.test(input.trim());
}
