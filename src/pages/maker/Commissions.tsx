import React, { useState } from "react";
import { Package, Edit2, Check, X, AlertTriangle } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { cn } from "../../lib/utils";
import { type Commission } from "../../services/sheetsService";

/**
 * RM Commissions view showing assigned and approved fabrication jobs.
 * Domain: Maker
 * @returns {JSX.Element}
 */
export function MakerCommissions({ 
  commissions, 
  onUpdate, 
  makerName 
}: { 
  commissions: Commission[]; 
  onUpdate: (id: string, updates: Partial<Commission>) => Promise<void>; 
  makerName: string; 
}) {
  // Make all approved commissions visible to the Resident Maker
  const approvedComms = commissions.filter(
    c => c.status === "In Progress" || c.status === "Completed" || c.status === "Pending"
  );

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    printer: string;
    deadline: string;
    problems: string;
  } | null>(null);

  const startEdit = (c: Commission) => {
    setEditId(c.id);
    setEditForm({
      printer: c.printer || "",
      deadline: c.deadline || "",
      problems: c.problems || ""
    });
  };

  const handleSave = async (id: string) => {
    if (editForm) {
      await onUpdate(id, {
        printer: editForm.printer || null,
        deadline: editForm.deadline || null,
        problems: editForm.problems || null
      });
    }
    setEditId(null);
    setEditForm(null);
  };

  const handleStatusUpdate = async (id: string, s: string) => {
    await onUpdate(id, { status: s });
  };

  const printerOptions = [
    "P1S Combo Bambu Lab - Unit 1",
    "P1S Combo Bambu Lab - Unit 2",
    "Elegoo Centauri Carbon",
    "X1 Carbon Bambu Lab"
  ];

  return (
    <div className="p-6">
      <PageHeader title="Approved Commissions" sub={`Fabrication queue · Welcome, ${makerName}`} />
      <div className="space-y-4">

        {approvedComms.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No approved commissions in the queue yet.</p>
          </div>
        ) : approvedComms.map(c => {
          const isEditing = editId === c.id;
          const isAssignedToMe = c.rm === makerName;

          return (
            <div 
              key={c.id} 
              className={cn(
                "bg-card rounded-xl border p-5 transition-all",
                isAssignedToMe ? "border-emerald-500/30 shadow-sm shadow-emerald-500/5" : "border-border"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{c.id}</span>
                    <span className="font-semibold text-foreground text-sm">{c.client}</span>
                    {isAssignedToMe && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
                        Assigned to Me
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground/75">Service:</span> {c.service}</div>
                    <div><span className="font-medium text-foreground/75">Material:</span> {c.color} {c.filament}</div>
                    <div><span className="font-medium text-foreground/75">Urgency:</span> {c.urgency}</div>
                    
                    {!isEditing && (
                      <>
                        <div>
                          <span className="font-medium text-foreground/75">Printer:</span>{" "}
                          {c.printer ? (
                            <span className="text-foreground">{c.printer}</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic">None assigned</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-foreground/75">Target Deadline:</span>{" "}
                          {c.deadline ? (
                            <span className="text-foreground font-mono">{c.deadline}</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic">Not set</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-foreground/75">Assigned Maker:</span>{" "}
                          <span className="text-foreground italic">{c.rm || "Unassigned"}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && c.problems && (
                    <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-xs flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Problem reported:</span> {c.problems}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={c.status} />
                  {!isEditing && (
                    <button 
                      onClick={() => startEdit(c)} 
                      className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100/75 border border-violet-100 rounded-lg px-2.5 py-1 transition mt-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Details
                    </button>
                  )}
                </div>
              </div>

              {/* Editing Form Panel */}
              {isEditing && editForm && (
                <div className="bg-muted/40 border border-border rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">3D Printer</label>
                    <select
                      value={editForm.printer}
                      onChange={e => setEditForm({ ...editForm, printer: e.target.value })}
                      className="text-xs border border-border bg-background text-foreground rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      <option value="">No Printer Assigned</option>
                      {printerOptions.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Completion Deadline</label>
                    <input
                      type="date"
                      value={editForm.deadline}
                      onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                      className="text-xs border border-border bg-background text-foreground rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Problems Encountered</label>
                    <input
                      type="text"
                      value={editForm.problems}
                      onChange={e => setEditForm({ ...editForm, problems: e.target.value })}
                      placeholder="e.g. filament jam, print warping"
                      className="text-xs border border-border bg-background text-foreground rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-muted">
                    <button 
                      onClick={() => handleSave(c.id)} 
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </button>
                    <button 
                      onClick={() => { setEditId(null); setEditForm(null); }} 
                      className="flex items-center gap-1.5 bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-border"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Status Update Control Row */}
              <div className="flex items-center gap-2 pt-3 border-t border-muted">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Update status:</span>
                {["In Progress", "Completed", "Pending"].map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(c.id, s)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition border",
                      c.status === s 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                        : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
