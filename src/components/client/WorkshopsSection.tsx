import React, { useState, useEffect } from "react";
import { workshopsService, parseTagsString, type Workshop } from "../../services/workshopService";
import { formatFlexibleDate } from "../../lib/dateFormat";

/**
 * Workshops showcase section for the Client landing page.
 * Now backed by the "workshops" sheet (managed via Admin > Workshops)
 * instead of a hardcoded array. Each card's button links out to the
 * workshop's attached external booking link (e.g. Luma) when provided.
 * Dates are rendered through formatFlexibleDate for a readable
 * "Month D, YYYY" label, and tags (stored as a comma-separated string)
 * are parsed and shown as a " • "-joined line, matching the original look.
 * Domain: Client
 * @returns {JSX.Element}
 */
export function WorkshopsSection() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workshopsService.fetchWorkshops().then(data => {
      setWorkshops(data.slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (!loading && workshops.length === 0) return null;

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Learn & Create</p>
          <h2 className="text-3xl font-bold text-gray-900">Upcoming Workshops</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-100 animate-pulse h-52 bg-gray-100" />
            ))
          ) : (
            workshops.map(w => {
              const tags = parseTagsString(w.tag);
              const CardInner = (
                <>
                  <div className="relative h-36 bg-gray-200">
                    <img
                      src={w.image}
                      alt={w.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 left-3">
                      <span className="bg-violet-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                        {formatFlexibleDate(w.date)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{w.title}</h3>
                    {tags.length > 0 && (
                      <p className="text-gray-400 text-xs">{tags.join(" • ")}</p>
                    )}
                    {w.link && (
                      <p className="text-violet-600 text-xs font-semibold mt-2 group-hover:underline">Register →</p>
                    )}
                  </div>
                </>
              );

              return w.link ? (
                <a
                  key={w.id}
                  href={w.link}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl overflow-hidden border border-gray-100 group block"
                >
                  {CardInner}
                </a>
              ) : (
                <div key={w.id} className="rounded-xl overflow-hidden border border-gray-100 group">
                  {CardInner}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}