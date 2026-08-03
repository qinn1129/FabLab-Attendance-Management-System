import React, { useState, useRef, useEffect } from "react";
import { Check, X, User, CheckCircle, Sparkles, Sprout, UserCog, Info, RefreshCw, ExternalLink } from "lucide-react";
import { PageHeader, useDialog } from "../../components/common";
import { type Commission } from "../../services/sheetsService";
import { sendCommissionConfirmationEmail, sendCommissionRejectionEmail, sendRMAssignmentEmail } from "../../services/emailService";
import { accountsService, type Account } from "../../services/accountsService";
import { formatDateTime, formatDateOnly } from "../../lib/dateFormat";
import { pickLeastBusyMakerIdFromCommissions } from "../../services/tasksService";
import { cn } from "../../lib/utils";
import { resolveDriveLink } from "../../lib/commissionUtils";

/**
 * Renders the Commission Approvals view for Admins. Approving opens a modal
 * asking whether to auto-assign (least current commission workload, live
 * from commission data) or manually pick a specific Resident Maker. Rejecting opens a reason prompt — the
 * commission is ONLY marked Rejected if the admin actually confirms the
 * prompt; cancelling it (even with an empty reason cancel) leaves the
 * commission untouched. A "More Info" button on each row opens a modal with
 * the full client/commission details that don't fit in the summary row
 * (contact number, client-type-specific fields, purpose, color, filament,
 * pickup option, weight, and notes).
 * Domain: Admin
 */
