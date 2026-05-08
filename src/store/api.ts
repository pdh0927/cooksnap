import type { Recipe } from "../types/recipe";
import type { ShoppingItem } from "./shoppingStore";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

const USER_FRIENDLY_ERRORS: Record<number, string> = {
  400: "잘못된 요청입니다. 입력 내용을 확인해주세요.",
  401: "인증이 필요합니다. 다시 로그인해주세요.",
  403: "접근 권한이 없습니다.",
  404: "요청한 데이터를 찾을 수 없습니다.",
  409: "데이터 충돌이 발생했습니다. 다시 시도해주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  502: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
  503: "서비스 점검 중입니다. 잠시 후 다시 시도해주세요.",
};

function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path: string, options?: RequestInit) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const resp = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        ...options,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        // Retry on transient server errors
        if (attempt < MAX_RETRIES && isRetryable(resp.status)) {
          lastError = new Error(USER_FRIENDLY_ERRORS[resp.status] || `HTTP ${resp.status}`);
          continue;
        }
        const friendlyMsg = USER_FRIENDLY_ERRORS[resp.status];
        if (friendlyMsg) {
          throw new Error(friendlyMsg);
        }
        const err = await resp.json().catch(() => ({ error: "요청 실패" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      // Some endpoints (DELETE) may return empty body
      const text = await resp.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === "AbortError") {
        lastError = new Error("서버 응답이 너무 느립니다. 네트워크 연결을 확인해주세요.");
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }
      if (e instanceof TypeError && e.message === "Network request failed") {
        lastError = new Error("네트워크에 연결할 수 없습니다. Wi-Fi 또는 데이터를 확인해주세요.");
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }
      throw e;
    }
  }

  throw lastError || new Error("요청 실패");
}

export const api = {
  // Recipes
  getRecipes: () => request("/api/recipes"),
  getRecipe: (id: string) => request(`/api/recipes/${id}`),
  createRecipe: (data: Recipe) => request("/api/recipes", { method: "POST", body: JSON.stringify(data) }),
  updateRecipe: (id: string, data: Partial<Recipe>) => request(`/api/recipes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRecipe: (id: string) => request(`/api/recipes/${id}`, { method: "DELETE" }),
  toggleFavorite: (id: string) => request(`/api/recipes/${id}/favorite`, { method: "POST" }),

  // Folders
  getFolders: () => request("/api/folders"),
  createFolder: (name: string, emoji: string) => request("/api/folders", { method: "POST", body: JSON.stringify({ name, emoji }) }),
  updateFolder: (id: string, name: string, emoji: string) => request(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify({ name, emoji }) }),
  deleteFolder: (id: string) => request(`/api/folders/${id}`, { method: "DELETE" }),
  addRecipeToFolder: (folderId: string, recipeId: string) => request(`/api/folders/${folderId}/recipes/${recipeId}`, { method: "POST" }),
  removeRecipeFromFolder: (folderId: string, recipeId: string) => request(`/api/folders/${folderId}/recipes/${recipeId}`, { method: "DELETE" }),

  // Shopping
  getShoppingItems: () => request("/api/shopping"),
  addShoppingItems: (items: Omit<ShoppingItem, "id" | "checked">[]) => request("/api/shopping", { method: "POST", body: JSON.stringify({ items }) }),
  toggleShoppingItem: (id: string) => request(`/api/shopping/${id}/toggle`, { method: "PATCH" }),
  deleteShoppingItem: (id: string) => request(`/api/shopping/${id}`, { method: "DELETE" }),
  clearCheckedItems: () => request("/api/shopping/checked", { method: "DELETE" }),
  clearAllItems: () => request("/api/shopping", { method: "DELETE" }),
};
