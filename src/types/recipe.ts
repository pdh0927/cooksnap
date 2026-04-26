export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  scalable: boolean; // false for "약간", "적당량" etc.
}

export interface Step {
  order: number;
  instruction: string;
  timerSeconds: number | null;
  tip: string | null;
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
  createdAt: string;
}
