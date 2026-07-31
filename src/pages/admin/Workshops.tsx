import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, Check, X, Link2, Calendar } from "lucide-react";
import { PageHeader, Input, TagInput } from "../../components/common";
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

/**
 * Workshops management view for Admins. CRUD backed by the "workshops"
 * sheet — mirrors the client-facing WorkshopsSection cards, including
 * attaching an external booking link (e.g. Luma).
 *
 * QOL: the Date field is now a strict `<input type="date">` (stored as
 * ISO "YYYY-MM-DD") instead of free text, and rendered through
 * formatFlexibleDate for a readable "Month D, YYYY" label. The Tag field
 * is now a clickable multi-tag picker with autocomplete suggestions
 * (TagInput) instead of a single free-text string — tags are still stored
 * under the hood as a comma-separated string in the same "tag" sheet
 * column, so no backend schema change was needed.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminWorkshops() {
  const [items, setItems] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", tags: [] as string[], image: "", link: "" });

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
    });
    setItems(i => [...i, saved]);
    setSaving(false);
    setForm({ title: "", date: "", tags: [], image: "", link: "" });
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

  return (
    <div className="p-6">
      <PageHeader
        title="Workshops"
        sub="Manage workshops shown on the client landing page, including external booking links"
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />Add Workshop</button>}
      />

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
            return (
              <div key={w.id} className="bg-card rounded-xl border border-border p-5">
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
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" /> {formatFlexibleDate(w.date)}
                        </span>
                        <p className="font-semibold text-foreground text-sm truncate">{w.title}</p>
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