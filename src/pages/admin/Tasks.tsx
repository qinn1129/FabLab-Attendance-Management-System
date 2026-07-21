import React, { useState, useEffect } from "react";
import { Plus, Zap, Trash2, ListChecks, History } from "lucide-react";
import { PageHeader, Select, StatusBadge, Input } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";
import { tasksService, pickLeastBusyMakerId, type RMTask, type RMTaskStatus } from "../../services/tasksService";
import { formatSmartTimestamp } from "../../lib/dateFormat";
import { cn } from "../../lib/utils";

const STATUS_OPTIONS: RMTaskStatus[] = ["Pending", "In Progress", "Completed"];
const AUTO_ASSIGN_VALUE = "__auto__";

/**
 * Task Assignment view for Admins. Backed by the "tasks" sheet — real
 * registered Resident Makers only, manual assignment, and an Assignment
 * Log tab that doubles as a backlog for verifying where auto-assignment
 * sent each task.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminTasks() {
  const [view, setView] = useState<"byRM" | "log">("byRM");
  const [makers, setMakers] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<RMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRM, setFilterRM] = useState("All");

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ task: "", deadline: "", assignTo: AUTO_ASSIGN_VALUE });
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [makersData, tasksData] = await Promise.all([
      accountsService.fetchResidentMakers(),
      tasksService.fetchTasks(),
    ]);
    setMakers(makersData.filter(m => m.status === "Active"));
    setTasks(tasksData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getMakerName = (id: string): string => {
    const found = makers.find(m => m.id === id);
    return found ? `${found.firstName} ${found.lastName}` : "Unknown / Inactive Maker";
  };

  async function handleAddTask() {
    setFormError("");
    if (!form.task.trim()) {
      setFormError("Please describe the task.");
      return;
    }
    if (makers.length === 0) {
      setFormError("No active Resident Makers to assign this to.");
      return;
    }

    let rmId: string;
    let source: "Manual" | "Auto";

    if (form.assignTo === AUTO_ASSIGN_VALUE) {
      const picked = pickLeastBusyMakerId(makers.map(m => m.id), tasks);
      if (!picked) {
        setFormError("Could not determine an RM to auto-assign to.");
        return;
      }
      rmId = picked;
      source = "Auto";
    } else {
      rmId = form.assignTo;
      source = "Manual";
    }

    setSaving(true);
    const saved = await tasksService.addTask({
      rm_id: rmId,
      task: form.task.trim(),
      deadline: form.deadline,
      source,
    });
    setTasks(t => [saved, ...t]);
    setSaving(false);
    setForm({ task: "", deadline: "", assignTo: AUTO_ASSIGN_VALUE });
    setAdding(false);
  }

  async function handleStatusChange(id: string, status: RMTaskStatus) {
    setTasks(t => t.map(x => x.id === id ? { ...x, status } : x));
    await tasksService.updateTask(id, { status });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this task?")) return;
    setTasks(t => t.filter(x => x.id !== id));
    await tasksService.deleteTask(id);
  }

  const makerNameOptions = ["All", ...makers.map(m => `${m.firstName} ${m.lastName}`)];
  const selectedMakerId = filterRM === "All" ? null : makers.find(m => `${m.firstName} ${m.lastName}` === filterRM)?.id;

  const visibleTasks = selectedMakerId ? tasks.filter(t => t.rm_id === selectedMakerId) : tasks;

  // Group visible tasks by RM for the "By RM" view.
  const grouped: Record<string, RMTask[]> = {};
  visibleTasks.forEach(t => {
    if (!grouped[t.rm_id]) grouped[t.rm_id] = [];
    grouped[t.rm_id].push(t);
  });
  // Ensure every active RM shows up even with zero tasks, when not filtered to "All"-but-empty edge cases.
  makers.forEach(m => {
    if (!selectedMakerId || selectedMakerId === m.id) {
      if (!grouped[m.id]) grouped[m.id] = [];
    }
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Task Assignment"
        sub="Assign and track tasks for registered Resident Makers"
        action={
          <button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" />New Task
          </button>
        }
      />

      {adding && (
        <div className="bg-card rounded-xl border border-emerald-500/30 p-5 mb-5 space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Task Description <span className="text-red-500">*</span></label>
            <textarea
              value={form.task}
              onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
              rows={2}
              placeholder="e.g. Complete COM-014 (Blue PETG print)"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Deadline" type="date" value={form.deadline} onChange={v => setForm(f => ({ ...f, deadline: v }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Assign To</label>
              <select
                value={form.assignTo}
                onChange={e => setForm(f => ({ ...f, assignTo: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value={AUTO_ASSIGN_VALUE}>⚡ Auto-assign (least workload)</option>
                {makers.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          <div className="flex gap-2">
            <button onClick={handleAddTask} disabled={saving || !form.task.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {saving ? "Assigning..." : "Assign Task"}
            </button>
            <button onClick={() => { setAdding(false); setFormError(""); }} className="bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button onClick={() => setView("byRM")} className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition", view === "byRM" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground")}>
            <ListChecks className="w-3.5 h-3.5" /> By Resident Maker
          </button>
          <button onClick={() => setView("log")} className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition", view === "log" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground")}>
            <History className="w-3.5 h-3.5" /> Assignment Log
          </button>
        </div>

        {view === "byRM" && (
          <div className="w-56">
            <Select label="" value={filterRM || "All"} onChange={setFilterRM} options={makerNameOptions} />
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading tasks...</p>
      ) : makers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No active Resident Makers yet. Register one under RM Accounts first.</p>
        </div>
      ) : view === "byRM" ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([rmId, rmTasks]) => {
            const name = getMakerName(rmId);
            return (
              <div key={rmId} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted border-b border-border flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-500 text-xs font-bold">{name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <span className="font-semibold text-card-foreground text-sm">{name}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{rmTasks.length} task{rmTasks.length !== 1 ? "s" : ""}</span>
                </div>

                {rmTasks.length === 0 ? (
                  <p className="px-5 py-4 text-muted-foreground text-sm">No tasks assigned.</p>
                ) : (
                  <div className="divide-y divide-muted">
                    {rmTasks.map(t => (
                      <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                        <span className="flex-1 text-sm text-card-foreground">{t.task}</span>
                        {t.deadline && <span className="text-xs font-mono text-muted-foreground">{t.deadline}</span>}
                        <select
                          value={t.status}
                          onChange={e => handleStatusChange(t.id, e.target.value as RMTaskStatus)}
                          className="text-xs border border-border bg-background text-foreground rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-400"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          t.source === "Auto" ? "bg-violet-500/10 text-violet-600 border border-violet-500/20" : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {t.source === "Auto" ? "⚡ Auto" : "Manual"}
                        </span>
                        <button onClick={() => handleDelete(t.id)} className="p-1 text-muted-foreground hover:text-red-500 rounded transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // ── Assignment Log: chronological backlog for verifying auto-assignment ──
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["Task", "Assigned To", "Source", "Deadline", "Status", "Created"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">No tasks have been assigned yet.</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id} className="border-b border-muted hover:bg-muted/50 transition">
                  <td className="px-4 py-3 text-foreground max-w-[260px]">{t.task}</td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{getMakerName(t.rm_id)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      t.source === "Auto" ? "bg-violet-500/10 text-violet-600 border border-violet-500/20" : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {t.source === "Auto" ? "⚡ Auto-assigned" : "Manual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{t.deadline || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap" title={t.createdAt}>
                    {formatSmartTimestamp(t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}