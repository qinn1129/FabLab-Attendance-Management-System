export interface FAQ {
  id: string;
  q: string;
  a: string;
  createdAt?: string;
}

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

export const faqService = {
  async fetchFAQs(): Promise<FAQ[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[faqService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty list.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=faqs`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return (data as FAQ[]).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    } catch (error) {
      console.error("[faqService] Failed to fetch FAQs.", error);
      return [];
    }
  },

  async addFAQ(q: string, a: string): Promise<FAQ> {
    const newFAQ: FAQ = {
      id: `FAQ-${Date.now()}`,
      q,
      a,
      createdAt: new Date().toISOString(),
    };
    const url = getScriptUrl();
    if (!url) {
      console.warn("[faqService] VITE_GOOGLE_SCRIPT_URL is not set. FAQ was not saved.");
      return newFAQ;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=faqs`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "faqs", action: "add", data: newFAQ }),
      });
    } catch (error) {
      console.error("[faqService] Failed to save FAQ.", error);
    }
    return newFAQ;
  },

  async updateFAQ(id: string, updates: Partial<FAQ>): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=faqs`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "faqs", action: "update", id, data: updates }),
      });
    } catch (error) {
      console.error("[faqService] Failed to update FAQ.", error);
    }
  },

  async deleteFAQ(id: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=faqs`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "faqs", action: "delete", id }),
      });
    } catch (error) {
      console.error("[faqService] Failed to delete FAQ.", error);
    }
  },
};