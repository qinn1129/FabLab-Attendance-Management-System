import { useState } from "react";
import {
  X, ChevronRight, ChevronDown, Check,
  Bell, User, Users, Calendar,
  Package, Settings, LogOut, Plus, Edit2, Trash2,
  BarChart2, FileText, Link2, HelpCircle,
  Pin, CheckCircle,
  Book, Layers, Youtube, Filter,
  Award, Download, Eye
} from "lucide-react";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { StatusBadge, Input, Select, PageHeader, StatCard, ChatWidget } from "./shared";
import {
  RESIDENT_MAKERS, COMMISSIONS, PENDING_APPROVALS,
  ANNOUNCEMENTS_DATA, MODULES_DATA, FAQS_DATA,
  CHART_COMMISSION, CHART_STATUS
} from "./data";

// ─── Types & Nav ───────────────────────────────

type AdminScreen = "dashboard"|"rm-schedules"|"approvals"|"tracker"|"tasks"|"announcements"|"modules"|"rm-accounts"|"profile"|"faq";

const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "rm-schedules", label: "RM Schedules", icon: Calendar },
  { id: "approvals", label: "Commission Approval", icon: CheckCircle },
  { id: "tracker", label: "Commission Tracker", icon: Package },
  { id: "tasks", label: "Task Assignment", icon: Layers },
  { id: "announcements", label: "Announcements & Chat", icon: Bell },
  { id: "modules", label: "Modules", icon: Book },
  { id: "rm-accounts", label: "RM Accounts", icon: Users },
  { id: "profile", label: "Admin Profile", icon: User },
  { id: "faq", label: "FAQ Management", icon: HelpCircle },
];

// ─── Admin Root ────────────────────────────────

export default function AdminFlow({ onBack }: { onBack: () => void }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState<AdminScreen>("dashboard");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!loggedIn) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #052e16 0%, #064e3b 60%, #0f172a 100%)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Admin Portal</h2>
          <p className="text-gray-400 text-sm mt-1">DLSU FabLab Management System</p>
        </div>
        <div className="space-y-3 mb-5">
          <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="admin@dlsu.edu.ph" />
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
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 flex flex-col transition-all duration-200`} style={{ background: "#0a2218" }}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-white/5">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">DLSU FabLab</p>
              <p className="text-emerald-400 text-xs font-mono">Admin</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="text-white/40 hover:text-white transition p-1">
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(n => {
            const Icon = n.icon;
            const active = screen === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setScreen(n.id as AdminScreen)}
                title={!sidebarOpen ? n.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all rounded-none ${active ? "bg-emerald-600/20 text-emerald-300 border-r-2 border-emerald-400" : "text-white/50 hover:text-white hover:bg-white/5"}`}
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
        <AdminScreenRouter screen={screen} />
      </main>

      <ChatWidget accentColor="emerald" />
    </div>
  );
}

// ─── Screen Router ─────────────────────────────

function AdminScreenRouter({ screen }: { screen: AdminScreen }) {
  switch (screen) {
    case "dashboard": return <AdminDashboard />;
    case "rm-schedules": return <AdminRMSchedules />;
    case "approvals": return <AdminApprovals />;
    case "tracker": return <AdminTracker />;
    case "tasks": return <AdminTasks />;
    case "announcements": return <AdminAnnouncements />;
    case "modules": return <AdminModules />;
    case "rm-accounts": return <AdminRMAccounts />;
    case "profile": return <AdminProfile />;
    case "faq": return <AdminFAQ />;
    default: return <AdminDashboard />;
  }
}

// ─── Dashboard ─────────────────────────────────

