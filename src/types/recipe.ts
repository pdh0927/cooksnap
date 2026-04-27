export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  scalable: boolean; // false for "약간", "적당량" etc.
}

export interface StepHighlight {
  text: string;
  type: "fire" | "time" | "cut" | "temp";
}

export interface StepDetails {
  tip: string | null;
  warning: string | null;
  highlights: StepHighlight[];
  ingredientRefs: number[];
  imageUrl?: string | null;
}

export interface Step {
  order: number;
  instruction: string;
  timerSeconds: number | null;
  tip: string | null;      // backward compat (from details.tip)
  details: StepDetails;
}

export type Category = "한식" | "중식" | "일식" | "양식" | "디저트" | "간편식";
export type Difficulty = "쉬움" | "보통" | "어려움";

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  category: Category;
  difficulty: Difficulty;
  cookTimeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
  sourceUrl: string | null;
  sourceType: "youtube" | "blog" | "manual" | "photo" | null;
  sourceLabel: string | null;
  tags: string[];
  tips: string[];
  warnings: string[];
  gradientColors: [string, string];
  isFavorite: boolean;
  createdAt: string;
}
