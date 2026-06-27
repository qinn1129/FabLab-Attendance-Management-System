import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, MessageSquare } from "lucide-react";
import { CHAT_MSGS } from "./data";

// ─── StatusBadge ───────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    "Pending": "bg-yellow-50 text-yellow-700 border border-yellow-200",
    "Approved": "bg-green-50 text-green-700 border border-green-200",
    "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
    "Completed": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Rejected": "bg-red-50 text-red-700 border border-red-200",
    "Awaiting Approval": "bg-orange-50 text-orange-700 border border-orange-200",
    "Active": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "On Leave": "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${cfg[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ─── Input ─────────────────────────────────────

export function Input({ label, type = "text", value, onChange, placeholder, required }: {
  label?: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
      />
    </div>
  );
}

// ─── Select ────────────────────────────────────

import { ChevronDown } from "lucide-react";

export function Select({ label, value, onChange, options }: {
  label?: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent appearance-none transition"
        >
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── PageHeader ────────────────────────────────

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {sub && <p className="text-gray-400 text-sm mt-0.5">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── StatCard ──────────────────────────────────

export function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
      {sub && <p className="text-gray-400 text-xs">{sub}</p>}
    </div>
  );
}

// ─── ChatWidget ────────────────────────────────

export function ChatWidget({ accentColor = "emerald" }: { accentColor?: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(CHAT_MSGS);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, msgs]);

  function sendMsg() {
    if (!draft.trim()) return;
    setMsgs(m => [...m, { id: Date.now(), sender: "You", avatar: "ME", mine: true, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text: draft.trim() }]);
    setDraft("");
  }

  const accent = accentColor === "violet" ? "bg-violet-600 hover:bg-violet-700" : "bg-emerald-600 hover:bg-emerald-700";
  const headerBg = accentColor === "violet" ? "bg-violet-600" : "bg-emerald-700";
  const bubbleMine = accentColor === "violet" ? "bg-violet-600 text-white" : "bg-emerald-600 text-white";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 rounded-2xl shadow-2xl border border-gray-200 bg-white flex flex-col overflow-hidden" style={{ height: 420 }}>
          <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">FabLab Chat</span>
              <span className="w-2 h-2 rounded-full bg-green-300" />
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {msgs.map(m => (
              <div key={m.id} className={`flex items-end gap-2 ${m.mine ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${m.mine ? (accentColor === "violet" ? "bg-violet-500" : "bg-emerald-500") : "bg-gray-400"}`}>
                  {m.avatar}
                </div>
                <div className={`max-w-[68%] rounded-2xl px-3 py-1.5 text-sm ${m.mine ? bubbleMine : "bg-white border border-gray-200 text-gray-800"}`}>
                  {!m.mine && <div className="text-[10px] font-semibold text-gray-500 mb-0.5">{m.sender}</div>}
                  <p className="leading-snug">{m.text}</p>
                  <div className={`text-[10px] mt-0.5 ${m.mine ? "text-white/60" : "text-gray-400"}`}>{m.time}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-gray-100 bg-white flex gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMsg()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-full bg-gray-100 text-sm text-gray-800 outline-none"
            />
            <button onClick={sendMsg} className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 transition ${accent}`}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition ${accent}`}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
