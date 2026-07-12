import React, { useState, useEffect } from "react";
import { Plus, ChevronDown, Trash2 } from "lucide-react";
import { PageHeader, Input } from "../../components/common";
import { faqService, type FAQ } from "../../services/faqService";

/**
 * FAQ Management view for Admins.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminFAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [saving, setSaving] = useState(false);

  const loadFAQs = async () => {
    setLoading(true);
    const data = await faqService.fetchFAQs();
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => { loadFAQs(); }, []);

  async function addFAQ() {
    if (!newQ || !newA) return;
    setSaving(true);
    const saved = await faqService.addFAQ(newQ, newA);
    setFaqs(f => [...f, saved]);
    setSaving(false);
    setNewQ(""); setNewA(""); setAdding(false);
  }

  async function deleteFAQ(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setFaqs(fs => fs.filter(x => x.id !== id));
    await faqService.deleteFAQ(id);
  }

  return (
    <div className="p-6">
      <PageHeader title="FAQ Management" sub="Manage frequently asked questions"
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />Add FAQ</button>}
      />

      {adding && (
        <div className="bg-card rounded-xl border border-emerald-500/30 p-5 mb-5 space-y-3">
          <Input label="Question" value={newQ} onChange={setNewQ} placeholder="Enter the question..." required />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Answer</label>
            <textarea value={newA} onChange={e => setNewA(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={addFAQ} disabled={saving || !newQ || !newA} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setAdding(false)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading FAQs...</p>
      ) : faqs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No FAQs yet.</p>
      ) : (
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden">

              <button className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/50 transition" onClick={() => setOpen(open === f.id ? null : f.id)}>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="flex-1 font-medium text-card-foreground text-sm">{f.q}</span>

                <div className="flex gap-1 ml-2">
                  <button onClick={(e) => deleteFAQ(f.id, e)} className="p-1 text-muted-foreground hover:text-red-500 rounded transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open === f.id ? "rotate-180" : ""}`} />
              </button>

              {open === f.id && (
                <div className="px-5 pb-4 border-t border-muted">
                  <p className="text-muted-foreground text-sm leading-relaxed pt-3">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}