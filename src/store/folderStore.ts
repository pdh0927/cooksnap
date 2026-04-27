import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Folder {
  id: string;
  name: string;
  emoji: string;
  recipeIds: string[];
  createdAt: string;
}

const STORAGE_KEY = "cooksnap_folders";

let foldersCache: Folder[] | null = null;
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>(foldersCache ?? []);
  const [loading, setLoading] = useState(foldersCache === null);

  useEffect(() => {
    if (foldersCache !== null) {
      setFolders(foldersCache);
      setLoading(false);
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then((data) => {
        foldersCache = data ? JSON.parse(data) : [];
        setFolders(foldersCache!);
        setLoading(false);
      });
    }
    const listener = () => setFolders([...(foldersCache ?? [])]);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const persist = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(foldersCache));
    notify();
  }, []);

  const createFolder = useCallback(async (name: string, emoji: string) => {
    if (!foldersCache) return;
    const folder: Folder = {
      id: Date.now().toString(),
      name,
      emoji,
      recipeIds: [],
      createdAt: new Date().toISOString(),
    };
    foldersCache = [...foldersCache, folder];
    await persist();
    return folder;
  }, [persist]);

  const deleteFolder = useCallback(async (id: string) => {
    if (!foldersCache) return;
    foldersCache = foldersCache.filter((f) => f.id !== id);
    await persist();
  }, [persist]);

  const renameFolder = useCallback(async (id: string, name: string, emoji: string) => {
    if (!foldersCache) return;
    foldersCache = foldersCache.map((f) =>
      f.id === id ? { ...f, name, emoji } : f
    );
    await persist();
  }, [persist]);

  const addRecipeToFolder = useCallback(async (folderId: string, recipeId: string) => {
    if (!foldersCache) return;
    foldersCache = foldersCache.map((f) =>
      f.id === folderId && !f.recipeIds.includes(recipeId)
        ? { ...f, recipeIds: [...f.recipeIds, recipeId] }
        : f
    );
    await persist();
  }, [persist]);

  const removeRecipeFromFolder = useCallback(async (folderId: string, recipeId: string) => {
    if (!foldersCache) return;
    foldersCache = foldersCache.map((f) =>
      f.id === folderId
        ? { ...f, recipeIds: f.recipeIds.filter((id) => id !== recipeId) }
        : f
    );
    await persist();
  }, [persist]);

  const getFoldersForRecipe = useCallback((recipeId: string) => {
    return (foldersCache ?? []).filter((f) => f.recipeIds.includes(recipeId));
  }, []);

  return {
    folders, loading,
    createFolder, deleteFolder, renameFolder,
    addRecipeToFolder, removeRecipeFromFolder, getFoldersForRecipe,
  };
}
