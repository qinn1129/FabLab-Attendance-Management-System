export interface Workshop {
  id: string;
  title: string;
  /** Strict ISO "YYYY-MM-DD" for new entries (set via a date picker in Admin). Older records may still hold a free-form label like "Jun 28" — see formatFlexibleDate in lib/dateFormat.ts for display. */
  date: string;
  /** Comma-separated tag list under the hood (e.g. "Free,Beginner") so the existing "tag" sheet column doesn't need a schema change. Use parseTagsString/stringifyTags to work with it as string[]. */
  tag: string;
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

/**
 * Splits a stored tag string into a clean array of individual tags.
 * Accepts commas (the canonical separator going forward) as well as the
 * old "•" bullet separator used by legacy free-text tag entries, so
 * existing workshops still render as separate chips in the new UI.
 */
export function parseTagsString(tag: string | undefined | null): string[] {
  if (!tag) return [];
  return tag
    .split(/[,•|]/)
    .map(t => t.trim())
    .filter(Boolean);
}

/** Joins a tag array back into the comma-separated string stored in the "tag" sheet column. */
export function stringifyTags(tags: string[]): string {
  return tags.map(t => t.trim()).filter(Boolean).join(", ");
}

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