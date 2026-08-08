import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured } from "../lib/apiClient";

export type TestimonialStatus = "Pending" | "Approved" | "Rejected";

export interface Testimonial {
  id: string;
  name: string;
  program: string;
  text: string;
  stars: number;
  status: TestimonialStatus;
  submittedAt: string;
  shownCount: number;
}

export const TESTIMONIAL_MAX_LENGTH = 255;

export const testimonialsService = {
  /** Fetches every testimonial regardless of status (used by Admin). */
  async fetchTestimonials(): Promise<Testimonial[]> {
    if (!isApiConfigured()) {
      console.warn("[testimonialsService] VITE_API_URL is not set. Returning an empty list.");
      return [];
    }
    return cachedFetch(
      "testimonials",
      async () => {
        try {
          const data = await fetchSheet<any>("testimonials");
          return data.map((t) => ({
            ...t,
            stars: Number(t.stars) || 5,
            shownCount: Number(t.shownCount) || 0,
          })) as Testimonial[];
        } catch (error) {
          console.error("[testimonialsService] Failed to fetch testimonials.", error);
          return [];
        }
      },
      5000,
    );
  },

  /** All Approved testimonials, unordered — used by Admin/debug views. */
  async fetchApprovedTestimonials(): Promise<Testimonial[]> {
    const all = await this.fetchTestimonials();
    return all.filter(t => t.status === "Approved");
  },

  /**
   * Returns up to `count` Approved testimonials for the client landing page,
   * prioritizing ones with the lowest shownCount (i.e. not yet shown / shown
   * the fewest times) so the rotation surfaces fresh testimonials first, then
   * cycles back through everything once all have been shown roughly equally.
   * Fires off (non-blocking) shownCount increments for whichever ones it picks.
   */
  async getRotatingTestimonials(count = 3): Promise<Testimonial[]> {
    const approved = await this.fetchApprovedTestimonials();
    if (approved.length === 0) return [];

    // Shuffle within each shownCount "tier" so it's not always the same
    // order among equally-fresh testimonials, then sort tiers ascending.
    const shuffled = approved
      .map(t => ({ t, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(x => x.t);
    shuffled.sort((a, b) => a.shownCount - b.shownCount);

    const selected = shuffled.slice(0, count);

    // Fire-and-forget bump of shownCount for the ones we're displaying.
    selected.forEach(t => {
      this.updateTestimonial(t.id, { shownCount: t.shownCount + 1 }).catch(() => {});
    });

    return selected;
  },

  async submitTestimonial(form: Pick<Testimonial, "name" | "program" | "text" | "stars">): Promise<Testimonial> {
    const trimmedText = form.text.trim().slice(0, TESTIMONIAL_MAX_LENGTH);
    const newTestimonial: Testimonial = {
      id: `TST-${Date.now()}`,
      name: form.name.trim(),
      program: form.program.trim(),
      text: trimmedText,
      stars: form.stars,
      status: "Pending",
      submittedAt: new Date().toISOString(),
      shownCount: 0,
    };

    if (!isApiConfigured()) {
      console.warn("[testimonialsService] VITE_API_URL is not set. Testimonial was not saved.");
      return newTestimonial;
    }
    try {
      await addRow("testimonials", newTestimonial as unknown as Record<string, unknown>);
      invalidateCache("testimonials");
    } catch (error) {
      console.error("[testimonialsService] Failed to save testimonial.", error);
    }
    return newTestimonial;
  },

  async updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await updateRow("testimonials", id, updates as Record<string, unknown>);
      invalidateCache("testimonials");
    } catch (error) {
      console.error("[testimonialsService] Failed to update testimonial.", error);
    }
  },

  async deleteTestimonial(id: string): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await deleteRow("testimonials", id);
      invalidateCache("testimonials");
    } catch (error) {
      console.error("[testimonialsService] Failed to delete testimonial.", error);
    }
  },
};