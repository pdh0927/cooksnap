import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

export interface Folder {
  id: string;
  name: string;
  emoji: string;
  recipeIds: string[];
  createdAt: string;
}

let foldersCache: Folder[] | null = null;
let listeners: Set<() => void> = new Set();

/** Validate that data looks like a Folder array; returns safe array */
function validateFolders(data: unknown): Folder[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (f: any) =>
      f && typeof f === "object" && typeof f.id === "string" && typeof f.name === "string"
  ).map((f: any) => ({
    ...f,
    recipeIds: Array.isArray(f.recipeIds) ? f.recipeIds : [],
  })) as Folder[];
}

/** Validate a single folder */
function validateFolder(data: unknown): Folder | null {
  if (!data || typeof data !== "object") return null;
  const f = data as any;
  if (typeof f.id !== "string" || typeof f.name !== "string") return null;
  return { ...f, recipeIds: Array.isArray(f.recipeIds) ? f.recipeIds : [] } as Folder;
}

function notify() {
  listeners.forEach((fn) => fn());
}

/** Remove a recipe from all folders (called when a recipe is deleted). */
export function _removeRecipeFromAllFolders(recipeId: string) {
  if (!foldersCache) return;
  let changed = false;
  foldersCache = foldersCache.map((f) => {
    if (f.recipeIds.includes(recipeId)) {
      changed = true;
      return { ...f, recipeIds: f.recipeIds.filter((id) => id !== recipeId) };
    }
    return f;
  });
  if (changed) notify();
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>(foldersCache ?? []);
  const [loading, setLoading] = useState(foldersCache === null);

  useEffect(() => {
    const listener = () => setFolders([...(foldersCache ?? [])]);
    listeners.add(listener);

    if (foldersCache === null) {
      api.getFolders()
        .then((data: unknown) => {
          const validated = validateFolders(data);
          foldersCache = validated;
          setFolders(validated);
          setLoading(false);
        })
        .catch(() => {
          foldersCache = [];
          setFolders([]);
          setLoading(false);
        });
    } else {
      setFolders(foldersCache);
      setLoading(false);
    }

    return () => { listeners.delete(listener); };
  }, []);

  const createFolder = useCallback(async (name: string, emoji: string) => {
    const data = await api.createFolder(name, emoji);
    const folder = validateFolder(data);
    if (!folder) throw new Error("서버에서 잘못된 응답을 받았습니다.");
    foldersCache = [...(foldersCache ?? []), folder];
    notify();
    return folder;
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await api.deleteFolder(id);
    foldersCache = (foldersCache ?? []).filter((f) => f.id !== id);
    notify();
  }, []);

  const renameFolder = useCallback(async (id: string, name: string, emoji: string) => {
    await api.updateFolder(id, name, emoji);
    foldersCache = (foldersCache ?? []).map((f) => f.id === id ? { ...f, name, emoji } : f);
    notify();
  }, []);

  const addRecipeToFolder = useCallback(async (folderId: string, recipeId: string) => {
    await api.addRecipeToFolder(folderId, recipeId);
    foldersCache = (foldersCache ?? []).map((f) =>
      f.id === folderId && !f.recipeIds.includes(recipeId)
        ? { ...f, recipeIds: [...f.recipeIds, recipeId] }
        : f
    );
    notify();
  }, []);

  const removeRecipeFromFolder = useCallback(async (folderId: string, recipeId: string) => {
    await api.removeRecipeFromFolder(folderId, recipeId);
    foldersCache = (foldersCache ?? []).map((f) =>
      f.id === folderId
        ? { ...f, recipeIds: f.recipeIds.filter((id) => id !== recipeId) }
        : f
    );
    notify();
  }, []);

  const getFoldersForRecipe = useCallback((recipeId: string) => {
    return (foldersCache ?? []).filter((f) => f.recipeIds.includes(recipeId));
  }, []);

  return {
    folders, loading,
    createFolder, deleteFolder, renameFolder,
    addRecipeToFolder, removeRecipeFromFolder, getFoldersForRecipe,
  };
}
