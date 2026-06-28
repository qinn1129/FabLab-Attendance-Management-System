import React from "react";
import { Star } from "lucide-react";
import { TESTIMONIALS } from "../../constants/mockData";

/**
 * Testimonials section for the Client landing page.
 * Domain: Client
 * @returns {JSX.Element}
 */
export function TestimonialsSection() {
  return (
    <section className="py-16 px-6 bg-violet-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Client Stories</p>
          <h2 className="text-3xl font-bold text-gray-900">What They Say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          
          {/*Need for verifcation about this*/}
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-white rounded-xl p-5 border border-violet-100">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="text-gray-900 text-sm font-semibold">{t.name}</p>
                <p className="text-gray-400 text-xs">{t.program}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