function AdminDashboard() {
  return (
    <div className="p-6">
      <PageHeader title="Dashboard" sub="FabLab overview — Mon, June 23, 2026" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Commissions" value={56} sub="+3 this week" color="text-gray-900" />
        <StatCard label="Pending Approval" value={3} sub="Requires action" color="text-orange-500" />
        <StatCard label="Active RMs" value={4} sub="1 on leave" color="text-emerald-600" />
        <StatCard label="Completed Today" value={2} sub="COMs approved" color="text-blue-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Commissions This Week</h3>
          <ResponsiveContainer width="100%" height={180}>
            <ReBarChart data={CHART_COMMISSION} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={CHART_STATUS} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {CHART_STATUS.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {CHART_STATUS.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-gray-600">{s.name}</span>
                </div>
                <span className="font-mono font-semibold text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Commissions</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["ID","Client","Service","Assigned RM","Status"].map(h => (
                <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMISSIONS.slice(0, 5).map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="py-2 pr-4 font-mono text-xs text-gray-500">{c.id}</td>
                <td className="py-2 pr-4 font-medium text-gray-900">{c.client}</td>
                <td className="py-2 pr-4 text-gray-600">{c.service}</td>
                <td className="py-2 pr-4 text-gray-600">{c.rm || <span className="text-gray-400">Unassigned</span>}</td>
                <td className="py-2"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RM Schedules ──────────────────────────────

function AdminRMSchedules() {
  const days = ["Mon","Tue","Wed","Thu","Fri"];
  return (
    <div className="p-6">
      <PageHeader title="RM List & Schedules" sub="All Resident Makers and their weekly schedule" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Name","Program","Year","Mon","Tue","Wed","Thu","Fri","Hrs / Week","Total Hrs","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESIDENT_MAKERS.map(rm => (
              <tr key={rm.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{rm.name}</td>
                <td className="px-3 py-3 text-gray-500 text-xs">{rm.program}</td>
                <td className="px-3 py-3 text-gray-500 text-center font-mono">{rm.year}</td>
                {days.map(d => (
                  <td key={d} className="px-3 py-3 text-center">
                    {rm.schedule.includes(d) ? (
                      <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-gray-50 mx-auto" />
                    )}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-mono font-semibold text-gray-700">{rm.hoursWeek}h</td>
                <td className="px-3 py-3 text-center font-mono text-gray-500">{rm.totalHours}h</td>
                <td className="px-3 py-3"><StatusBadge status={rm.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">RM Progress Overview</h3>
        <div className="space-y-3">
          {RESIDENT_MAKERS.map(rm => (
            <div key={rm.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-700 text-xs font-bold">{rm.name.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 font-medium truncate">{rm.name}</span>
                  <span className="text-xs font-mono text-gray-500 ml-2">{rm.totalHours}h total</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((rm.totalHours / 400) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Commission Approval ───────────────────────

function AdminApprovals() {
  const [items, setItems] = useState(PENDING_APPROVALS);

  return (
    <div className="p-6">
      <PageHeader title="Commission Approval" sub={`${items.length} requests awaiting review`} />
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
                <div>
                  <p className="text-xs text-gray-400">Client</p>
                  <p className="text-sm font-semibold text-gray-900">{item.client}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Service</p>
                  <p className="text-sm text-gray-700">{item.service}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Contact</p>
                  <p className="text-sm text-gray-700 truncate">{item.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="text-sm font-mono text-gray-600">{item.submitted}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setItems(i => i.filter(x => x.id !== item.id))} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => setItems(i => i.filter(x => x.id !== item.id))} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Commission Tracker ────────────────────────

function AdminTracker() {
  const [coms, setComs] = useState(COMMISSIONS);
  const [editId, setEditId] = useState<string|null>(null);
  const [assignRM, setAssignRM] = useState<Record<string,string>>({});

  return (
    <div className="p-6">
      <PageHeader title="Commission Tracker" sub="Full view of all active and completed commissions" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["ID","Client","Service","Assigned RM","Deadline","Printer","Status","Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coms.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{c.id}</td>
                <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{c.client}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{c.service}</td>
                <td className="px-3 py-2.5 min-w-[140px]">
                  {editId === c.id ? (
                    <select
                      value={assignRM[c.id] ?? c.rm ?? ""}
                      onChange={e => setAssignRM(r => ({ ...r, [c.id]: e.target.value }))}
                      className="text-xs border border-gray-200 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                    >
                      <option value="">Unassigned</option>
                      {RESIDENT_MAKERS.filter(r => r.status === "Active").map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  ) : (
                    <span className={c.rm ? "text-gray-700" : "text-gray-400 italic"}>{c.rm || "Unassigned"}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">{c.deadline}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{c.printer || <span className="text-gray-300">—</span>}</td>
                <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    {editId === c.id ? (
                      <button onClick={() => { setComs(cs => cs.map(x => x.id === c.id ? { ...x, rm: assignRM[c.id] ?? x.rm } : x)); setEditId(null); }} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => setEditId(c.id)} className="p-1.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Task Assignment ───────────────────────────

function AdminTasks() {
  const [tab, setTab] = useState<"selected"|"all">("selected");
  const [selectedRM, setSelectedRM] = useState("Juan dela Cruz");

  const tasks: Record<string, { id: number; task: string; deadline: string; status: string }[]> = {
    "Juan dela Cruz": [
      { id: 1, task: "Complete COM-001 (Black PLA print)", deadline: "Jun 27", status: "In Progress" },
      { id: 2, task: "Quality check COM-003 pickup", deadline: "Jun 25", status: "Pending" },
    ],
    "Ana Reyes": [
      { id: 3, task: "Design file for COM-002", deadline: "Jun 28", status: "In Progress" },
    ],
    "Miguel Bautista": [
      { id: 4, task: "Deliver COM-003 keychain", deadline: "Jun 26", status: "Completed" },
      { id: 5, task: "Prepare material inventory report", deadline: "Jun 30", status: "Pending" },
    ],
    "Carlos Santos": [
      { id: 6, task: "Monitor COM-005 ABS print (12h)", deadline: "Jun 28", status: "In Progress" },
    ],
  };

  const displayData = tab === "selected" ? { [selectedRM]: tasks[selectedRM] ?? [] } : tasks;

  return (
    <div className="p-6">
      <PageHeader title="Task Assignment" sub="View and assign tasks to Resident Makers" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
        {(["selected","all"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "selected" ? "Selected RM" : "All RMs"}
          </button>
        ))}
      </div>
      {tab === "selected" && (
        <div className="mb-4">
          <Select label="Select Resident Maker" value={selectedRM} onChange={setSelectedRM} options={RESIDENT_MAKERS.filter(r => r.status === "Active").map(r => r.name)} />
        </div>
      )}
      <div className="space-y-4">
        {Object.entries(displayData).map(([rmName, rmTasks]) => (
          <div key={rmName} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 text-xs font-bold">{rmName.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <span className="font-semibold text-gray-800 text-sm">{rmName}</span>
              <span className="ml-auto text-xs text-gray-400 font-mono">{rmTasks.length} task{rmTasks.length !== 1 ? "s" : ""}</span>
            </div>
            {rmTasks.length === 0 ? (
              <p className="px-5 py-4 text-gray-400 text-sm">No tasks assigned.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {rmTasks.map(t => (
                  <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "Completed" ? "bg-emerald-400" : t.status === "In Progress" ? "bg-blue-400" : "bg-yellow-400"}`} />
                    <span className="flex-1 text-sm text-gray-800">{t.task}</span>
                    <span className="text-xs font-mono text-gray-400">{t.deadline}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Announcements ─────────────────────────────

function AdminAnnouncements() {
  const [anns, setAnns] = useState(ANNOUNCEMENTS_DATA);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  function bump(id: number) {
    setAnns(a => [{ ...a.find(x => x.id === id)!, date: "Jun 23 (bumped)" }, ...a.filter(x => x.id !== id)]);
  }

  function addAnn() {
    if (!newTitle || !newBody) return;
    setAnns(a => [{ id: Date.now(), title: newTitle, body: newBody, date: "Jun 23", pinned: false }, ...a]);
    setNewTitle(""); setNewBody(""); setAdding(false);
  }

  return (
    <div className="p-6">
      <PageHeader title="Announcements & Chat" sub="Manage public announcements and team communication"
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />New</button>}
      />
      {adding && (
        <div className="bg-white rounded-xl border border-emerald-200 p-5 mb-5 space-y-3">
          <Input label="Title" value={newTitle} onChange={setNewTitle} placeholder="Announcement title" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Body</label>
            <textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={3} placeholder="Announcement body text..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={addAnn} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Post</button>
            <button onClick={() => setAdding(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {anns.map(a => (
          <div key={a.id} className={`bg-white rounded-xl border p-5 ${a.pinned ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500" />}
                  <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                  <span className="text-gray-400 text-xs font-mono ml-auto">{a.date}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{a.body}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => bump(a.id)} className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition">
                  Bump ↑
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setAnns(a2 => a2.filter(x => x.id !== a.id))} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modules ───────────────────────────────────

function AdminModules() {
  const [mods, setMods] = useState(MODULES_DATA);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title:"", desc:"", yt:"", gd:"" });

  function addMod() {
    if (!form.title) return;
    setMods(m => [...m, { id: Date.now(), ...form }]);
    setForm({ title:"", desc:"", yt:"", gd:"" }); setAdding(false);
  }

  return (
    <div className="p-6">
      <PageHeader title="Modules Management" sub="Training resources and reference materials"
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />Add Module</button>}
      />
      {adding && (
        <div className="bg-white rounded-xl border border-emerald-200 p-5 mb-5 space-y-3">
          <Input label="Module Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Advanced Slicer Settings" required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="YouTube Link" value={form.yt} onChange={v => setForm(f => ({ ...f, yt: v }))} placeholder="https://youtube.com/..." />
            <Input label="GDrive Link" value={form.gd} onChange={v => setForm(f => ({ ...f, gd: v }))} placeholder="https://drive.google.com/..." />
          </div>
          <div className="flex gap-2">
            <button onClick={addMod} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Save</button>
            <button onClick={() => setAdding(false)} className="bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["#","Title","Description","YouTube","GDrive","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mods.map((m, i) => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 max-w-[180px]">{m.title}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] leading-relaxed">{m.desc}</td>
                <td className="px-4 py-3">
                  <a href={m.yt} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs">
                    <Youtube className="w-3.5 h-3.5" /> Watch
                  </a>
                </td>
                <td className="px-4 py-3">
                  <a href={m.gd} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs">
                    <FileText className="w-3.5 h-3.5" /> Open
                  </a>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setMods(ms => ms.filter(x => x.id !== m.id))} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RM Accounts ───────────────────────────────

function AdminRMAccounts() {
  const [tab, setTab] = useState<"list"|"requests"|"register">("list");
  const [regForm, setRegForm] = useState({ firstName:"", lastName:"", email:"" });
  const [requests] = useState([
    { id: 1, rm: "Carlos Santos", type: "Late Attendance", date: "Jun 23", reason: "Delayed due to traffic and public transport disruption.", status: "Pending" },
    { id: 2, rm: "Ana Reyes", type: "Missed Schedule", date: "Jun 20", reason: "Family emergency.", status: "Approved" },
  ]);

  return (
    <div className="p-6">
      <PageHeader title="RM Account Management" sub="Manage Resident Maker accounts and attendance" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
        {(["list","requests","register"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "list" ? "RM List" : t === "requests" ? "Attendance Requests" : "Register New RM"}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Name","Email","Program","Year","Total Hours","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESIDENT_MAKERS.map(rm => (
                <tr key={rm.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{rm.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{rm.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{rm.program}</td>
                  <td className="px-4 py-3 text-center font-mono">{rm.year}</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-gray-700">{rm.totalHours}h</td>
                  <td className="px-4 py-3"><StatusBadge status={rm.status} /></td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{r.rm}</span>
                    <span className="bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium px-2 py-0.5 rounded">{r.type}</span>
                    <span className="text-gray-400 text-xs font-mono ml-2">{r.date}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{r.reason}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  <StatusBadge status={r.status} />
                  {r.status === "Pending" && (
                    <>
                      <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">Approve</button>
                      <button className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition">Reject</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "register" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-md">
          <h3 className="font-semibold text-gray-900 mb-4">Register New Resident Maker</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={regForm.firstName} onChange={v => setRegForm(f => ({ ...f, firstName: v }))} placeholder="e.g. Juan" required />
              <Input label="Last Name" value={regForm.lastName} onChange={v => setRegForm(f => ({ ...f, lastName: v }))} placeholder="e.g. dela Cruz" required />
            </div>
            <Input label="Email Address" type="email" value={regForm.email} onChange={v => setRegForm(f => ({ ...f, email: v }))} placeholder="name@dlsu.edu.ph" required />
          </div>
          <button onClick={() => setRegForm({ firstName:"", lastName:"", email:"" })} className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition">
            Create RM Account
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Admin Profile ─────────────────────────────

function AdminProfile() {
  const [form, setForm] = useState({
    firstName: "Dominic", lastName: "Jucutan",
    desc: "FabLab Administrator at De La Salle University since 2022. Passionate about democratizing fabrication technology for all students.",
    hobbies: "3D Printing, Electronics, Photography, Hiking",
    motto: "Build, iterate, and never stop learning.",
  });

  return (
    <div className="p-6">
      <PageHeader title="Admin Profile" sub="Your account information and bio" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
            {form.firstName[0]}{form.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{form.firstName} {form.lastName}</p>
            <p className="text-gray-400 text-sm">FabLab Administrator · DLSU</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Input label="Last Name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Hobbies</label>
            <textarea value={form.hobbies} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
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

// ─── FAQ Management ────────────────────────────

function AdminFAQ() {
  const [faqs, setFaqs] = useState(FAQS_DATA);
  const [open, setOpen] = useState<number|null>(null);
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  function addFAQ() {
    if (!newQ || !newA) return;
    setFaqs(f => [...f, { id: Date.now(), q: newQ, a: newA }]);
    setNewQ(""); setNewA(""); setAdding(false);
  }

  return (
    <div className="p-6">
      <PageHeader title="FAQ Management" sub="Manage frequently asked questions"
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />Add FAQ</button>}
      />
      {adding && (
        <div className="bg-white rounded-xl border border-emerald-200 p-5 mb-5 space-y-3">
          <Input label="Question" value={newQ} onChange={setNewQ} placeholder="Enter the question..." required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Answer</label>
            <textarea value={newA} onChange={e => setNewA(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={addFAQ} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Save</button>
            <button onClick={() => setAdding(false)} className="bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <div key={f.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition" onClick={() => setOpen(open === f.id ? null : f.id)}>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="flex-1 font-medium text-gray-900 text-sm">{f.q}</span>
              <div className="flex gap-1 ml-2">
                <button onClick={e => { e.stopPropagation(); setFaqs(fs => fs.filter(x => x.id !== f.id)); }} className="p-1 text-gray-400 hover:text-red-500 rounded transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open === f.id ? "rotate-180" : ""}`} />
            </button>
            {open === f.id && (
              <div className="px-5 pb-4 border-t border-gray-50">
                <p className="text-gray-600 text-sm leading-relaxed pt-3">{f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
