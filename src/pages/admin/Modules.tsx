import React, { useState, useEffect } from "react";
import { Plus, Youtube, FileText, Trash2, Edit2, Check, X } from "lucide-react";
import { PageHeader, Input } from "../../components/common";
import { modulesService, type TrainingModule } from "../../services/modulesService";

/**
 * Modules Management view for Admins.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminModules() {
  const [mods, setMods] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", desc: "", yt: "", gd: "" });

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", desc: "", yt: "", gd: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadModules = async () => {
    setLoading(true);
    const data = await modulesService.fetchModules();
    setMods(data);
    setLoading(false);
  };

  useEffect(() => { loadModules(); }, []);

  async function addMod() {
    if (!form.title) return;
    setSaving(true);
    const saved = await modulesService.addModule(form);
    setMods(m => [...m, saved]);
    setSaving(false);
    setForm({ title: "", desc: "", yt: "", gd: "" });
    setAdding(false);
  }

  async function deleteMod(id: string) {
    setMods(ms => ms.filter(x => x.id !== id));
    await modulesService.deleteModule(id);
  }

  function startEdit(m: TrainingModule) {
    setEditId(m.id);
    setEditForm({ title: m.title, desc: m.desc, yt: m.yt, gd: m.gd });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ title: "", desc: "", yt: "", gd: "" });
  }

  async function saveEdit(id: string) {
    if (!editForm.title.trim()) return;
    setSavingEdit(true);
    setMods(ms => ms.map(x => x.id === id ? { ...x, ...editForm } : x));
    await modulesService.updateModule(id, editForm);
    setSavingEdit(false);
    cancelEdit();
  }

  return (
    <div className="p-6">
      <PageHeader title="Modules Management" sub="Training resources and reference materials"
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />Add Module</button>}
      />
      {adding && (
        <div className="bg-card rounded-xl border border-emerald-500/30 p-5 mb-5 space-y-3">

          <Input label="Module Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Advanced Slicer Settings" required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="YouTube Link" value={form.yt} onChange={v => setForm(f => ({ ...f, yt: v }))} placeholder="https://youtube.com/..." />
            <Input label="GDrive Link" value={form.gd} onChange={v => setForm(f => ({ ...f, gd: v }))} placeholder="https://drive.google.com/..." />
          </div>

          <div className="flex gap-2">
            <button onClick={addMod} disabled={saving || !form.title} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setAdding(false)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>

      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading modules...</p>
      ) : mods.length === 0 ? (
        <p className="text-muted-foreground text-sm">No modules yet.</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["#","Title","Description","YouTube","GDrive","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {mods.map((m, i) => {
                const isEditing = editId === m.id;
                if (isEditing) {
                  return (
                    <tr key={`${m.id}-${i}`} className="border-b border-muted bg-emerald-500/5">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground align-top">{i + 1}</td>
                      <td className="px-4 py-3 align-top" colSpan={4}>
                        <div className="space-y-2">
                          <input
                            value={editForm.title}
                            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Title"
                            className="w-full text-xs border border-border bg-background text-foreground rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                          <textarea
                            value={editForm.desc}
                            onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))}
                            placeholder="Description"
                            rows={2}
                            className="w-full text-xs border border-border bg-background text-foreground rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={editForm.yt}
                              onChange={e => setEditForm(f => ({ ...f, yt: e.target.value }))}
                              placeholder="YouTube link"
                              className="w-full text-xs border border-border bg-background text-foreground rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                            <input
                              value={editForm.gd}
                              onChange={e => setEditForm(f => ({ ...f, gd: e.target.value }))}
                              placeholder="GDrive link"
                              className="w-full text-xs border border-border bg-background text-foreground rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(m.id)} disabled={savingEdit} className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30 transition disabled:opacity-40" title="Save">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition" title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={`${m.id}-${i}`} className="border-b border-muted hover:bg-muted/50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-foreground max-w-[180px]">{m.title}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[220px] leading-relaxed">{m.desc}</td>

                    <td className="px-4 py-3">
                      {m.yt ? (
                        <a href={m.yt} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs">
                          <Youtube className="w-3.5 h-3.5" /> Watch
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {m.gd ? (
                        <a href={m.gd} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs">
                          <FileText className="w-3.5 h-3.5" /> Open
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(m)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteMod(m.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}