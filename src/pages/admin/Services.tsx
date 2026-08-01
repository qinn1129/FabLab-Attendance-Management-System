import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { PageHeader, Input, Select, ToggleSwitch } from "../../components/common";
import { servicesService, type ServiceOffering } from "../../services/servicesService";
import { SERVICE_ICON_OPTIONS, getServiceIcon } from "../../constants/serviceIcons";

/** Matches the `.slice(0, 4)` cap on the client-facing ServicesSection — keep these in sync. */
const CLIENT_PAGE_LIMIT = 4;

/** Treats a missing `visible` (rows saved before this field existed) as visible, matching servicesService's fetch-time default. */
const isVisible = (s: ServiceOffering) => s.visible !== false;

/**
 * Service Offerings management view for Admins. CRUD backed by the
 * "services" sheet — mirrors the client-facing ServicesSection cards.
 *
 * QOL: Admins now explicitly choose which services appear on the client
 * landing page via a "Show on Client Page" toggle per service, capped at
 * CLIENT_PAGE_LIMIT (matches the client page's own `.slice(0, 4)`) so it's
 * impossible to accidentally mark more services visible than the landing
 * page actually has room to show.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminServices() {
  const [items, setItems] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", desc: "", icon: "Package", image: "", visible: true });
  const [limitWarning, setLimitWarning] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", desc: "", icon: "Package", image: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await servicesService.fetchServices();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visibleCount = items.filter(isVisible).length;
  const atLimit = visibleCount >= CLIENT_PAGE_LIMIT;

  // Keep the "Show on Client Page" checkbox on the Add form honest with
  // the live count — auto-uncheck it if the limit fills up while the form
  // is open, so admins can't submit past the cap.
  useEffect(() => {
    if (adding && atLimit && form.visible) {
      setForm(f => ({ ...f, visible: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atLimit, adding]);

  async function addItem() {
    if (!form.title.trim() || !form.desc.trim()) return;
    setSaving(true);
    const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) + 1 : 0;
    const saved = await servicesService.addService({
      title: form.title,
      desc: form.desc,
      icon: form.icon,
      image: form.image,
      order: nextOrder,
      visible: form.visible,
    });
    setItems(i => [...i, saved]);
    setSaving(false);
    setForm({ title: "", desc: "", icon: "Package", image: "", visible: true });
    setAdding(false);
  }

  async function deleteItem(id: string) {
    setItems(i => i.filter(x => x.id !== id));
    await servicesService.deleteService(id);
  }

  function startEdit(s: ServiceOffering) {
    setEditId(s.id);
    setEditForm({ title: s.title, desc: s.desc, icon: s.icon, image: s.image || "" });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ title: "", desc: "", icon: "Package", image: "" });
  }

  async function saveEdit(id: string) {
    if (!editForm.title.trim() || !editForm.desc.trim()) return;
    setSavingEdit(true);
    setItems(i => i.map(x => x.id === id ? { ...x, ...editForm } : x));
    await servicesService.updateService(id, editForm);
    setSavingEdit(false);
    cancelEdit();
  }

  async function toggleVisible(item: ServiceOffering) {
    const currentlyVisible = isVisible(item);
    if (!currentlyVisible && visibleCount >= CLIENT_PAGE_LIMIT) {
      setLimitWarning(`Only ${CLIENT_PAGE_LIMIT} services can be shown on the client page at once. Hide another one first.`);
      return;
    }
    setLimitWarning("");
    const next = !currentlyVisible;
    setItems(i => i.map(x => x.id === item.id ? { ...x, visible: next } : x));
    await servicesService.updateService(item.id, { visible: next });
  }

  async function moveItem(id: string, direction: "up" | "down") {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const a = items[idx];
    const b = items[swapIdx];
    const aOrder = b.order ?? swapIdx;
    const bOrder = a.order ?? idx;

    const next = [...items];
    next[idx] = { ...a, order: aOrder };
    next[swapIdx] = { ...b, order: bOrder };
    next.sort((x, y) => (x.order || 0) - (y.order || 0));
    setItems(next);

    await Promise.all([
      servicesService.updateService(a.id, { order: aOrder }),
      servicesService.updateService(b.id, { order: bOrder }),
    ]);
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Service Offerings"
        sub={`Manage the services shown on the client landing page — ${visibleCount}/${CLIENT_PAGE_LIMIT} client-page slots used`}
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />Add Service</button>}
      />

      {limitWarning && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{limitWarning}</span>
          </div>
          <button onClick={() => setLimitWarning("")} className="text-muted-foreground hover:text-foreground text-xs ml-2">Dismiss</button>
        </div>
      )}

      {adding && (
        <div className="bg-card rounded-xl border border-emerald-500/30 p-5 mb-5 space-y-3">
          <Input label="Service Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. FDM 3D Printing" required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Icon" value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} options={SERVICE_ICON_OPTIONS} />
            <Input label="Image URL (optional)" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} placeholder="https://..." />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
            <div>
              <p className="text-sm font-medium text-foreground">Show on Client Page</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {atLimit && !form.visible
                  ? `Limit reached (${CLIENT_PAGE_LIMIT}/${CLIENT_PAGE_LIMIT}) — hide another service first to free a slot.`
                  : "Visible to clients as soon as it's saved."}
              </p>
            </div>
            <ToggleSwitch
              checked={form.visible}
              onChange={() => setForm(f => ({ ...f, visible: !f.visible }))}
              disabled={atLimit && !form.visible}
              title="Show on Client Page"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={addItem} disabled={saving || !form.title || !form.desc} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setAdding(false)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading services...</p>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No services yet. Add one to have it appear on the client landing page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s, i) => {
            const isEditing = editId === s.id;
            const Icon = getServiceIcon(s.icon);
            const shown = isVisible(s);
            return (
              <div key={s.id} className={`bg-card rounded-xl border p-5 ${shown ? "border-border" : "border-border/60 opacity-70"}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <Input label="Service Title" value={editForm.title} onChange={v => setEditForm(f => ({ ...f, title: v }))} />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <textarea value={editForm.desc} onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select label="Icon" value={editForm.icon} onChange={v => setEditForm(f => ({ ...f, icon: v }))} options={SERVICE_ICON_OPTIONS} />
                      <Input label="Image URL (optional)" value={editForm.image} onChange={v => setEditForm(f => ({ ...f, image: v }))} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(s.id)} disabled={savingEdit} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                        <Check className="w-3.5 h-3.5" /> {savingEdit ? "Saving..." : "Save"}
                      </button>
                      <button onClick={cancelEdit} className="flex items-center gap-1.5 bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-border">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => moveItem(s.id, "up")} disabled={i === 0} title="Move up" className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition"><ArrowUp className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm">{s.title}</p>
                        {!shown && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{s.desc}</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-shrink-0 px-2">
                      <ToggleSwitch checked={shown} onChange={() => toggleVisible(s)} title="Show on Client Page" />
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {shown ? "Visible" : "Hidden"}
                      </span>
                    </div>

                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => moveItem(s.id, "down")} disabled={i === items.length - 1} title="Move down" className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => startEdit(s)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(s.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}