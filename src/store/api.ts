const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

async function request(path: string, options?: RequestInit) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "요청 실패" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export const api = {
  // Recipes
  getRecipes: () => request("/api/recipes"),
  getRecipe: (id: string) => request(`/api/recipes/${id}`),
  createRecipe: (data: any) => request("/api/recipes", { method: "POST", body: JSON.stringify(data) }),
  updateRecipe: (id: string, data: any) => request(`/api/recipes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
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
  addShoppingItems: (items: any[]) => request("/api/shopping", { method: "POST", body: JSON.stringify({ items }) }),
  toggleShoppingItem: (id: string) => request(`/api/shopping/${id}/toggle`, { method: "PATCH" }),
  clearCheckedItems: () => request("/api/shopping/checked", { method: "DELETE" }),
  clearAllItems: () => request("/api/shopping", { method: "DELETE" }),
};
