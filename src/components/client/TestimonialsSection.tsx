import React, { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { testimonialsService, type Testimonial } from "../../services/testimonialsService";

/**
 * Testimonials section for the Client landing page.
 * Domain: Client
 * @returns {JSX.Element}
 */
export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [program, setProgram] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const loadTestimonials = async () => {
    setLoading(true);
    const data = await testimonialsService.fetchApprovedTestimonials();
    setTestimonials(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !program.trim() || !text.trim()) return;

    await testimonialsService.submitTestimonial({
      name: name.trim(),
      program: program.trim(),
      text: text.trim(),
      stars,
    });

    setName("");
    setProgram("");
    setText("");
    setStars(5);
    setSubmitted(true);
    setShowForm(false);
  };

  return (
    <section className="py-16 px-6 bg-violet-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Client Stories</p>
          <h2 className="text-3xl font-bold text-gray-900">What They Say</h2>
          <p className="text-gray-500 text-sm mt-3 max-w-2xl mx-auto">
            Share your FabLab experience. Submitted testimonials appear here after admin approval.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setShowForm(true);
            }}
            className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            Submit a Testimonial
          </button>
          {submitted && (
            <p className="mt-3 text-sm font-medium text-emerald-600">
              Thanks for sharing. Your testimonial is pending admin approval.
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-500">Loading testimonials...</p>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No approved testimonials yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl p-5 border border-violet-100">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div>
                  <p className="text-gray-900 text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-gray-400 text-xs">{testimonial.program}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Submit a Testimonial</h3>
                <p className="text-sm text-gray-500 mt-1">Your message will be reviewed by an admin before it appears publicly.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-gray-700">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-400"
                  placeholder="Juan dela Cruz"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-gray-700">
                Program / Affiliation
                <input
                  value={program}
                  onChange={(event) => setProgram(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-400"
                  placeholder="BS ME '26"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-gray-700">
                Rating
                <select
                  value={stars}
                  onChange={(event) => setStars(Number(event.target.value))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-400"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating} star{rating > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium text-gray-700">
                Testimonial
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={4}
                  className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-400"
                  placeholder="Tell us about your FabLab experience..."
                  required
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
