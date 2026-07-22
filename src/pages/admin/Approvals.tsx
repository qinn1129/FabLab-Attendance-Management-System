import React, { useState } from "react";
import { Check, X, User, CheckCircle, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/common";
import { type Commission } from "../../services/sheetsService";
import { sendCommissionConfirmationEmail } from "../../services/emailService";
import { accountsService } from "../../services/accountsService";

/**
 * Renders the Commission Approvals view for Admins.
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

  const handleApprove = async (id: string) => {
    const commission = commissions.find(c => c.id === id);

    // 1. Fetch Resident Makers & filter active ones
    const makers = await accountsService.fetchResidentMakers();
    const activeMakers = makers.filter(m => m.status === "Active");

    let assignedRM: string | null = null;

    if (activeMakers.length > 0) {
      // 2. Count active commissions (Pending or In Progress) for each active RM
      const rmCounts = activeMakers.map(rm => {
        const rmName = `${rm.firstName} ${rm.lastName}`;
        const activeJobsCount = commissions.filter(c =>
          c.rm === rmName && (c.status === "Pending" || c.status === "In Progress")
        ).length;
        return { name: rmName, count: activeJobsCount };
      });

      // 3. Select the RM with the lowest number of active commissions
      rmCounts.sort((a, b) => a.count - b.count);
      assignedRM = rmCounts[0].name;
    }

    // 4. Update status to Pending and set auto-assigned RM
    await onUpdate(id, { status: "Pending", rm: assignedRM });

    if (assignedRM) {
      setAssignedNotice(`Request ${id} approved and auto-assigned to ${assignedRM}.`);
    } else {
      setAssignedNotice(`Request ${id} approved (No active Resident Makers available for auto-assignment).`);
    }

    if (commission) {
      // Send confirmation email to client
      await sendCommissionConfirmationEmail(
        commission.client,
        commission.clientEmail,
        { ...commission, status: "Pending", rm: assignedRM }
      );
    }
  };

  const handleReject = async (id: string) => {
    await onUpdate(id, { status: "Rejected" });
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

              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
                
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
                
                {/*Submitted*/}
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm font-mono text-muted-foreground">{item.submitted}</p>
                </div>
              </div>

              {/*Actions*/}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleApprove(item.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
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
    </div>
  );
}
