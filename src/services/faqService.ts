import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured } from "../lib/apiClient";

export interface FAQ {
  id: string;
  q: string;
  a: string;
  createdAt?: string;
}

export const faqService = {
  async fetchFAQs(): Promise<FAQ[]> {
    if (!isApiConfigured()) {
      console.warn("[faqService] VITE_API_URL is not set. Returning an empty list.");
      return [];
    }
    return cachedFetch(
      "faqs",
      async () => {
        try {
          const data = await fetchSheet<FAQ>("faqs");
          return data.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
        } catch (error) {
          console.error("[faqService] Failed to fetch FAQs.", error);
          return [];
        }
      },
      8000,
    );
  },

  async addFAQ(q: string, a: string): Promise<FAQ> {
    const newFAQ: FAQ = {
      id: `FAQ-${Date.now()}`,
      q,
      a,
      createdAt: new Date().toISOString(),
    };
    if (!isApiConfigured()) {
      console.warn("[faqService] VITE_API_URL is not set. FAQ was not saved.");
      return newFAQ;
    }
    try {
      await addRow("faqs", newFAQ as unknown as Record<string, unknown>);
      invalidateCache("faqs");
    } catch (error) {
      console.error("[faqService] Failed to save FAQ.", error);
    }
    return newFAQ;
  },

  async updateFAQ(id: string, updates: Partial<FAQ>): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await updateRow("faqs", id, updates as Record<string, unknown>);
      invalidateCache("faqs");
    } catch (error) {
      console.error("[faqService] Failed to update FAQ.", error);
    }
  },

  async deleteFAQ(id: string): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await deleteRow("faqs", id);
      invalidateCache("faqs");
    } catch (error) {
      console.error("[faqService] Failed to delete FAQ.", error);
    }
  },
};