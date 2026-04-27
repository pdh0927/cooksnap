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

function notify() {
  listeners.forEach((fn) => fn());
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>(foldersCache ?? []);
  const [loading, setLoading] = useState(foldersCache === null);

  useEffect(() => {
    const listener = () => setFolders([...(foldersCache ?? [])]);
    listeners.add(listener);

    if (foldersCache === null) {
      api.getFolders()
        .then((data: Folder[]) => {
          foldersCache = data;
          setFolders(data);
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
    const folder = await api.createFolder(name, emoji);
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
    await api.createFolder(name, emoji); // TODO: use PATCH
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
