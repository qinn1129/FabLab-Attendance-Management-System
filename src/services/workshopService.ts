import { parseSheetBoolean } from "../lib/utils";
import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured } from "../lib/apiClient";

export interface Workshop {
  id: string;
  /** Strict ISO "YYYY-MM-DD" for new entries (set via a date picker in Admin). Older records may still hold a free-form label like "Jun 28" — see formatFlexibleDate in lib/dateFormat.ts for display. */
  date: string;
  title: string;
  /** Comma-separated tag list under the hood (e.g. "Free,Beginner") so the existing "tag" field doesn't need a schema change. Use parseTagsString/stringifyTags to work with it as string[]. */
  tag: string;
  image: string;
  link?: string; // external booking link (e.g. Luma)
  order?: number;
  createdAt?: string;
  /** Whether this workshop should appear on the client landing page. Admin-curated — see CLIENT_PAGE_LIMIT in pages/admin/Workshops.tsx. Missing/blank cells (rows saved before this field existed) default to visible so nothing disappears unexpectedly. */
  visible?: boolean;
}

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

/** Joins a tag array back into the comma-separated string stored in the "tag" field. */
export function stringifyTags(tags: string[]): string {
  return tags.map(t => t.trim()).filter(Boolean).join(", ");
}

export const workshopsService = {
  async fetchWorkshops(): Promise<Workshop[]> {
    if (!isApiConfigured()) {
      console.warn("[workshopsService] VITE_API_URL is not set. Returning an empty list.");
      return [];
    }
    return cachedFetch(
      "workshops",
      async () => {
        try {
          const data = await fetchSheet<any>("workshops");
          return data
            .map((w) => ({ ...w, order: Number(w.order) || 0, visible: parseSheetBoolean(w.visible, true) }))
            .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || "").localeCompare(b.createdAt || "")) as Workshop[];
        } catch (error) {
          console.error("[workshopsService] Failed to fetch workshops.", error);
          return [];
        }
      },
      8000,
    );
  },

  async addWorkshop(workshop: { title: string; date: string; tag: string; image: string; link?: string; order?: number; visible?: boolean }): Promise<Workshop> {
    const newWorkshop: Workshop = {
      id: `WKS-${Date.now()}`,
      visible: true,
      ...workshop,
      createdAt: new Date().toISOString(),
    };
    if (!isApiConfigured()) {
      console.warn("[workshopsService] VITE_API_URL is not set. Workshop was not saved.");
      return newWorkshop;
    }
    try {
      await addRow("workshops", newWorkshop as unknown as Record<string, unknown>);
      invalidateCache("workshops");
    } catch (error) {
      console.error("[workshopsService] Failed to save workshop.", error);
    }
    return newWorkshop;
  },

  async updateWorkshop(id: string, updates: Partial<Workshop>): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await updateRow("workshops", id, updates as Record<string, unknown>);
      invalidateCache("workshops");
    } catch (error) {
      console.error("[workshopsService] Failed to update workshop.", error);
    }
  },

  async deleteWorkshop(id: string): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await deleteRow("workshops", id);
      invalidateCache("workshops");
    } catch (error) {
      console.error("[workshopsService] Failed to delete workshop.", error);
    }
  },
};