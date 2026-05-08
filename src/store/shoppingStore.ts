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
/** Track in-flight toggle/remove to prevent rapid-tap races */
const pendingToggleIds: Set<string> = new Set();
const pendingRemoveIds: Set<string> = new Set();
let pendingAddItems = false;
let pendingClear = false;

/** Validate that data looks like a ShoppingItem array; returns safe array */
function validateShoppingItems(data: unknown): ShoppingItem[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (i: any) => i && typeof i === "object" && typeof i.id === "string" && typeof i.name === "string"
  ).map((i: any) => ({
    id: i.id,
    name: i.name,
    amount: typeof i.amount === "number" ? i.amount : 0,
    unit: typeof i.unit === "string" ? i.unit : "",
    checked: typeof i.checked === "boolean" ? i.checked : false,
    recipeTitle: typeof i.recipeTitle === "string" ? i.recipeTitle : "",
  }));
}

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
        .then((data: unknown) => {
          const validated = validateShoppingItems(data);
          itemsCache = validated;
          setItems(validated);
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
    if (pendingAddItems) {
      throw new Error("이미 추가 중입니다. 잠시 기다려주세요.");
    }
    pendingAddItems = true;
    try {
      const data = await api.addShoppingItems(newItems);
      itemsCache = validateShoppingItems(data);
      notify();
    } finally {
      pendingAddItems = false;
    }
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    if (pendingToggleIds.has(id)) return;
    pendingToggleIds.add(id);
    try {
      await api.toggleShoppingItem(id);
      itemsCache = (itemsCache ?? []).map((i) => i.id === id ? { ...i, checked: !i.checked } : i);
      notify();
    } finally {
      pendingToggleIds.delete(id);
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    if (pendingRemoveIds.has(id)) return;
    pendingRemoveIds.add(id);
    try {
      await api.deleteShoppingItem(id);
      itemsCache = (itemsCache ?? []).filter((i) => i.id !== id);
      notify();
    } finally {
      pendingRemoveIds.delete(id);
    }
  }, []);

  const clearChecked = useCallback(async () => {
    if (pendingClear) return;
    pendingClear = true;
    try {
      await api.clearCheckedItems();
      itemsCache = (itemsCache ?? []).filter((i) => !i.checked);
      notify();
    } finally {
      pendingClear = false;
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (pendingClear) return;
    pendingClear = true;
    try {
      await api.clearAllItems();
      itemsCache = [];
      notify();
    } finally {
      pendingClear = false;
    }
  }, []);

  return { items, addItems, toggleItem, removeItem, clearChecked, clearAll };
}
