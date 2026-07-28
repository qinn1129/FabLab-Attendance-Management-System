import React, { useState } from "react";
import { useEffect } from "react";
import { Check, Edit2, X } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";
import { type Commission } from "../../services/sheetsService";
import { sendRMAssignmentEmail, sendRMUnassignedEmail } from "../../services/emailService";
import { cn } from "../../lib/utils";
import { formatDateOnly } from "../../lib/dateFormat";

/**
 * Renders the full Commission Tracker for Admins to view and assign.
 * Reassigning the RM on a commission emails both the previous RM (no
 * longer assigned) and the newly assigned RM, and keeps the linked
 * Task Assignment entry (if any) pointed at the correct RM.
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
  const [reassigning, setReassigning] = useState(false);

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

  const findMakerByName = (name: string | null): Account | undefined => {
    if (!name) return undefined;
    return makers.find(m => `${m.firstName} ${m.lastName}` === name);
  };

  const handleSaveAssignment = async (id: string) => {
    if (!editForm) return;
    const original = commissions.find(c => c.id === id);
    const previousRM = original?.rm || null;
    const newRM = editForm.rm || null;

    setReassigning(true);

    await onUpdate(id, {
      rm: newRM,
      printer: editForm.printer || null,
      deadline: editForm.deadline || null,
      problems: editForm.problems || null,
      status: editForm.status
    });

    // If the assigned RM actually changed, notify both sides by email and
    // keep the linked Task Assignment entry (if one exists for this
    // commission) pointed at the correct RM.
    if (original && previousRM !== newRM) {
      const prevMaker = findMakerByName(previousRM);
      const newMaker = findMakerByName(newRM);

      if (prevMaker) {
        await sendRMUnassignedEmail(
          `${prevMaker.firstName} ${prevMaker.lastName}`,
          prevMaker.email,
          id,
          original.client,
          original.service
        );
      }
      if (newMaker) {
        await sendRMAssignmentEmail(
          `${newMaker.firstName} ${newMaker.lastName}`,
          newMaker.email,
          id,
          original.client,
          original.service
        );
      }
    }

    setReassigning(false);
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
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.deadline ? formatDateOnly(c.deadline) : <span className="text-muted-foreground/30">—</span>}
                      </span>
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
                          <button onClick={() => handleSaveAssignment(c.id)} disabled={reassigning} className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30 transition disabled:opacity-40" title="Save">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit} disabled={reassigning} className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition disabled:opacity-40" title="Cancel">
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