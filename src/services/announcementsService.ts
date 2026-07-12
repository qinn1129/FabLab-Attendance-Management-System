export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  pinned: boolean;
  createdAt?: string;
}

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

export const announcementsService = {
  async fetchAnnouncements(): Promise<Announcement[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[announcementsService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty list.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=announcements`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return (data as any[])
        .map(a => ({
          ...a,
          pinned: a.pinned === true || a.pinned === "TRUE" || a.pinned === "true",
        }))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        });
    } catch (error) {
      console.error("[announcementsService] Failed to fetch announcements.", error);
      return [];
    }
  },

  async addAnnouncement(title: string, body: string, pinned = false): Promise<Announcement> {
    const newAnn: Announcement = {
      id: `ANN-${Date.now()}`,
      title,
      body,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pinned,
      createdAt: new Date().toISOString(),
    };
    const url = getScriptUrl();
    if (!url) {
      console.warn("[announcementsService] VITE_GOOGLE_SCRIPT_URL is not set. Announcement was not saved.");
      return newAnn;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=announcements`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "announcements", action: "add", data: newAnn }),
      });
    } catch (error) {
      console.error("[announcementsService] Failed to save announcement.", error);
    }
    return newAnn;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=announcements`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "announcements", action: "update", id, data: updates }),
      });
    } catch (error) {
      console.error("[announcementsService] Failed to update announcement.", error);
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=announcements`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "announcements", action: "delete", id }),
      });
    } catch (error) {
      console.error("[announcementsService] Failed to delete announcement.", error);
    }
  },
};