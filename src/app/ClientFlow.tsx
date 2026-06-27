import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Check, Printer, FileText, Hash, Star,
  Package, AlertTriangle, CheckCircle, ArrowRight
} from "lucide-react";
import { Input, Select } from "./shared";
import { TESTIMONIALS } from "./data";

export default function ClientFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    serviceType: "", fileStatus: "", color: "", filament: "",
  });

  const steps = ["Personal Details", "Service", "Details", "Confirm"];

  function ProgressBar() {
    if (step === 1) return null;
    return (
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i + 2 <= step ? "bg-violet-600 text-white" : i + 2 === step ? "bg-violet-600 text-white ring-4 ring-violet-200" : "bg-gray-200 text-gray-500"
                }`}>
                  {i + 2 <= step ? <Check className="w-3.5 h-3.5" /> : i + 2}
                </div>
                <span className="text-[10px] text-gray-500 hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i + 2 < step ? "bg-violet-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 1 — Landing page
  if (step === 1) return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition">
          <ChevronLeft className="w-4 h-4" /> Home
        </button>
        <span className="text-violet-700 font-bold text-sm tracking-tight">DLSU FabLab</span>
        <button onClick={() => setStep(2)} className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition">
          Request Commission
        </button>
      </nav>

      {/* Hero */}
      <section className="relative h-[520px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
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
            <span className="text-violet-300 text-xs font-mono">De La Salle University</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">Bring Your<br /><span className="text-violet-400">Ideas to Life</span></h1>
          <p className="text-white/70 text-lg mb-6 leading-relaxed">The DLSU Fabrication Laboratory offers 3D printing, NFC technology, and custom fabrication services run by talented Resident Makers.</p>
          <button onClick={() => setStep(2)} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3 rounded-xl transition flex items-center gap-2">
            Request a Commission <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Services */}
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

      {/* Workshops */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Learn & Create</p>
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Workshops</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
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

      {/* Testimonials */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Client Stories</p>
            <h2 className="text-3xl font-bold text-gray-900">What They Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
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

      {/* CTA */}
      <section className="py-16 px-6 bg-violet-700 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to start your project?</h2>
        <p className="text-violet-200 mb-6">Submit your commission request and we will get back to you within one business day.</p>
        <button onClick={() => setStep(2)} className="bg-white text-violet-700 font-bold px-8 py-3 rounded-xl hover:bg-violet-50 transition">
          Request a Commission Now
        </button>
      </section>

      <footer className="bg-gray-900 text-center py-6 text-gray-500 text-xs">
        © 2026 DLSU Fabrication Laboratory · <a href="mailto:domie.jucutan@dlsu.edu.ph" className="text-violet-400">domie.jucutan@dlsu.edu.ph</a>
      </footer>
    </div>
  );

  // Step 2 — Personal Details
  if (step === 2) return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-12 px-6 pb-16">
      <button onClick={() => setStep(1)} className="self-start text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm mb-8 transition"><ChevronLeft className="w-4 h-4" />Back</button>
      <ProgressBar />
      <div className="w-full max-w-lg">
        <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Step 1 of 4</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Personal Details</h2>
        <p className="text-gray-400 text-base mb-8">We need a few details to process your commission request.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} placeholder="e.g. Maria" required />
            <Input label="Last Name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} placeholder="e.g. Santos" required />
          </div>
          <Input label="Email Address" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="yourname@dlsu.edu.ph" required />
          <Input label="Contact Number" type="tel" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+63 9XX XXX XXXX" required />
        </div>
        <button
          onClick={() => setStep(3)}
          disabled={!form.firstName || !form.lastName || !form.email || !form.phone}
          className="mt-8 w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Step 3 — Service Selection
  if (step === 3) return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-12 px-6 pb-16">
      <button onClick={() => setStep(2)} className="self-start text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm mb-8 transition"><ChevronLeft className="w-4 h-4" />Back</button>
      <ProgressBar />
      <div className="w-full max-w-lg">
        <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Step 2 of 4</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Choose a Service</h2>
        <p className="text-gray-400 text-base mb-8">Select the service that best describes your project.</p>
        <div className="space-y-3">
          {[
            { id: "3d-has-file", icon: Printer, label: "3D Printing", sub: "I have a file ready (STL, OBJ, 3MF)" },
            { id: "3d-needs-design", icon: FileText, label: "3D Printing", sub: "I don't have a file — I need design help" },
            { id: "keychain-custom", icon: Hash, label: "Customized Keychain", sub: "Custom 3D-printed keychain with your design" },
            { id: "keychain-nfc", icon: Star, label: "NFC Keychain", sub: "Smart keychain with embedded NFC tag" },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setForm(f => ({ ...f, serviceType: s.id }))}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${form.serviceType === s.id ? "border-violet-600 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/30"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${form.serviceType === s.id ? "bg-violet-600" : "bg-gray-100"}`}>
                <s.icon className={`w-5 h-5 ${form.serviceType === s.id ? "text-white" : "text-gray-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${form.serviceType === s.id ? "text-violet-700" : "text-gray-900"}`}>{s.label}</p>
                <p className="text-gray-500 text-xs">{s.sub}</p>
              </div>
              {form.serviceType === s.id && <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStep(4)}
          disabled={!form.serviceType}
          className="mt-8 w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Step 4 — Commission Details
  if (step === 4) return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-12 px-6 pb-16">
      <button onClick={() => setStep(3)} className="self-start text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm mb-8 transition"><ChevronLeft className="w-4 h-4" />Back</button>
      <ProgressBar />
      <div className="w-full max-w-lg">
        <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Step 3 of 4</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Commission Details</h2>
        <p className="text-gray-400 text-base mb-8">Specify your material preferences.</p>
        <div className="space-y-4">
          <Input label="Preferred Color" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} placeholder="e.g. Black, White, Transparent" required />
          <Select
            label="Filament Type"
            value={form.filament}
            onChange={v => setForm(f => ({ ...f, filament: v }))}
            options={["PLA", "PLA+ (Stronger)", "PETG", "ABS", "TPU (Flexible)"]}
          />
        </div>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 text-sm font-semibold mb-0.5">Important Notice</p>
            <p className="text-amber-700 text-xs leading-relaxed">Requests submitted <strong>Friday through Sunday</strong> will be processed and accomplished the <strong>following week starting Monday</strong>. Plan your deadlines accordingly.</p>
          </div>
        </div>
        <button
          onClick={() => setStep(5)}
          disabled={!form.color || !form.filament}
          className="mt-8 w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
        >
          Submit Request <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Step 5 — Confirmation
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-violet-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
      <p className="text-gray-500 text-base mb-8 max-w-sm leading-relaxed">
        Thank you, <strong>{form.firstName}</strong>! Your commission request has been received and is now pending review.
      </p>
      <div className="w-full max-w-sm space-y-3 mb-8">
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-left">
          <p className="text-violet-700 text-sm font-semibold mb-1">Check your email</p>
          <p className="text-gray-600 text-sm leading-relaxed">Please refer to your registered email at <strong>{form.email}</strong> for additional details and pricing.</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left">
          <p className="text-gray-700 text-sm font-semibold mb-1">Need help?</p>
          <p className="text-gray-500 text-sm">Contact <a href="mailto:domie.jucutan@dlsu.edu.ph" className="text-violet-600 font-medium">domie.jucutan@dlsu.edu.ph</a> for any additional concerns.</p>
        </div>
      </div>
      <button
        onClick={() => { setStep(1); setForm({ firstName:"",lastName:"",email:"",phone:"",serviceType:"",fileStatus:"",color:"",filament:"" }); }}
        className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3 rounded-xl transition"
      >
        Submit Another Request
      </button>
      <button onClick={onBack} className="mt-3 text-gray-400 hover:text-gray-600 text-sm transition">
        Return to Home
      </button>
    </div>
  );
}
