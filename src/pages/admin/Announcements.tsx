import React, { useState, useEffect } from "react";
import { Plus, Pin, Trash2 } from "lucide-react";
import { PageHeader, Input } from "../../components/common";
import { announcementsService, type Announcement } from "../../services/announcementsService";

export function AdminAnnouncements() {
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const loadAnnouncements = async () => {
    setLoading(true);
    const data = await announcementsService.fetchAnnouncements();
    setAnns(data);
    setLoading(false);
  };

  useEffect(() => { loadAnnouncements(); }, []);

  async function bump(id: string) {
    await announcementsService.updateAnnouncement(id, { createdAt: new Date().toISOString() });
    loadAnnouncements();
  }

  async function addAnn() {
    if (!newTitle || !newBody) return;
    setPosting(true);
    setPostError("");

    const saved = await announcementsService.addAnnouncement(newTitle, newBody, false);
    setAnns(a => [saved, ...a]);

    try {
      const res = await fetch("http://127.0.0.1:5001/api/send-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, body: newBody, pinned: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send emails.");
    } catch (err) {
      console.error("Failed to email Resident Makers:", err);
      setPostError(err instanceof Error ? err.message : "Failed to email Resident Makers.");
    } finally {
      setPosting(false);
      setNewTitle(""); setNewBody(""); setAdding(false);
    }
  }

  async function removeAnn(id: string) {
    setAnns(a2 => a2.filter(x => x.id !== id));
    await announcementsService.deleteAnnouncement(id);
  }

  return (
    <div className="p-6">
      <PageHeader title="Announcements & Chat" sub="Manage public announcements and team communication"
        action={<button onClick={() => setAdding(o => !o)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"><Plus className="w-4 h-4" />New</button>}
      />

      {adding && (
        <div className="bg-card rounded-xl border border-emerald-500/30 p-5 mb-5 space-y-3">
          <Input label="Title" value={newTitle} onChange={setNewTitle} placeholder="Announcement title" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Body</label>
            <textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={3} placeholder="Announcement body text..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          {postError && <p className="text-red-500 text-sm">{postError}</p>}
          <div className="flex gap-2">
            <button onClick={addAnn} disabled={posting} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {posting ? "Posting..." : "Post"}
            </button>
            <button onClick={() => setAdding(false)} className="bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium px-4 py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading announcements...</p>
      ) : anns.length === 0 ? (
        <p className="text-muted-foreground text-sm">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {anns.map(a => (
            <div key={a.id} className={`bg-card rounded-xl border p-5 ${a.pinned ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {a.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500" />}
                    <h3 className="font-semibold text-card-foreground text-sm">{a.title}</h3>
                    <span className="text-muted-foreground text-xs font-mono ml-auto">{a.date}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{a.body}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => bump(a.id)} className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-lg border border-emerald-500/20 transition">
                    Bump ↑
                  </button>
                  <button onClick={() => removeAnn(a.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}