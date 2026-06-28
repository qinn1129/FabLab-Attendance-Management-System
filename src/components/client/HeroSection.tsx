import React from "react";
import { ChevronRight } from "lucide-react";

/**
 * Hero section for the Client landing page.
 * Domain: Client
 * @param {Object} props
 * @param {Function} props.onStart
 * @returns {JSX.Element}
 */
export function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative h-[520px] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gray-900">
        {/*THIS IMAGE IS YET TO BE REPLACED*/}
        <img
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1400&h=600&fit=crop&auto=format"
          alt="FabLab 3D printing workspace"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/80 to-transparent" />
      </div>
      <div className="relative z-10 max-w-2xl px-10">
        <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-full px-3 py-1 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span className="text-violet-300 text-xs font-mono">Animo Labs</span>
        </div>
        <h1 className="text-5xl font-bold text-white leading-tight mb-4">Bring Your<br /><span className="text-violet-400">Ideas to Life</span></h1>
        <p className="text-white/70 text-lg mb-6 leading-relaxed">Animo Labs Fabrication Laboratory offers 3D printing, NFC technology, and custom fabrication services run by talented Resident Makers.</p>
        <button onClick={onStart} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3 rounded-xl transition flex items-center gap-2">
          Request a Commission <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
