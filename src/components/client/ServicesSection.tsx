import React from "react";
import { Printer, Package, Hash, Star } from "lucide-react";

/**
 * Services overview section for the Client landing page.
 * Domain: Client
 * @returns {JSX.Element}
 */

/*
  This should mostly be good na, tho need verification for colors and 3d prin materials (tpu, abs, and the rest, kung alin avail dapat)
*/
export function ServicesSection() {
  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">What We Offer</p>
          <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Printer, title: "FDM 3D Printing", desc: "PLA, ABS, PETG, TPU — high quality prints for prototypes and more." },
            { icon: Package, title: "Design Service", desc: "No 3D file? Our RMs will design your model from scratch." },
            { icon: Hash, title: "Custom Keychains", desc: "Personalized 3D-printed keychains for events and gifts." },
            { icon: Star, title: "NFC Keychains", desc: "Smart NFC-embedded keychains for custom linking." },
          ].map(s => (
            <div key={s.title} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-violet-200 hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
