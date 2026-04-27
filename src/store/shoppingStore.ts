import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

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

function notify() {
  listeners.forEach((fn) => fn());
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>(itemsCache ?? []);

  useEffect(() => {
    const listener = () => setItems([...(itemsCache ?? [])]);
    listeners.add(listener);

    if (itemsCache === null) {
      api.getShoppingItems()
        .then((data: ShoppingItem[]) => {
          itemsCache = data;
          setItems(data);
        })
        .catch(() => {
          itemsCache = [];
          setItems([]);
        });
    } else {
      setItems(itemsCache);
    }

    return () => { listeners.delete(listener); };
  }, []);

  const addItems = useCallback(async (newItems: Omit<ShoppingItem, "id" | "checked">[]) => {
    const data = await api.addShoppingItems(newItems);
    itemsCache = data;
    notify();
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    await api.toggleShoppingItem(id);
    itemsCache = (itemsCache ?? []).map((i) => i.id === id ? { ...i, checked: !i.checked } : i);
    notify();
  }, []);

  const removeItem = useCallback(async (id: string) => {
    itemsCache = (itemsCache ?? []).filter((i) => i.id !== id);
    notify();
  }, []);

  const clearChecked = useCallback(async () => {
    await api.clearCheckedItems();
    itemsCache = (itemsCache ?? []).filter((i) => !i.checked);
    notify();
  }, []);

  const clearAll = useCallback(async () => {
    await api.clearAllItems();
    itemsCache = [];
    notify();
  }, []);

  return { items, addItems, toggleItem, removeItem, clearChecked, clearAll };
}
