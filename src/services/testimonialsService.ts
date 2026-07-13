import { TESTIMONIALS } from "../constants/mockData";

export type TestimonialStatus = "Pending" | "Approved" | "Rejected";

export interface Testimonial {
  id: string;
  name: string;
  program: string;
  text: string;
  stars: number;
  status: TestimonialStatus;
  submittedAt: string;
}

const LOCAL_STORAGE_KEY = "fablab_testimonials_v1";

const seedTestimonials = (): Testimonial[] => {
  const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (error) {
      console.error("Error parsing testimonial mock data", error);
    }
  }

  const seeded: Testimonial[] = TESTIMONIALS.map((testimonial, index) => ({
    id: `TST-${String(index + 1).padStart(3, "0")}`,
    ...testimonial,
    status: "Approved",
    submittedAt: "Seed data",
  }));

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveTestimonials = (testimonials: Testimonial[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(testimonials));
};

export const testimonialsService = {
  async fetchTestimonials(): Promise<Testimonial[]> {
    return seedTestimonials();
  },

  async fetchApprovedTestimonials(): Promise<Testimonial[]> {
    return seedTestimonials().filter((testimonial) => testimonial.status === "Approved");
  },

  async submitTestimonial(form: Pick<Testimonial, "name" | "program" | "text" | "stars">): Promise<Testimonial> {
    const testimonials = seedTestimonials();
    const submitted: Testimonial = {
      id: `TST-${Date.now()}`,
      ...form,
      status: "Pending",
      submittedAt: new Date().toLocaleString(),
    };

    saveTestimonials([submitted, ...testimonials]);
    return submitted;
  },
};
