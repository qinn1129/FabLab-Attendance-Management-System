import React, { useState } from "react";
import { Check, Edit2 } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { COMMISSIONS, RESIDENT_MAKERS } from "../../constants/mockData";

/**
 * Renders the full Commission Tracker for Admins to view and assign.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminTracker() {
  const [coms, setComs] = useState(COMMISSIONS);
  const [editId, setEditId] = useState<string | null>(null);
  const [assignRM, setAssignRM] = useState<Record<string, string>>({});

  // TODO
  const handleSaveAssignment = (id: string) => {
    setEditId(null);
  };

  return (
    <div className="p-6">
      <PageHeader title="Commission Tracker" sub="Full view of all active and completed commissions" />
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["ID","Client","Service","Assigned RM","Deadline","Printer","Status","Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {coms.map(c => (
              <tr key={c.id} className="border-b border-muted hover:bg-muted/50 transition">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{c.client}</td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{c.service}</td>
                <td className="px-3 py-2.5 min-w-[140px]">

                  {/*Assigned RM*/}
                  {editId === c.id ? (
                    <select
                      value={assignRM[c.id] ?? c.rm ?? ""}
                      onChange={e => setAssignRM(r => ({ ...r, [c.id]: e.target.value }))}
                      className="text-xs border border-border bg-background text-foreground rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                    >
                      <option value="">Unassigned</option>
                      {RESIDENT_MAKERS.filter(r => r.status === "Active").map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  ) : (
                    <span className={c.rm ? "text-card-foreground" : "text-muted-foreground italic"}>{c.rm || "Unassigned"}</span>
                  )}
                  
                </td>
                {/*Commission Information*/}
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{c.deadline}</td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-xs">{c.printer || <span className="text-muted-foreground/50">—</span>}</td>
                <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                <td className="px-3 py-2.5">
                  
                  <div className="flex gap-1">
                    {editId === c.id ? (  
                      <button onClick={() => handleSaveAssignment(c.id)} className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30 transition">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => setEditId(c.id)} className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
