import React, { useState } from "react";
import { Check, X, User, CheckCircle, Sparkles, Sprout, UserCog } from "lucide-react";
import { PageHeader } from "../../components/common";
import { type Commission } from "../../services/sheetsService";
import { sendCommissionConfirmationEmail, sendCommissionRejectionEmail, sendRMAssignmentEmail } from "../../services/emailService";
import { accountsService, type Account } from "../../services/accountsService";
import { tasksService } from "../../services/tasksService";

/**
 * Renders the Commission Approvals view for Admins. Approving opens a modal
 * asking whether to auto-assign (least active-task workload) or manually
 * pick a specific Resident Maker.
 * Domain: Admin
 */
export function AdminApprovals({
  commissions,
  onUpdate
}: {
  commissions: Commission[];
  onUpdate: (id: string, updates: Partial<Commission>) => Promise<void>;
}) {
  const [assignedNotice, setAssignedNotice] = useState<string | null>(null);
  const items = commissions.filter(c => c.status === "Awaiting Approval");

  const [approveModal, setApproveModal] = useState<{ commission: Commission; makers: Account[] } | null>(null);
  const [assignMode, setAssignMode] = useState<"auto" | "manual">("auto");
  const [selectedMakerId, setSelectedMakerId] = useState<string>("");
  const [confirming, setConfirming] = useState(false);

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
    let assignedRMId: string | null = null;

    if (makers.length > 0) {
      if (assignMode === "auto") {
        // Least-active-task auto-assignment
        const rmCounts = makers.map(rm => {
          const rmName = `${rm.firstName} ${rm.lastName}`;
          const activeJobsCount = commissions.filter(c =>
            c.rm === rmName && (c.status === "Pending" || c.status === "In Progress")
          ).length;
          return { id: rm.id, name: rmName, email: rm.email, count: activeJobsCount };
        });
        rmCounts.sort((a, b) => a.count - b.count);
        assignedRM = rmCounts[0].name;
        assignedRMEmail = rmCounts[0].email;
        assignedRMId = rmCounts[0].id;
      } else {
        const chosen = makers.find(m => m.id === selectedMakerId);
        if (chosen) {
          assignedRM = `${chosen.firstName} ${chosen.lastName}`;
          assignedRMEmail = chosen.email;
          assignedRMId = chosen.id;
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

    // Client confirmation email
    await sendCommissionConfirmationEmail(
      commission.client,
      commission.clientEmail,
      { ...commission, status: "Pending", rm: assignedRM }
    );

    // Notify the assigned RM directly
    if (assignedRM && assignedRMEmail) {
      await sendRMAssignmentEmail(assignedRM, assignedRMEmail, commission.id, commission.client, commission.service);
    }

    // Create a linked Task Assignment entry so the Admin's Task Assignment
    // tab reflects this real commission assignment, not just free-text tasks.
    if (assignedRM && assignedRMId) {
      await tasksService.addTask({
        rm_id: assignedRMId,
        task: `${commission.service} — ${commission.client} [${commission.id}]`,
        deadline: commission.expectedPickupDate || "",
        source: assignMode === "auto" ? "Auto" : "Manual",
      });
    }

    setConfirming(false);
    closeApproveModal();
  }

  const handleReject = async (id: string) => {
    const commission = commissions.find(c => c.id === id);
    const reason = window.prompt("Reason for rejection (optional — shown to the client):") || "";

    await onUpdate(id, { status: "Rejected" });

    if (commission) {
      await sendCommissionRejectionEmail(commission.client, commission.clientEmail, commission, reason);
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Commission Approval" sub={`${items.length} requests awaiting review`} />
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
                  {item.driveLink ? (
                    <a
                      href={item.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600 underline font-medium"
                    >
                      Link
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">—</p>
                  )}
                </div>

                {/*Expected Pickup Date*/}
                <div>
                  <p className="text-xs text-muted-foreground">Pickup Date</p>
                  <p className="text-sm font-mono text-card-foreground">{item.expectedPickupDate || "—"}</p>
                </div>

                {/*Submitted*/}
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm font-mono text-muted-foreground">{item.submitted}</p>
                </div>
              </div>

              {/*Actions*/}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openApproveModal(item.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>

                <button onClick={() => handleReject(item.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold rounded-lg border border-red-500/20 transition flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
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