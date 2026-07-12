export interface TrainingModule {
  id: string;
  title: string;
  desc: string;
  yt: string;
  gd: string;
  createdAt?: string;
}

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

export const modulesService = {
  async fetchModules(): Promise<TrainingModule[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[modulesService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty list.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=modules`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return (data as TrainingModule[]).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    } catch (error) {
      console.error("[modulesService] Failed to fetch modules.", error);
      return [];
    }
  },

  async addModule(mod: { title: string; desc: string; yt: string; gd: string }): Promise<TrainingModule> {
    const newModule: TrainingModule = {
      id: `MOD-${Date.now()}`,
      ...mod,
      createdAt: new Date().toISOString(),
    };
    const url = getScriptUrl();
    if (!url) {
      console.warn("[modulesService] VITE_GOOGLE_SCRIPT_URL is not set. Module was not saved.");
      return newModule;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=modules`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "modules", action: "add", data: newModule }),
      });
    } catch (error) {
      console.error("[modulesService] Failed to save module.", error);
    }
    return newModule;
  },

  async updateModule(id: string, updates: Partial<TrainingModule>): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=modules`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "modules", action: "update", id, data: updates }),
      });
    } catch (error) {
      console.error("[modulesService] Failed to update module.", error);
    }
  },

  async deleteModule(id: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=modules`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "modules", action: "delete", id }),
      });
    } catch (error) {
      console.error("[modulesService] Failed to delete module.", error);
    }
  },
};