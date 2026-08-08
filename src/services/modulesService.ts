import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured } from "../lib/apiClient";

export interface TrainingModule {
  id: string;
  title: string;
  desc: string;
  yt: string;
  gd: string;
  createdAt?: string;
}

export const modulesService = {
  async fetchModules(): Promise<TrainingModule[]> {
    if (!isApiConfigured()) {
      console.warn("[modulesService] VITE_API_URL is not set. Returning an empty list.");
      return [];
    }
    return cachedFetch(
      "modules",
      async () => {
        try {
          const data = await fetchSheet<TrainingModule>("modules");
          return data.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
        } catch (error) {
          console.error("[modulesService] Failed to fetch modules.", error);
          return [];
        }
      },
      8000,
    );
  },

  async addModule(mod: { title: string; desc: string; yt: string; gd: string }): Promise<TrainingModule> {
    const newModule: TrainingModule = {
      id: `MOD-${Date.now()}`,
      ...mod,
      createdAt: new Date().toISOString(),
    };
    if (!isApiConfigured()) {
      console.warn("[modulesService] VITE_API_URL is not set. Module was not saved.");
      return newModule;
    }
    try {
      await addRow("modules", newModule as unknown as Record<string, unknown>);
      invalidateCache("modules");
    } catch (error) {
      console.error("[modulesService] Failed to save module.", error);
    }
    return newModule;
  },

  async updateModule(id: string, updates: Partial<TrainingModule>): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await updateRow("modules", id, updates as Record<string, unknown>);
      invalidateCache("modules");
    } catch (error) {
      console.error("[modulesService] Failed to update module.", error);
    }
  },

  async deleteModule(id: string): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await deleteRow("modules", id);
      invalidateCache("modules");
    } catch (error) {
      console.error("[modulesService] Failed to delete module.", error);
    }
  },
};