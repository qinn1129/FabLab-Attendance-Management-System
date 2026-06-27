import { Package, Settings, Users, ArrowRight } from "lucide-react";

export default function HomeScreen({ setFlow }: { setFlow: (f: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6" style={{ background: "radial-gradient(ellipse at 20% 50%, #1e1045 0%, #030712 50%, #0a2010 100%)" }}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-white/10 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/70 text-xs font-mono uppercase tracking-widest">FabLab System v2.0</span>
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
          DLSU <span className="text-violet-400">FabLab</span>
        </h1>
        <p className="text-white/50 text-lg">Attendance & Commission Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        {/* Client */}
        <button
          onClick={() => setFlow("client")}
          className="group relative rounded-2xl p-6 text-left transition-all hover:scale-105 overflow-hidden border border-violet-500/20 hover:border-violet-400/40"
          style={{ background: "linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-violet-300" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1">Client Portal</h2>
          <p className="text-violet-200/70 text-sm mb-4 leading-relaxed">Request 3D printing commissions, customized keychains, and more.</p>
          <div className="flex items-center gap-1 text-violet-300 text-sm font-medium group-hover:gap-2 transition-all">
            Get Started <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Admin */}
        <button
          onClick={() => setFlow("admin")}
          className="group relative rounded-2xl p-6 text-left transition-all hover:scale-105 overflow-hidden border border-emerald-500/20 hover:border-emerald-400/40"
          style={{ background: "linear-gradient(135deg, #052e16 0%, #064e3b 100%)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #6ee7b7 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1">Admin Portal</h2>
          <p className="text-emerald-200/70 text-sm mb-4 leading-relaxed">Manage commissions, resident makers, modules, and system settings.</p>
          <div className="flex items-center gap-1 text-emerald-300 text-sm font-medium group-hover:gap-2 transition-all">
            Admin Login <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* RM */}
        <button
          onClick={() => setFlow("rm")}
          className="group relative rounded-2xl p-6 text-left transition-all hover:scale-105 overflow-hidden border border-emerald-500/20 hover:border-emerald-400/40"
          style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1">Resident Maker</h2>
          <p className="text-emerald-200/70 text-sm mb-4 leading-relaxed">Log attendance, manage your commissions, and access resources.</p>
          <div className="flex items-center gap-1 text-emerald-300 text-sm font-medium group-hover:gap-2 transition-all">
            RM Login <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      <p className="text-white/20 text-xs mt-10 font-mono">De La Salle University — Fabrication Laboratory</p>
    </div>
  );
}
