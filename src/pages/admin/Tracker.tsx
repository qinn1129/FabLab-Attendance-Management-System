import React, { useState } from "react";
import { useEffect } from "react";
import { Check, Edit2, X } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";
import { type Commission } from "../../services/sheetsService";

/**
 * Renders the full Commission Tracker for Admins to view and assign.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminTracker({ 
  commissions, 
  onUpdate 
}: { 
  commissions: Commission[]; 
  onUpdate: (id: string, updates: Partial<Commission>) => Promise<void>; 
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    rm: string;
    printer: string;
    deadline: string;
    problems: string;
    status: string;
  } | null>(null);

  const [makers, setMakers] = useState<Account[]>([]);

  useEffect(() => {
    accountsService.fetchResidentMakers().then(setMakers);
  }, []);

  const startEdit = (c: Commission) => {
    setEditId(c.id);
    setEditForm({
      rm: c.rm || "",
      printer: c.printer || "",
      deadline: c.deadline || "",
      problems: c.problems || "",
      status: c.status
    });
  };

  const handleSaveAssignment = async (id: string) => {
    if (editForm) {
      await onUpdate(id, {
        rm: editForm.rm || null,
        printer: editForm.printer || null,
        deadline: editForm.deadline || null,
        problems: editForm.problems || null,
        status: editForm.status
      });
    }
    setEditId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(null);
  };

  const printerOptions = [
    "P1S Combo Bambu Lab - Unit 1",
    "P1S Combo Bambu Lab - Unit 2",
    "Elegoo Centauri Carbon",
    "X1 Carbon Bambu Lab"
  ];

  const statusOptions = [
    "Awaiting Approval",
    "In Progress",
    "Completed",
    "Pending",
    "Rejected"
  ];

  return (
    <div className="p-6">
      <PageHeader title="Commission Tracker" sub="Full view of all active and completed commissions" />
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["ID","Client","Service","Assigned RM","Deadline","Printer","Status","Problems Encountered","Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {commissions.map(c => {
              const isEditing = editId === c.id;
              return (
                <tr key={c.id} className="border-b border-muted hover:bg-muted/50 transition">
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{c.client}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{c.service}</td>
                  
                  {/*Assigned RM*/}
                  <td className="px-3 py-2.5 min-w-[140px]">
                    {isEditing && editForm ? (
                      <select
                        value={editForm.rm}
                        onChange={e => setEditForm({ ...editForm, rm: e.target.value })}
                        className="text-xs border border-border bg-background text-foreground rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                      >
                        <option value="">Unassigned</option>
                        {makers.filter(r => r.status === "Active").map(r => (
                          <option key={r.id} value={`${r.firstName} ${r.lastName}`}>{r.firstName} {r.lastName}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={c.rm ? "text-card-foreground" : "text-muted-foreground italic"}>{c.rm || "Unassigned"}</span>
                    )}
                  </td>

                  {/*Deadline*/}
                  <td className="px-3 py-2.5 whitespace-nowrap min-w-[130px]">
                    {isEditing && editForm ? (
                      <input
                        type="date"
                        value={editForm.deadline}
                        onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                        className="text-xs border border-border bg-background text-foreground rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                      />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{c.deadline || <span className="text-muted-foreground/30">—</span>}</span>
                    )}
                  </td>

                  {/*Printer*/}
                  <td className="px-3 py-2.5 min-w-[160px]">
                    {isEditing && editForm ? (
                      <select
                        value={editForm.printer}
                        onChange={e => setEditForm({ ...editForm, printer: e.target.value })}
                        className="text-xs border border-border bg-background text-foreground rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                      >
                        <option value="">No Printer Assigned</option>
                        {printerOptions.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground text-xs">{c.printer || <span className="text-muted-foreground/30">—</span>}</span>
                    )}
                  </td>

                  {/*Status*/}
                  <td className="px-3 py-2.5 min-w-[130px]">
                    {isEditing && editForm ? (
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="text-xs border border-border bg-background text-foreground rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={c.status} />
                    )}
                  </td>

                  {/*Problems Encountered*/}
                  <td className="px-3 py-2.5 min-w-[200px]">
                    {isEditing && editForm ? (
                      <input
                        type="text"
                        value={editForm.problems}
                        onChange={e => setEditForm({ ...editForm, problems: e.target.value })}
                        placeholder="Describe issues..."
                        className="text-xs border border-border bg-background text-foreground rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground truncate block max-w-[180px]" title={c.problems || ""}>
                        {c.problems || <span className="text-muted-foreground/30">—</span>}
                      </span>
                    )}
                  </td>

                  {/*Actions*/}
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1.5">
                      {isEditing ? (  
                        <>
                          <button onClick={() => handleSaveAssignment(c.id)} className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30 transition" title="Save">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition" title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(c)} className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
