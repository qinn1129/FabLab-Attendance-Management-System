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

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

export const TESTIMONIAL_MAX_LENGTH = 255;

export const testimonialsService = {
  /** Fetches every testimonial regardless of status (used by Admin). */
  async fetchTestimonials(): Promise<Testimonial[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[testimonialsService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty list.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=testimonials`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return (data as any[]).map(t => ({
        ...t,
        stars: Number(t.stars) || 5,
        shownCount: Number(t.shownCount) || 0,
      })) as Testimonial[];
    } catch (error) {
      console.error("[testimonialsService] Failed to fetch testimonials.", error);
      return [];
    }
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
    const shuffled = [...approved].sort(() => Math.random() - 0.5);
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

    const url = getScriptUrl();
    if (!url) {
      console.warn("[testimonialsService] VITE_GOOGLE_SCRIPT_URL is not set. Testimonial was not saved.");
      return newTestimonial;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=testimonials`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "testimonials", action: "add", data: newTestimonial }),
      });
    } catch (error) {
      console.error("[testimonialsService] Failed to save testimonial.", error);
    }
    return newTestimonial;
  },

  async updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=testimonials`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "testimonials", action: "update", id, data: updates }),
      });
    } catch (error) {
      console.error("[testimonialsService] Failed to update testimonial.", error);
    }
  },

  async deleteTestimonial(id: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=testimonials`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "testimonials", action: "delete", id }),
      });
    } catch (error) {
      console.error("[testimonialsService] Failed to delete testimonial.", error);
    }
  },
};