export function AdminApprovals({
  commissions,
  onUpdate,
  onRefresh
}: {
  commissions: Commission[];
  onUpdate: (id: string, updates: Partial<Commission>) => Promise<void>;
  /** Optional — re-fetches commissions from the backend without a full page reload. */
  onRefresh?: () => Promise<void> | void;
}) {
  const { prompt } = useDialog();
  const [assignedNotice, setAssignedNotice] = useState<string | null>(null);
  const [undoReject, setUndoReject] = useState<{
    id: string;
    reason: string;
    timeLeft: number;
  } | null>(null);
  const intervalRef = useRef<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [moreInfoItem, setMoreInfoItem] = useState<Commission | null>(null);

  const items = commissions.filter(c => c.status === "Awaiting Approval" && c.id !== undoReject?.id);

  const [approveModal, setApproveModal] = useState<{ commission: Commission; makers: Account[] } | null>(null);
  const [assignMode, setAssignMode] = useState<"auto" | "manual">("auto");
  const [selectedMakerId, setSelectedMakerId] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function handleRefresh() {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  async function openApproveModal(id: string) {
    const commission = commissions.find(c => c.id === id);
    if (!commission) return;

    const makers = await accountsService.fetchResidentMakers();
    const activeMakers = makers.filter(m => m.status === "Active");

    setAssignMode("auto");
    setSelectedMakerId(activeMakers[0]?.id || "");
    setApproveModal({ commission, makers: activeMakers });
  }

  function closeApproveModal() {
    setApproveModal(null);
    setSelectedMakerId("");
  }

  async function confirmApprove() {
    if (!approveModal) return;
    const { commission, makers } = approveModal;
    setConfirming(true);

    let assignedRM: string | null = null;
    let assignedRMEmail: string | null = null;

    if (makers.length > 0) {
      if (assignMode === "auto") {
        // Count each RM's live workload straight from commission data
        // (Pending/In Progress, matched by assigned name) instead of a
        // separate task log that could drift out of sync — see
        // pickLeastBusyMakerIdFromCommissions in tasksService.ts.
        const leastBusyId = pickLeastBusyMakerIdFromCommissions(makers, commissions);

        const chosen = makers.find(m => m.id === leastBusyId);
        if (chosen) {
          assignedRM = `${chosen.firstName} ${chosen.lastName}`;
          assignedRMEmail = chosen.email;
        }
      } else {
        const chosen = makers.find(m => m.id === selectedMakerId);
        if (chosen) {
          assignedRM = `${chosen.firstName} ${chosen.lastName}`;
          assignedRMEmail = chosen.email;
        }
      }
    }

    await onUpdate(commission.id, { status: "Pending", rm: assignedRM });

    if (assignedRM) {
      setAssignedNotice(
        `Request ${commission.id} approved and ${assignMode === "auto" ? "auto-assigned" : "assigned"} to ${assignedRM}.`
      );
    } else {
      setAssignedNotice(`Request ${commission.id} approved (No active Resident Makers available for assignment).`);
    }

    // 3. Send client confirmation email
    await sendCommissionConfirmationEmail(
      commission.client,
      commission.clientEmail,
      { ...commission, status: "Pending", rm: assignedRM }
    );

    // 4. Notify the assigned RM directly
    if (assignedRM && assignedRMEmail) {
      await sendRMAssignmentEmail(assignedRM, assignedRMEmail, commission.id, commission.client, commission.service);
    }

    setConfirming(false);
    closeApproveModal();
  }

  const commitRejection = async (id: string, reason: string) => {
    const commission = commissions.find(c => c.id === id);
    await onUpdate(id, { status: "Rejected" });
    if (commission) {
      await sendCommissionRejectionEmail(commission.client, commission.clientEmail, commission, reason);
    }
  };

  const handleReject = async (id: string) => {
    if (rejectingId) return; 
    setRejectingId(id);

    try {
      const reason = await prompt({
        title: "Reject Commission",
        message: "Reason for rejection (optional — shown to the client):",
        placeholder: "e.g. Insufficient details, material unavailable...",
        confirmLabel: "Reject",
        cancelLabel: "Cancel",
        multiline: true,
      });

      if (reason === null) return;

      if (undoReject) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        await commitRejection(undoReject.id, undoReject.reason);
      }

      let secondsLeft = 10;
      setUndoReject({ id, reason, timeLeft: secondsLeft });

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          commitRejection(id, reason);
          setUndoReject(null);
        } else {
          setUndoReject(prev => prev ? { ...prev, timeLeft: secondsLeft } : null);
        }
      }, 1000);

    } finally {
      setRejectingId(null);
    }
  };

  const handleUndoReject = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setUndoReject(null);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="p-6">
      <PageHeader
        title="Commission Approval"
        sub={`${items.length} requests awaiting review`}
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
      {undoReject && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Commission {undoReject.id} rejected. Rejection official in {undoReject.timeLeft}s...</span>
          </div>
          <button
            onClick={handleUndoReject}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-[10px] font-bold uppercase tracking-wider"
          >
            Undo
          </button>
        </div>
      )}
      {assignedNotice && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{assignedNotice}</span>
          </div>
          <button onClick={() => setAssignedNotice(null)} className="text-muted-foreground hover:text-foreground text-xs ml-2">
            Dismiss
          </button>
        </div>
      )}
      {items.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-card rounded-xl border border-border p-5 flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-orange-500" />
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-2">

                {/*Client*/}
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="text-sm font-semibold text-foreground">{item.client}</p>
                </div>

                {/*Service*/}
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="text-sm text-card-foreground">{item.service}</p>
                </div>

                {/*Contact*/}
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="text-sm text-card-foreground truncate">{item.clientEmail}</p>
                </div>

                {/*Drive Link*/}
                <div>
                  <p className="text-xs text-muted-foreground">Drive Link</p>
                  {resolveDriveLink(item) ? (
                    <a
                      href={resolveDriveLink(item)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 underline font-medium"
                    >
                      Open Link <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">—</p>
                  )}
                </div>

                {/*Expected Pickup Date*/}
                <div>
                  <p className="text-xs text-muted-foreground">Pickup Date</p>
                  <p className="text-sm font-mono text-card-foreground">
                    {item.expectedPickupDate ? formatDateOnly(item.expectedPickupDate) : "—"}
                  </p>
                </div>

                {/*Submitted*/}
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm font-mono text-muted-foreground">{formatDateTime(item.submitted)}</p>
                </div>
              </div>

              {/*Actions*/}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setMoreInfoItem(item)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold rounded-lg border border-border transition flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" /> More Info
                </button>

                <button onClick={() => openApproveModal(item.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>

                <button
                  onClick={() => handleReject(item.id)}
                  disabled={rejectingId === item.id}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold rounded-lg border border-red-500/20 transition flex items-center gap-1 disabled:opacity-40"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* More Info modal — shows fields that don't fit in the summary row */}
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
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Drive Link</p>
                {resolveDriveLink(moreInfoItem) ? (
                  <a
                    href={resolveDriveLink(moreInfoItem)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-500 hover:text-blue-600 underline"
                  >
                    Open Link <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="font-medium text-foreground">—</p>
                )}
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

      {/* Approve — assignment mode modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-1">Approve Commission {approveModal.commission.id}</h3>
            <p className="text-sm text-muted-foreground mb-4">Choose how to assign this request to a Resident Maker.</p>

            <div className="space-y-2 mb-5">
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${assignMode === "auto" ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:bg-muted/50"}`}>
                <input
                  type="radio"
                  checked={assignMode === "auto"}
                  onChange={() => setAssignMode("auto")}
                  className="mt-0.5 w-4 h-4 text-emerald-600 focus:ring-emerald-400"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    <p className="text-sm font-semibold text-foreground">Auto-assign (least workload)</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically picks the active RM with the fewest active tasks.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${assignMode === "manual" ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:bg-muted/50"}`}>
                <input
                  type="radio"
                  checked={assignMode === "manual"}
                  onChange={() => setAssignMode("manual")}
                  className="mt-0.5 w-4 h-4 text-emerald-600 focus:ring-emerald-400"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5 text-emerald-600" />
                    <p className="text-sm font-semibold text-foreground">Assign to a specific RM</p>
                  </div>
                  {assignMode === "manual" && (
                    <select
                      value={selectedMakerId}
                      onChange={e => setSelectedMakerId(e.target.value)}
                      className="mt-2 w-full text-xs border border-border bg-background text-foreground rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      {approveModal.makers.length === 0 && <option value="">No active Resident Makers available</option>}
                      {approveModal.makers.map(m => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeApproveModal}
                disabled={confirming}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={confirming || (assignMode === "manual" && !selectedMakerId)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> {confirming ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}