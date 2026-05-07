import { useState, useEffect, useCallback } from "react";
import { Recipe } from "../types/recipe";
import { api } from "./api";
import { _removeRecipeFromAllFolders } from "./folderStore";

let recipesCache: Recipe[] | null = null;
let listeners: Set<() => void> = new Set();
/** Track in-flight addRecipe IDs to prevent duplicates from rapid calls */
const pendingAddIds: Set<string> = new Set();

/** Validate that data looks like a Recipe array; returns safe array */
function validateRecipes(data: unknown): Recipe[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (r: any) => r && typeof r === "object" && typeof r.id === "string" && typeof r.title === "string"
  ) as Recipe[];
}

/** Validate a single recipe from API response */
function validateRecipe(data: unknown): Recipe | null {
  if (!data || typeof data !== "object") return null;
  const r = data as any;
  if (typeof r.id !== "string" || typeof r.title !== "string") return null;
  return r as Recipe;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(recipesCache ?? []);
  const [loading, setLoading] = useState(recipesCache === null);

  useEffect(() => {
    const listener = () => setRecipes([...(recipesCache ?? [])]);
    listeners.add(listener);

    if (recipesCache === null) {
      api.getRecipes()
        .then((data: unknown) => {
          const validated = validateRecipes(data);
          recipesCache = validated;
          setRecipes(validated);
          setLoading(false);
        })
        .catch(() => {
          recipesCache = [];
          setRecipes([]);
          setLoading(false);
        });
    } else {
      setRecipes(recipesCache);
      setLoading(false);
    }

    return () => { listeners.delete(listener); };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getRecipes();
      recipesCache = validateRecipes(data);
      notifyListeners();
    } catch (err) {
      // Re-throw so callers can handle (e.g. show error UI)
      throw err;
    }
  }, []);

  const addRecipe = useCallback(async (recipe: Recipe): Promise<Recipe> => {
    // Guard against duplicate rapid calls using the recipe's client-side ID
    if (pendingAddIds.has(recipe.id)) {
      throw new Error("이미 저장 중입니다. 잠시 기다려주세요.");
    }
    pendingAddIds.add(recipe.id);
    try {
      const data = await api.createRecipe(recipe);
      const created = validateRecipe(data);
      if (!created) throw new Error("서버에서 잘못된 응답을 받았습니다.");
      // Avoid duplicates if cache already contains this recipe (race condition)
      const existing = (recipesCache ?? []).find((r) => r.id === created.id);
      if (!existing) {
        recipesCache = [created, ...(recipesCache ?? [])];
        notifyListeners();
      }
      return created;
    } finally {
      pendingAddIds.delete(recipe.id);
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    await api.deleteRecipe(id);
    recipesCache = (recipesCache ?? []).filter((r) => r.id !== id);
    // Clean deleted recipe from all folders so counts stay correct
    _removeRecipeFromAllFolders(id);
    notifyListeners();
  }, []);

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    const data = await api.updateRecipe(id, updates);
    const updated = validateRecipe(data);
    if (!updated) throw new Error("서버에서 잘못된 응답을 받았습니다.");
    recipesCache = (recipesCache ?? []).map((r) => r.id === id ? updated : r);
    notifyListeners();
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const data = await api.toggleFavorite(id);
    const updated = validateRecipe(data);
    if (!updated) throw new Error("서버에서 잘못된 응답을 받았습니다.");
    recipesCache = (recipesCache ?? []).map((r) => r.id === id ? updated : r);
    notifyListeners();
  }, []);

  const getRecipe = (id: string) => recipesCache?.find((r) => r.id === id) ?? null;

  return { recipes, loading, refresh, addRecipe, deleteRecipe, updateRecipe, toggleFavorite, getRecipe };
}
