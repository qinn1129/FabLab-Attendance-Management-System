import { useState } from "react";
import {
  ChevronRight, ChevronDown, Check,
  Clock, User, Users,
  Package, LogOut, AlertTriangle, Pin, Link2, Youtube, Book, Home
} from "lucide-react";
import { StatusBadge, Input, Select, PageHeader, StatCard, ChatWidget } from "./shared";
import { RESIDENT_MAKERS, COMMISSIONS, ANNOUNCEMENTS_DATA, MODULES_DATA, FAQS_DATA } from "./data";

// ─── Types & Nav ───────────────────────────────

type RMScreen = "dashboard"|"attendance"|"commissions"|"resources"|"profile";

const RM_NAV = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "attendance", label: "Attendance", icon: Clock },
  { id: "commissions", label: "My Commissions", icon: Package },
  { id: "resources", label: "Resources", icon: Book },
  { id: "profile", label: "Profile", icon: User },
];

// ─── RM Root ───────────────────────────────────

export default function RMFlow({ onBack }: { onBack: () => void }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState<RMScreen>("dashboard");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!loggedIn) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #0f172a 100%)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Resident Maker Portal</h2>
          <p className="text-gray-400 text-sm mt-1">DLSU FabLab — RM Dashboard</p>
        </div>
        <div className="space-y-3 mb-5">
          <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@dlsu.edu.ph" />
          <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" />
        </div>
        <button onClick={() => setLoggedIn(true)} disabled={!email || !pass} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition">
          Sign In
        </button>
        <button onClick={onBack} className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm transition text-center">
          ← Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <aside className={`${sidebarOpen ? "w-52" : "w-14"} flex-shrink-0 flex flex-col transition-all duration-200`} style={{ background: "#053321" }}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-white/5">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">Juan dela Cruz</p>
              <p className="text-emerald-400 text-xs font-mono">Resident Maker</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="text-white/40 hover:text-white transition p-1">
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {RM_NAV.map(n => {
            const Icon = n.icon;
            const active = screen === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setScreen(n.id as RMScreen)}
                title={!sidebarOpen ? n.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all ${active ? "bg-emerald-600/20 text-emerald-300 border-r-2 border-emerald-400" : "text-white/50 hover:text-white hover:bg-white/5"}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{n.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-3">
          <button onClick={() => setLoggedIn(false)} className={`w-full flex items-center gap-2.5 text-white/40 hover:text-red-400 transition text-sm py-1.5 ${!sidebarOpen && "justify-center"}`}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <RMScreenRouter screen={screen} />
      </main>

      <ChatWidget accentColor="emerald" />
    </div>
  );
}

// ─── Screen Router ─────────────────────────────

function RMScreenRouter({ screen }: { screen: RMScreen }) {
  switch (screen) {
    case "dashboard": return <RMDashboard />;
    case "attendance": return <RMAttendance />;
    case "commissions": return <RMCommissions />;
    case "resources": return <RMResources />;
    case "profile": return <RMProfile />;
    default: return <RMDashboard />;
  }
}

// ─── Dashboard ─────────────────────────────────

function RMDashboard() {
  const myCommissions = COMMISSIONS.filter(c => c.rm === "Juan dela Cruz");
  return (
    <div className="p-6">
      <PageHeader title="My Dashboard" sub="Monday, June 23, 2026 · Welcome back, Juan!" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Active Jobs" value={1} sub="In Progress" color="text-blue-600" />
        <StatCard label="Completed" value={8} sub="All time" color="text-emerald-600" />
        <StatCard label="Hours This Week" value="14h" sub="of 20h target" color="text-gray-900" />
        <StatCard label="Total Hours" value="203h" sub="Cumulative" color="text-violet-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Today&apos;s Schedule
          </h3>
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">FabLab Shift — Mon</p>
              <p className="text-xs text-gray-500">10:00 AM – 4:00 PM · Clocked in at 9:58 AM</p>
            </div>
            <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded">On Duty</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" /> My Active Jobs
          </h3>
          {myCommissions.filter(c => c.status === "In Progress").map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.id} — {c.client}</p>
                <p className="text-xs text-gray-500">{c.service} · {c.color} {c.filament} · Due {c.deadline}</p>
                <p className="text-xs text-gray-400 mt-0.5">Printer: {c.printer}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Announcements</h3>
        {ANNOUNCEMENTS_DATA.slice(0, 2).map(a => (
          <div key={a.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
            {a.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-sm font-medium text-gray-800">{a.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.body}</p>
            </div>
            <span className="text-xs text-gray-400 font-mono ml-auto whitespace-nowrap">{a.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Attendance ────────────────────────────────

function RMAttendance() {
  const [clockedIn, setClockedIn] = useState(true);
  const [clockInTime] = useState("9:58 AM");
  const [tab, setTab] = useState<"clock"|"schedule"|"request">("clock");
  const [schedDays, setSchedDays] = useState<string[]>(["Mon","Wed","Fri"]);
  const [reqForm, setReqForm] = useState({ type: "", date: "", reason: "" });
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const isFriday = new Date().getDay() === 5;

  return (
    <div className="p-6">
      <PageHeader title="Attendance System" sub="Track your time and manage schedules" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
        {(["clock","schedule","request"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "clock" ? "Time In/Out" : t === "schedule" ? "My Schedule" : "Attendance Request"}
          </button>
        ))}
      </div>

      {tab === "clock" && (
        <div className="max-w-sm">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${clockedIn ? "bg-emerald-100 ring-4 ring-emerald-200" : "bg-gray-100"}`}>
              <Clock className={`w-12 h-12 ${clockedIn ? "text-emerald-600" : "text-gray-400"}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1 font-mono">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-gray-400 text-sm mb-1">Mon, June 23, 2026</p>
            {clockedIn && <p className="text-emerald-600 text-sm font-medium">Clocked in at {clockInTime}</p>}
          </div>
          <button
            onClick={() => setClockedIn(o => !o)}
            className={`w-full py-4 rounded-xl font-bold text-lg transition ${clockedIn ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
          >
            {clockedIn ? "⏹ Clock Out" : "▶ Clock In"}
          </button>
          {clockedIn && (
            <div className="mt-3 bg-emerald-50 rounded-xl border border-emerald-100 p-3 text-center">
              <p className="text-emerald-700 text-sm">Current session: <strong className="font-mono">5h 42m</strong></p>
            </div>
          )}
        </div>
      )}

      {tab === "schedule" && (
        <div className="max-w-md bg-white rounded-xl border border-gray-100 p-6">
          {isFriday && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 text-sm"><strong>Friday reminder:</strong> Please update your schedule for next week before end of day.</p>
            </div>
          )}
          <h3 className="font-semibold text-gray-900 mb-4">Select Weekly Schedule</h3>
          <div className="grid grid-cols-7 gap-2 mb-5">
            {days.map(d => (
              <button
                key={d}
                onClick={() => setSchedDays(sd => sd.includes(d) ? sd.filter(x => x !== d) : [...sd, d])}
                className={`py-2.5 rounded-lg text-sm font-medium transition ${schedDays.includes(d) ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">Selected days:</p>
            <p className="text-sm font-medium text-gray-800">{schedDays.length > 0 ? schedDays.join(", ") : "None selected"}</p>
          </div>
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition">
            Save Schedule
          </button>
        </div>
      )}

      {tab === "request" && (
        <div className="max-w-md bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Submit Attendance Request</h3>
          <div className="space-y-3">
            <Select
              label="Request Type"
              value={reqForm.type}
              onChange={v => setReqForm(f => ({ ...f, type: v }))}
              options={["Late Attendance", "Missed Schedule", "Canceled Schedule", "Early Departure"]}
            />
            <Input label="Date" type="date" value={reqForm.date} onChange={v => setReqForm(f => ({ ...f, date: v }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
              <textarea
                value={reqForm.reason}
                onChange={e => setReqForm(f => ({ ...f, reason: e.target.value }))}
                rows={4}
                placeholder="Please provide a detailed reason for your attendance request..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
          </div>
          <button className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition">
            Submit Request
          </button>
        </div>
      )}
    </div>
  );
}

// ─── My Commissions ────────────────────────────

function RMCommissions() {
  const myJobs = COMMISSIONS.filter(c => c.rm === "Juan dela Cruz");
  const [statuses, setStatuses] = useState<Record<string,string>>(
    Object.fromEntries(myJobs.map(j => [j.id, j.status]))
  );

  return (
    <div className="p-6">
      <PageHeader title="My Commissions" sub="Your assigned fabrication jobs" />
      <div className="space-y-3">
        {myJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No commissions assigned yet.</p>
          </div>
        ) : myJobs.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">{c.id}</span>
                  <span className="font-semibold text-gray-900">{c.client}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{c.service}</span>
                  <span>Color: {c.color}</span>
                  <span>Filament: {c.filament}</span>
                  {c.printer && <span>Printer: {c.printer}</span>}
                  <span className="font-mono">Due: {c.deadline}</span>
                </div>
              </div>
              <StatusBadge status={statuses[c.id] || c.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Update status:</span>
              {["In Progress","Completed","Pending"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatuses(st => ({ ...st, [c.id]: s }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${statuses[c.id] === s ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Resources ─────────────────────────────────

function RMResources() {
  const [tab, setTab] = useState<"schedule"|"announcements"|"modules"|"faq">("schedule");
  const [faqOpen, setFaqOpen] = useState<number|null>(null);
  const days = ["Mon","Tue","Wed","Thu","Fri"];

  return (
    <div className="p-6">
      <PageHeader title="Global Resources" sub="Schedules, announcements, and learning materials" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
        {(["schedule","announcements","modules","faq"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition capitalize ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Resident Maker</th>
                {days.map(d => <th key={d} className="text-center px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {RESIDENT_MAKERS.map(rm => (
                <tr key={rm.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{rm.name}</td>
                  {days.map(d => (
                    <td key={d} className="px-3 py-3 text-center">
                      {rm.schedule.includes(d) ? <div className="w-5 h-5 rounded bg-emerald-100 mx-auto flex items-center justify-center"><Check className="w-3 h-3 text-emerald-600" /></div> : <div className="w-5 h-5 rounded bg-gray-50 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "announcements" && (
        <div className="space-y-3">
          {ANNOUNCEMENTS_DATA.map(a => (
            <div key={a.id} className={`bg-white rounded-xl border p-5 ${a.pinned ? "border-emerald-200" : "border-gray-100"}`}>
              <div className="flex items-center gap-2 mb-1">
                {a.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500" />}
                <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                <span className="text-xs text-gray-400 font-mono ml-auto">{a.date}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "modules" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#","Title","Description","YouTube","GDrive"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES_DATA.map((m, i) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{m.title}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">{m.desc}</td>
                  <td className="px-4 py-3"><a href={m.yt} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"><Youtube className="w-3.5 h-3.5" />Watch</a></td>
                  <td className="px-4 py-3"><a href={m.gd} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs"><Link2 className="w-3.5 h-3.5" />Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "faq" && (
        <div className="space-y-2 max-w-2xl">
          {FAQS_DATA.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition" onClick={() => setFaqOpen(faqOpen === f.id ? null : f.id)}>
                <span className="font-medium text-gray-900 text-sm">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${faqOpen === f.id ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === f.id && (
                <div className="px-5 pb-4 border-t border-gray-50">
                  <p className="text-gray-600 text-sm leading-relaxed pt-3">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile ───────────────────────────────────

function RMProfile() {
  const [form, setForm] = useState({
    firstName: "Juan", lastName: "dela Cruz",
    program: "BS Computer Science", year: "3rd Year",
    desc: "Passionate about 3D printing and rapid prototyping. I love helping fellow Lasallians bring their projects to life at FabLab.",
    hobbies: "3D Printing, Guitar, Badminton, Coding",
    motto: "Fail fast, learn faster.",
  });

  return (
    <div className="p-6">
      <PageHeader title="My Profile" sub="Your RM account and personal information" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
            {form.firstName[0]}{form.lastName.split(" ").pop()?.[0] ?? ""}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{form.firstName} {form.lastName}</p>
            <p className="text-gray-400 text-sm">{form.program} · {form.year}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-600 text-xs font-medium">Active Resident Maker</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Input label="Last Name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
          </div>
          <Select label="Bachelor's Program" value={form.program} onChange={v => setForm(f => ({ ...f, program: v }))} options={["BS Computer Science","BS Computer Engineering","BS Electronics Engineering","BS Mechanical Engineering","BS Industrial Design","BS Information Technology","BS Biology"]} />
          <Select label="Year Level" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} options={["1st Year","2nd Year","3rd Year","4th Year","5th Year"]} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Hobbies</label>
            <input value={form.hobbies} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Motto in Life</label>
            <input value={form.motto} onChange={e => setForm(f => ({ ...f, motto: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>
        <button className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition">
          Save Changes
        </button>
      </div>
    </div>
  );
}
