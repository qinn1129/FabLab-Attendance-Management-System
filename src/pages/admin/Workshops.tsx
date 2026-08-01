import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, Check, X, Link2, Calendar, AlertTriangle } from "lucide-react";
import { PageHeader, Input, TagInput, ToggleSwitch } from "../../components/common";
import { workshopsService, parseTagsString, stringifyTags, type Workshop } from "../../services/workshopService";
import { formatFlexibleDate } from "../../lib/dateFormat";

/** Curated starter suggestions shown alongside whatever tags are already in use across your workshops. */
const DEFAULT_TAG_SUGGESTIONS = [
  "Free",
  "Paid",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Hands-on",
  "Lecture",
  "Hybrid",
  "Online",
  "Limited Slots",
  "Certificate",
  "Walk-in",
];

/** Matches the `.slice(0, 3)` cap on the client-facing WorkshopsSection — keep these in sync. */
const CLIENT_PAGE_LIMIT = 3;

/** Treats a missing `visible` (rows saved before this field existed) as visible, matching workshopsService's fetch-time default. */
const isVisible = (w: Workshop) => w.visible !== false;

/**
 * Workshops management view for Admins. CRUD backed by the "workshops"
 * sheet — mirrors the client-facing WorkshopsSection cards, including
 * attaching an external booking link (e.g. Luma).
 *
 * QOL: the Date field is a strict `<input type="date">` (stored as ISO
 * "YYYY-MM-DD") rendered through formatFlexibleDate for a readable
 * "Month D, YYYY" label. The Tag field is a clickable multi-tag picker
 * with autocomplete suggestions (TagInput), still stored under the hood
 * as a comma-separated string in the existing "tag" column. Admins also
 * now explicitly choose which workshops appear on the client landing page
 * via a "Show on Client Page" toggle, capped at CLIENT_PAGE_LIMIT (matches
 * the client page's own `.slice(0, 3)`).
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminWorkshops() {
  const [items, setItems] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", tags: [] as string[], image: "", link: "", visible: true });
  const [limitWarning, setLimitWarning] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", date: "", tags: [] as string[], image: "", link: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await workshopsService.fetchWorkshops();
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

  // Suggestions = curated defaults + every tag already used across current
  // workshops, deduped case-insensitively so the picker gets smarter over time.
  const tagSuggestions = useMemo(() => {
    const used = items.flatMap(w => parseTagsString(w.tag));
    const seen = new Set<string>();
    const merged: string[] = [];
    [...DEFAULT_TAG_SUGGESTIONS, ...used].forEach(t => {
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(t);
      }
    });
    return merged;
  }, [items]);

  async function addItem() {
    if (!form.title.trim() || !form.date.trim()) return;
    setSaving(true);
    const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) + 1 : 0;
    const saved = await workshopsService.addWorkshop({
      title: form.title,
      date: form.date,
      tag: stringifyTags(form.tags),
      image: form.image,
      link: form.link,
      order: nextOrder,
      visible: form.visible,
    });
    setItems(i => [...i, saved]);
    setSaving(false);
    setForm({ title: "", date: "", tags: [], image: "", link: "", visible: true });
    setAdding(false);
  }

  async function deleteItem(id: string) {
    setItems(i => i.filter(x => x.id !== id));
    await workshopsService.deleteWorkshop(id);
  }

  function startEdit(w: Workshop) {
    setEditId(w.id);
    setEditForm({ title: w.title, date: w.date, tags: parseTagsString(w.tag), image: w.image, link: w.link || "" });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ title: "", date: "", tags: [], image: "", link: "" });
  }

  async function saveEdit(id: string) {
    if (!editForm.title.trim() || !editForm.date.trim()) return;
    setSavingEdit(true);
    const updates = {
      title: editForm.title,
      date: editForm.date,
      tag: stringifyTags(editForm.tags),
      image: editForm.image,
      link: editForm.link,
    };
    setItems(i => i.map(x => x.id === id ? { ...x, ...updates } : x));
    await workshopsService.updateWorkshop(id, updates);
    setSavingEdit(false);
    cancelEdit();
  }

  async function toggleVisible(item: Workshop) {
    const currentlyVisible = isVisible(item);
    if (!currentlyVisible && visibleCount >= CLIENT_PAGE_LIMIT) {
      setLimitWarning(`Only ${CLIENT_PAGE_LIMIT} workshops can be shown on the client page at once. Hide another one first.`);
      return;
    }
    setLimitWarning("");
    const next = !currentlyVisible;
    setItems(i => i.map(x => x.id === item.id ? { ...x, visible: next } : x));
    await workshopsService.updateWorkshop(item.id, { visible: next });
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Workshops"
        sub={`Manage workshops shown on the client landing page — ${visibleCount}/${CLIENT_PAGE_LIMIT} client-page slots used`}
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />Add Workshop</button>}
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
          <Input label="Workshop Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Intro to Fusion 360" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} required />
            <Input label="Image URL" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} placeholder="https://images.unsplash.com/..." />
          </div>
          <TagInput
            label="Tags"
            value={form.tags}
            onChange={tags => setForm(f => ({ ...f, tags }))}
            suggestions={tagSuggestions}
            helperText="e.g. Free, Beginner — click a suggestion or type your own and hit Enter."
          />
          <Input label="Booking Link (e.g. Luma)" value={form.link} onChange={v => setForm(f => ({ ...f, link: v }))} placeholder="https://lu.ma/..." />

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
            <div>
              <p className="text-sm font-medium text-foreground">Show on Client Page</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {atLimit && !form.visible
                  ? `Limit reached (${CLIENT_PAGE_LIMIT}/${CLIENT_PAGE_LIMIT}) — hide another workshop first to free a slot.`
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
            <button onClick={addItem} disabled={saving || !form.title || !form.date} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setAdding(false)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading workshops...</p>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No workshops yet. Add one to have it appear on the client landing page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(w => {
            const isEditing = editId === w.id;
            const shown = isVisible(w);
            return (
              <div key={w.id} className={`bg-card rounded-xl border p-5 ${shown ? "border-border" : "border-border/60 opacity-70"}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <Input label="Workshop Title" value={editForm.title} onChange={v => setEditForm(f => ({ ...f, title: v }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Date" type="date" value={editForm.date} onChange={v => setEditForm(f => ({ ...f, date: v }))} required />
                      <Input label="Image URL" value={editForm.image} onChange={v => setEditForm(f => ({ ...f, image: v }))} />
                    </div>
                    <TagInput
                      label="Tags"
                      value={editForm.tags}
                      onChange={tags => setEditForm(f => ({ ...f, tags }))}
                      suggestions={tagSuggestions}
                    />
                    <Input label="Booking Link" value={editForm.link} onChange={v => setEditForm(f => ({ ...f, link: v }))} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(w.id)} disabled={savingEdit || !editForm.title.trim() || !editForm.date.trim()} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                        <Check className="w-3.5 h-3.5" /> {savingEdit ? "Saving..." : "Save"}
                      </button>
                      <button onClick={cancelEdit} className="flex items-center gap-1.5 bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-border">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {w.image ? <img src={w.image} alt={w.title} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" /> {formatFlexibleDate(w.date)}
                        </span>
                        <p className="font-semibold text-foreground text-sm truncate">{w.title}</p>
                        {!shown && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            Hidden
                          </span>
                        )}
                      </div>
                      {parseTagsString(w.tag).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {parseTagsString(w.tag).map(tag => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {w.link && (
                        <a href={w.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs mt-1.5">
                          <Link2 className="w-3 h-3" /> {w.link}
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-shrink-0 px-2">
                      <ToggleSwitch checked={shown} onChange={() => toggleVisible(w)} title="Show on Client Page" />
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {shown ? "Visible" : "Hidden"}
                      </span>
                    </div>

                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => startEdit(w)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(w.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
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