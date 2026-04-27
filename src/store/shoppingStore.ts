import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "cooksnap_shopping";

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  recipeTitle: string;
}

let itemsCache: ShoppingItem[] | null = null;
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(itemsCache));
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>(itemsCache ?? []);
  const [loading, setLoading] = useState(itemsCache === null);

  useEffect(() => {
    if (itemsCache !== null) {
      setItems(itemsCache);
      setLoading(false);
      const listener = () => setItems([...(itemsCache ?? [])]);
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    }

    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        itemsCache = JSON.parse(data) as ShoppingItem[];
      } else {
        itemsCache = [];
      }
      setItems(itemsCache);
      setLoading(false);
    });

    const listener = () => setItems([...(itemsCache ?? [])]);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const addItems = useCallback(
    async (newItems: Omit<ShoppingItem, "id" | "checked">[]) => {
      if (!itemsCache) return;
      for (const item of newItems) {
        const existing = itemsCache.find(
          (i) => i.name === item.name && i.unit === item.unit && !i.checked
        );
        if (existing) {
          existing.amount += item.amount;
        } else {
          itemsCache.push({
            ...item,
            id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            checked: false,
          });
        }
      }
      itemsCache = [...itemsCache];
      await persist();
      notifyListeners();
    },
    []
  );

  const toggleItem = useCallback(async (id: string) => {
    if (!itemsCache) return;
    itemsCache = itemsCache.map((i) =>
      i.id === id ? { ...i, checked: !i.checked } : i
    );
    await persist();
    notifyListeners();
  }, []);

  const removeItem = useCallback(async (id: string) => {
    if (!itemsCache) return;
    itemsCache = itemsCache.filter((i) => i.id !== id);
    await persist();
    notifyListeners();
  }, []);

  const clearChecked = useCallback(async () => {
    if (!itemsCache) return;
    itemsCache = itemsCache.filter((i) => !i.checked);
    await persist();
    notifyListeners();
  }, []);

  const clearAll = useCallback(async () => {
    itemsCache = [];
    await persist();
    notifyListeners();
  }, []);

  return { items, loading, addItems, toggleItem, removeItem, clearChecked, clearAll };
}
