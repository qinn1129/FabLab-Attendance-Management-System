export interface Workshop {
  id: string;
  title: string;
  date: string; // free-form display label, e.g. "Jun 28"
  tag: string; // e.g. "Free • Beginner"
  image: string;
  link?: string; // external booking link (e.g. Luma)
  order?: number;
  createdAt?: string;
}

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

export const workshopsService = {
  async fetchWorkshops(): Promise<Workshop[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[workshopsService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty list.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=workshops`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return (data as Workshop[])
        .map(w => ({ ...w, order: Number(w.order) || 0 }))
        .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || "").localeCompare(b.createdAt || ""));
    } catch (error) {
      console.error("[workshopsService] Failed to fetch workshops.", error);
      return [];
    }
  },

  async addWorkshop(workshop: { title: string; date: string; tag: string; image: string; link?: string; order?: number }): Promise<Workshop> {
    const newWorkshop: Workshop = {
      id: `WKS-${Date.now()}`,
      ...workshop,
      createdAt: new Date().toISOString(),
    };
    const url = getScriptUrl();
    if (!url) {
      console.warn("[workshopsService] VITE_GOOGLE_SCRIPT_URL is not set. Workshop was not saved.");
      return newWorkshop;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=workshops`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "workshops", action: "add", data: newWorkshop }),
      });
    } catch (error) {
      console.error("[workshopsService] Failed to save workshop.", error);
    }
    return newWorkshop;
  },

  async updateWorkshop(id: string, updates: Partial<Workshop>): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=workshops`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "workshops", action: "update", id, data: updates }),
      });
    } catch (error) {
      console.error("[workshopsService] Failed to update workshop.", error);
    }
  },

  async deleteWorkshop(id: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=workshops`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "workshops", action: "delete", id }),
      });
    } catch (error) {
      console.error("[workshopsService] Failed to delete workshop.", error);
    }
  },
};