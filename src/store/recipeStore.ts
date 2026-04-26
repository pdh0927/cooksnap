import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types/recipe";
import { sampleRecipes } from "../data/samples";

const STORAGE_KEY = "cooksnap_recipes";

let recipesCache: Recipe[] | null = null;
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(recipesCache ?? []);
  const [loading, setLoading] = useState(recipesCache === null);

  useEffect(() => {
    if (recipesCache !== null) {
      setRecipes(recipesCache);
      setLoading(false);
      const listener = () => setRecipes([...(recipesCache ?? [])]);
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    }

    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        recipesCache = JSON.parse(data);
      } else {
        recipesCache = sampleRecipes;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sampleRecipes));
      }
      setRecipes(recipesCache!);
      setLoading(false);
    });

    const listener = () => setRecipes([...(recipesCache ?? [])]);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const addRecipe = useCallback(async (recipe: Recipe) => {
    if (!recipesCache) return;
    recipesCache = [recipe, ...recipesCache];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipesCache));
    notifyListeners();
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    if (!recipesCache) return;
    recipesCache = recipesCache.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipesCache));
    notifyListeners();
  }, []);

  const getRecipe = useCallback((id: string) => {
    return recipesCache?.find((r) => r.id === id) ?? null;
  }, []);

  return { recipes, loading, addRecipe, deleteRecipe, getRecipe };
}
