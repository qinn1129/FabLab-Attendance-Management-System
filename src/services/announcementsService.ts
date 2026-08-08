import { formatDateTime } from "../lib/dateFormat";
import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured } from "../lib/apiClient";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  pinned: boolean;
  createdAt?: string;
}

export const announcementsService = {
  async fetchAnnouncements(): Promise<Announcement[]> {
    if (!isApiConfigured()) {
      console.warn("[announcementsService] VITE_API_URL is not set. Returning an empty list.");
      return [];
    }
    return cachedFetch(
      "announcements",
      async () => {
        try {
          const data = await fetchSheet<any>("announcements");
          return data
            .map((a) => ({
              ...a,
              pinned: a.pinned === true || a.pinned === "TRUE" || a.pinned === "true",
            }))
            .sort((a, b) => {
              if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
              return (b.createdAt || "").localeCompare(a.createdAt || "");
            }) as Announcement[];
        } catch (error) {
          console.error("[announcementsService] Failed to fetch announcements.", error);
          return [];
        }
      },
      4000,
    );
  },

  async addAnnouncement(title: string, body: string, pinned = false): Promise<Announcement> {
    const newAnn: Announcement = {
      id: `ANN-${Date.now()}`,
      title,
      body,
      date: formatDateTime(new Date()),
      pinned,
      createdAt: new Date().toISOString(),
    };
    if (!isApiConfigured()) {
      console.warn("[announcementsService] VITE_API_URL is not set. Announcement was not saved.");
      return newAnn;
    }
    try {
      await addRow("announcements", newAnn as unknown as Record<string, unknown>);
      invalidateCache("announcements");
    } catch (error) {
      console.error("[announcementsService] Failed to save announcement.", error);
    }
    return newAnn;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await updateRow("announcements", id, updates as Record<string, unknown>);
      invalidateCache("announcements");
    } catch (error) {
      console.error("[announcementsService] Failed to update announcement.", error);
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await deleteRow("announcements", id);
      invalidateCache("announcements");
    } catch (error) {
      console.error("[announcementsService] Failed to delete announcement.", error);
    }
  },
};