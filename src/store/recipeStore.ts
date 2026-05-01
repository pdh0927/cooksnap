import { useState, useEffect, useCallback } from "react";
import { Recipe } from "../types/recipe";
import { api } from "./api";

let recipesCache: Recipe[] | null = null;
let listeners: Set<() => void> = new Set();

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
        .then((data: Recipe[]) => {
          recipesCache = data;
          setRecipes(data);
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
      recipesCache = data;
      notifyListeners();
    } catch (err) {
      // Re-throw so callers can handle (e.g. show error UI)
      throw err;
    }
  }, []);

  const addRecipe = useCallback(async (recipe: Recipe) => {
    const created = await api.createRecipe(recipe);
    recipesCache = [created, ...(recipesCache ?? [])];
    notifyListeners();
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    await api.deleteRecipe(id);
    recipesCache = (recipesCache ?? []).filter((r) => r.id !== id);
    notifyListeners();
  }, []);

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    const updated = await api.updateRecipe(id, updates);
    recipesCache = (recipesCache ?? []).map((r) => r.id === id ? updated : r);
    notifyListeners();
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const updated = await api.toggleFavorite(id);
    recipesCache = (recipesCache ?? []).map((r) => r.id === id ? updated : r);
    notifyListeners();
  }, []);

  const getRecipe = (id: string) => recipesCache?.find((r) => r.id === id) ?? null;

  return { recipes, loading, refresh, addRecipe, deleteRecipe, updateRecipe, toggleFavorite, getRecipe };
}
