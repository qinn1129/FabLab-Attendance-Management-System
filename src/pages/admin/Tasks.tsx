import React, { useState, useEffect } from "react";
import { Plus, Trash2, ListChecks, History, Package } from "lucide-react";
import { PageHeader, Select, StatusBadge, Input } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";
import { tasksService, type RMTask, type RMTaskStatus } from "../../services/tasksService";
import { type Commission } from "../../services/sheetsService";
import { cn } from "../../lib/utils";

const STATUS_OPTIONS: RMTaskStatus[] = ["Pending", "In Progress", "Completed"];

interface UnifiedTask {
  id: string;
  rmId: string;
  rmName: string;
  description: string;
  deadline: string;
  status: string;
  source: "Commission" | "Manual";
  commissionId?: string;
}

/**
 * Task Assignment view for Admins. Commission-linked workload is pulled
 * LIVE from actual assigned commissions (the source of truth), so it can
 * never drift out of sync — no separate row needs to be manually kept in
 * sync when a commission is approved, reassigned, or completed elsewhere.
 * A separate "Manual Task" flow still exists for one-off work that isn't
 * tied to any commission (e.g. lab upkeep, training).
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminTasks({ commissions }: { commissions: Commission[] }) {
  const [view, setView] = useState<"byRM" | "log">("byRM");
  const [makers, setMakers] = useState<Account[]>([]);
  const [manualTasks, setManualTasks] = useState<RMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRM, setFilterRM] = useState("All");

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ task: "", deadline: "", assignTo: "" });
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [makersData, tasksData] = await Promise.all([
      accountsService.fetchResidentMakers(),
      tasksService.fetchTasks(),
    ]);
    setMakers(makersData.filter(m => m.status === "Active"));
    setManualTasks(tasksData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getMakerId = (name: string): string | undefined =>
    makers.find(m => `${m.firstName} ${m.lastName}` === name)?.id;

  const getMakerName = (id: string): string => {
    const found = makers.find(m => m.id === id);
    return found ? `${found.firstName} ${found.lastName}` : "Unknown / Inactive Maker";
  };

  // Live view — derived directly from currently assigned, still-active
  // commissions. This is the primary content of the Task Assignment tab.
  const commissionTasks: UnifiedTask[] = commissions
    .filter(c => c.rm && (c.status === "Pending" || c.status === "In Progress"))
    .map(c => ({
      id: `commission-${c.id}`,
      rmId: getMakerId(c.rm!) || "",
      rmName: c.rm!,
      description: `${c.service} — ${c.client}`,
      deadline: c.deadline || c.expectedPickupDate || "",
      status: c.status,
      source: "Commission" as const,
      commissionId: c.id,
    }))
    .filter(t => t.rmId); // drop any whose assigned name no longer matches an active account

  const manualUnified: UnifiedTask[] = manualTasks.map(t => ({
    id: t.id,
    rmId: t.rm_id,
    rmName: getMakerName(t.rm_id),
    description: t.task,
    deadline: t.deadline,
    status: t.status,
    source: "Manual" as const,
  }));

  const allTasks = [...commissionTasks, ...manualUnified];

  async function handleAddTask() {
    setFormError("");
    if (!form.task.trim()) {
      setFormError("Please describe the task.");
      return;
    }
    if (!form.assignTo) {
      setFormError("Please choose who this task is for.");
      return;
    }
    setSaving(true);
    const saved = await tasksService.addTask({
      rm_id: form.assignTo,
      task: form.task.trim(),
      deadline: form.deadline,
      source: "Manual",
    });
    setManualTasks(t => [saved, ...t]);
    setSaving(false);
    setForm({ task: "", deadline: "", assignTo: "" });
    setAdding(false);
  }

  async function handleStatusChange(id: string, status: RMTaskStatus) {
    setManualTasks(t => t.map(x => x.id === id ? { ...x, status } : x));
    await tasksService.updateTask(id, { status });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this task?")) return;
    setManualTasks(t => t.filter(x => x.id !== id));
    await tasksService.deleteTask(id);
  }

  const makerNameOptions = ["All", ...makers.map(m => `${m.firstName} ${m.lastName}`)];
  const selectedMakerId = filterRM === "All" ? null : makers.find(m => `${m.firstName} ${m.lastName}` === filterRM)?.id;

  const visibleTasks = selectedMakerId ? allTasks.filter(t => t.rmId === selectedMakerId) : allTasks;

  const grouped: Record<string, UnifiedTask[]> = {};
  visibleTasks.forEach(t => {
    if (!grouped[t.rmId]) grouped[t.rmId] = [];
    grouped[t.rmId].push(t);
  });
  makers.forEach(m => {
    if (!selectedMakerId || selectedMakerId === m.id) {
      if (!grouped[m.id]) grouped[m.id] = [];
    }
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Task Assignment"
        sub="Live workload pulled directly from active commissions"
        action={
          <button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" />New Manual Task
          </button>
        }
      />

      {adding && (
        <div className="bg-card rounded-xl border border-emerald-500/30 p-5 mb-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Use this only for one-off work not tied to a commission (e.g. lab upkeep, training). Commission assignments already appear automatically below.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Task Description <span className="text-red-500">*</span></label>
            <textarea
              value={form.task}
              onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
              rows={2}
              placeholder="e.g. Restock PLA filament in Cabinet B"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Deadline" type="date" value={form.deadline} onChange={v => setForm(f => ({ ...f, deadline: v }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Assign To <span className="text-red-500">*</span></label>
              <select
                value={form.assignTo}
                onChange={e => setForm(f => ({ ...f, assignTo: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Select a Resident Maker...</option>
                {makers.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          <div className="flex gap-2">
            <button onClick={handleAddTask} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {saving ? "Saving..." : "Add Task"}
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
            <History className="w-3.5 h-3.5" /> All Tasks Log
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
                  <p className="px-5 py-4 text-muted-foreground text-sm">No active tasks.</p>
                ) : (
                  <div className="divide-y divide-muted">
                    {rmTasks.map(t => (
                      <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                        <span className="flex-1 text-sm text-card-foreground">{t.description}</span>
                        {t.deadline && <span className="text-xs font-mono text-muted-foreground">{t.deadline}</span>}
                        {t.source === "Commission" ? (
                          <StatusBadge status={t.status} />
                        ) : (
                          <select
                            value={t.status}
                            onChange={e => handleStatusChange(t.id, e.target.value as RMTaskStatus)}
                            className="text-xs border border-border bg-background text-foreground rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-400"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap",
                          t.source === "Commission" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {t.source === "Commission" ? <><Package className="w-2.5 h-2.5" /> {t.commissionId}</> : "Manual"}
                        </span>
                        {t.source === "Manual" && (
                          <button onClick={() => handleDelete(t.id)} className="p-1 text-muted-foreground hover:text-red-500 rounded transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["Task", "Assigned To", "Source", "Deadline", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTasks.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">No tasks yet.</td></tr>
              ) : allTasks.map(t => (
                <tr key={t.id} className="border-b border-muted hover:bg-muted/50 transition">
                  <td className="px-4 py-3 text-foreground max-w-[260px]">{t.description}</td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{t.rmName}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap",
                      t.source === "Commission" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {t.source === "Commission" ? `📦 ${t.commissionId}` : "Manual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{t.deadline || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}