import React, { useState } from "react";
import { useEffect } from "react";
import { Check, Edit2, X, Info, RefreshCw } from "lucide-react";
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
 * Task Assignment entry (if any) pointed at the correct RM. A "More Info"
 * action opens a modal with the full client/commission details that don't
 * fit in the table (contact number, client-type-specific fields, purpose,
 * color, filament, pickup option, weight, and notes).
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminTracker({ 
  commissions, 
  onUpdate,
  onRefresh
}: { 
  commissions: Commission[]; 
  onUpdate: (id: string, updates: Partial<Commission>) => Promise<void>; 
  /** Optional — re-fetches commissions from the backend without a full page reload. */
  onRefresh?: () => Promise<void> | void;
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
  const [refreshing, setRefreshing] = useState(false);
  const [moreInfoItem, setMoreInfoItem] = useState<Commission | null>(null);

  const [makers, setMakers] = useState<Account[]>([]);

  const [filterClient, setFilterClient] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    accountsService.fetchResidentMakers().then(setMakers);
  }, []);

  async function handleRefresh() {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  const uniqueServices = Array.from(new Set(commissions.map(c => c.service).filter(Boolean)));

  const filteredCommissions = commissions.filter(c => {
    const clientName = c.client || "";
    const serviceName = c.service || "";
    const expectedDate = c.expectedPickupDate || "";
    const deadlineDate = c.deadline || "";

    const matchesClient = !filterClient || clientName.toLowerCase().includes(filterClient.toLowerCase());
    const matchesService = !filterService || serviceName === filterService;
    const matchesDate = !filterDate || expectedDate === filterDate || deadlineDate === filterDate;
    return matchesClient && matchesService && matchesDate;
  });

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
      <PageHeader
        title="Commission Tracker"
        sub="Full view of all active and completed commissions"
        action={
          onRefresh ? (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-sm font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Refresh
            </button>
          ) : undefined
        }
      />
      
      {/* Filters Bar */}
      <div className="bg-card rounded-xl border border-border p-4 mb-5 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1 w-56">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Filter by Client Name</label>
          <input
            type="text"
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            placeholder="Search client..."
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="flex flex-col gap-1 w-56">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Filter by Service</label>
          <select
            value={filterService}
            onChange={e => setFilterService(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All Services</option>
            {uniqueServices.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-56">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Filter by Target/Pickup Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {(filterClient || filterService || filterDate) && (
          <button
            onClick={() => {
              setFilterClient("");
              setFilterService("");
              setFilterDate("");
            }}
            className="mt-5 px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition border border-border"
          >
            Clear Filters
          </button>
        )}
      </div>

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
            {filteredCommissions.map((c, index) => {
              const isEditing = editId === c.id;
              return (
                <tr key={`${c.id}-${index}`} className="border-b border-muted hover:bg-muted/50 transition">
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
                        <>
                          <button onClick={() => setMoreInfoItem(c)} className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition" title="More Info">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => startEdit(c)} className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* More Info modal — shows fields that don't fit in the table */}
      {moreInfoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Commission {moreInfoItem.id} — Full Details</h3>
                <p className="text-sm text-muted-foreground">{moreInfoItem.client}</p>
              </div>
              <button
                onClick={() => setMoreInfoItem(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Contact Number</p>
                <p className="font-medium text-foreground">{moreInfoItem.clientContactNumber || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Client Type</p>
                <p className="font-medium text-foreground">{moreInfoItem.clientType || "—"}</p>
              </div>

              {moreInfoItem.clientType === "DLSU Student" && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">ID Number</p>
                    <p className="font-medium text-foreground">{moreInfoItem.idNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Program / College</p>
                    <p className="font-medium text-foreground">
                      {moreInfoItem.program || "—"}{moreInfoItem.college ? ` (${moreInfoItem.college})` : ""}
                    </p>
                  </div>
                </>
              )}

              {moreInfoItem.clientType === "Non-DLSU Student" && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Program</p>
                    <p className="font-medium text-foreground">{moreInfoItem.program || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">University</p>
                    <p className="font-medium text-foreground">{moreInfoItem.affiliation || "—"}</p>
                  </div>
                </>
              )}

              {moreInfoItem.clientType === "Faculty" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Department</p>
                  <p className="font-medium text-foreground">{moreInfoItem.department || "—"}</p>
                </div>
              )}

              {moreInfoItem.clientType === "Outsider" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Affiliation</p>
                  <p className="font-medium text-foreground">{moreInfoItem.affiliation || "—"}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Purpose of Commission</p>
                <p className="font-medium text-foreground">
                  {moreInfoItem.purpose === "Others" ? (moreInfoItem.purposeOther || "—") : (moreInfoItem.purpose || "—")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Preferred Color</p>
                <p className="font-medium text-foreground">{moreInfoItem.color || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Filament / Material</p>
                <p className="font-medium text-foreground">{moreInfoItem.filament || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pickup Option</p>
                <p className="font-medium text-foreground">{moreInfoItem.pickupOption || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Estimated Weight</p>
                <p className="font-medium text-foreground">{moreInfoItem.weight ? `${moreInfoItem.weight} g` : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Expected Pickup Date</p>
                <p className="font-medium text-foreground">
                  {moreInfoItem.expectedPickupDate ? formatDateOnly(moreInfoItem.expectedPickupDate) : "—"}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Additional Notes</p>
                <p className="font-medium text-foreground whitespace-pre-wrap">{moreInfoItem.notes || "—"}</p>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setMoreInfoItem(null)}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}