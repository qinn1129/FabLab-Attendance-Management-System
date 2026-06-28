import React from "react";

/**
 * Workshops showcase section for the Client landing page.
 * Domain: Client
 * @returns {JSX.Element}
 */
export function WorkshopsSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Learn & Create</p>
          <h2 className="text-3xl font-bold text-gray-900">Upcoming Workshops</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">

          {/*HARDCODE AND AI-GENERATED INFORMATION, IM GONNA ASK SIR PA HERE IF HE WANTS TO ADD/EDIT THIS*/}
          {[
            { date: "Jun 28", title: "Intro to Fusion 360", tag: "Free • Beginner", img: "photo-1605810230434-7631ac76ec81" },
            { date: "Jul 05", title: "FDM Printing Fundamentals", tag: "Free • All Levels", img: "photo-1563770660941-20978e870e26" },
            { date: "Jul 12", title: "NFC Tech Workshop", tag: "Free • Intermediate", img: "photo-1535223289827-42f1e9919769" },
          ].map(w => (
            <div key={w.title} className="rounded-xl overflow-hidden border border-gray-100 group">
              <div className="relative h-36 bg-gray-200">
                <img
                  src={`https://images.unsplash.com/${w.img}?w=400&h=200&fit=crop&auto=format`}
                  alt={w.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-3">
                  <span className="bg-violet-600 text-white text-xs font-semibold px-2 py-0.5 rounded">{w.date}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{w.title}</h3>
                <p className="text-gray-400 text-xs">{w.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
