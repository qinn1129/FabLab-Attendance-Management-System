import React, { useState, useEffect } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { testimonialsService, type Testimonial } from "../../services/testimonialsService";
import { cn } from "../../lib/utils";

/**
 * Testimonial approval view for Admins.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"Pending" | "Approved" | "Rejected" | "All">("Pending");
  const [actionError, setActionError] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await testimonialsService.fetchTestimonials();
    setItems(data.sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || "")));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActionError("");
    setItems(i => i.map(x => x.id === id ? { ...x, status: "Approved" } : x));
    try {
      await testimonialsService.updateTestimonial(id, { status: "Approved" });
    } catch {
      setActionError("Failed to approve testimonial.");
      load();
    }
  };

  const handleReject = async (id: string) => {
    setActionError("");
    setItems(i => i.map(x => x.id === id ? { ...x, status: "Rejected" } : x));
    try {
      await testimonialsService.updateTestimonial(id, { status: "Rejected" });
    } catch {
      setActionError("Failed to reject testimonial.");
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this testimonial?")) return;
    setItems(i => i.filter(x => x.id !== id));
    await testimonialsService.deleteTestimonial(id);
  };

  const filtered = items.filter(t => tab === "All" || t.status === tab);
  const pendingCount = items.filter(t => t.status === "Pending").length;

  return (
    <div className="p-6">
      <PageHeader title="Testimonials" sub={`${pendingCount} awaiting review`} />

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {(["Pending", "Approved", "Rejected", "All"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition",
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            {t}{t === "Pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {actionError && <p className="text-red-500 text-sm mb-3">{actionError}</p>}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading testimonials...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No {tab.toLowerCase()} testimonials.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{t.name}</span>
                    <span className="text-muted-foreground text-xs">· {t.program}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <StatusBadge status={t.status} />
                    {t.shownCount > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                        Shown {t.shownCount}×
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-1.5">
                    {t.submittedAt ? new Date(t.submittedAt).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {t.status !== "Approved" && (
                    <button onClick={() => handleApprove(t.id)} className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20 transition border border-emerald-500/20" title="Approve">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {t.status !== "Rejected" && (
                    <button onClick={() => handleReject(t.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition border border-red-500/20" title="Reject">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition" title="Delete permanently">
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