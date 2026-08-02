import React, { useState, useEffect, useMemo } from "react";
import { Package, Hourglass, CheckCircle2, Clock } from "lucide-react";
import { PageHeader, StatCard, StatusBadge } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";
import { type Commission } from "../../services/sheetsService";
import { formatDateOnly } from "../../lib/dateFormat";

interface RMWorkload {
  maker: Account;
  inProgressCommissions: Commission[];
  pendingCommissions: Commission[];
}

const sortByDeadline = (a: Commission, b: Commission) =>
  (a.deadline || a.expectedPickupDate || "").localeCompare(b.deadline || b.expectedPickupDate || "");

export function AdminCommissionAssignment({ commissions }: { commissions: Commission[] }) {
  const [makers, setMakers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsService.fetchResidentMakers().then(all => {
      setMakers(all.filter(m => m.status === "Active"));
      setLoading(false);
    });
  }, []);

  const workloads: RMWorkload[] = useMemo(() => {
    return makers.map(maker => {
      const fullName = `${maker.firstName} ${maker.lastName}`;
      const mine = commissions.filter(c => c.rm === fullName);
      return {
        maker,
        inProgressCommissions: mine.filter(c => c.status === "In Progress").sort(sortByDeadline),
        pendingCommissions: mine.filter(c => c.status === "Pending").sort(sortByDeadline),
      };
    });
  }, [makers, commissions]);

  const inProgress = useMemo(
    () => workloads.filter(w => w.inProgressCommissions.length > 0).sort((a, b) => b.inProgressCommissions.length - a.inProgressCommissions.length),
    [workloads]
  );
  const pending = useMemo(
    () => workloads.filter(w => w.pendingCommissions.length > 0).sort((a, b) => b.pendingCommissions.length - a.pendingCommissions.length),
    [workloads]
  );
  const available = useMemo(
    () => workloads
      .filter(w => w.inProgressCommissions.length === 0 && w.pendingCommissions.length === 0)
      .sort((a, b) => `${a.maker.firstName} ${a.maker.lastName}`.localeCompare(`${b.maker.firstName} ${b.maker.lastName}`)),
    [workloads]
  );

  const totalInProgress = commissions.filter(c => c.status === "In Progress").length;
  const totalPending = commissions.filter(c => c.status === "Pending").length;

  return (
    <div className="p-6">
      <PageHeader title="Commission Assignment" sub="Who's currently working on what, at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Active Resident Makers" value={makers.length} sub="Eligible for assignment" color="text-foreground" />
        <StatCard label="With Active Commissions" value={inProgress.length} sub="In Progress" color="text-blue-600" />
        <StatCard label="With Pending Commissions" value={pending.length} sub="Awaiting start" color="text-amber-600" />
        <StatCard label="Available" value={available.length} sub="Nothing assigned" color="text-emerald-600" />
        <StatCard label="Total In Progress / Pending" value={`${totalInProgress} / ${totalPending}`} sub="Commissions" color="text-violet-600" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading Resident Makers...</p>
      ) : makers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No active Resident Makers yet.</p>
        </div>
      ) : (
        <>
          {/* In Progress */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              With Active Commissions
              <span className="text-xs font-normal text-muted-foreground">({inProgress.length})</span>
            </h3>

            {inProgress.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                No one currently has a commission in progress.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {inProgress.map(({ maker, inProgressCommissions }) => (
                  <RMCard key={maker.id} maker={maker} items={inProgressCommissions} accent="blue" countLabel="active" />
                ))}
              </div>
            )}
          </div>

          {/* Pending */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-amber-500" />
              With Pending Commissions
              <span className="text-xs font-normal text-muted-foreground">({pending.length})</span>
            </h3>

            {pending.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                No one currently has a commission awaiting start.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pending.map(({ maker, pendingCommissions }) => (
                  <RMCard key={maker.id} maker={maker} items={pendingCommissions} accent="amber" countLabel="pending" />
                ))}
              </div>
            )}
          </div>

          {/* Available */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Available
              <span className="text-xs font-normal text-muted-foreground">({available.length})</span>
            </h3>

            {available.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                Every active Resident Maker currently has at least one assigned commission.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {available.map(({ maker }) => (
                  <div key={maker.id} className="bg-card rounded-xl border border-emerald-500/20 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-emerald-600 font-bold text-[11px]">
                      {maker.firstName[0]}{maker.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-xs truncate">{maker.firstName} {maker.lastName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{maker.program || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Shared per-RM workload card used by both the In Progress and Pending sections, differing only by accent color and the count label in the header pill. */
function RMCard({
  maker,
  items,
  accent,
  countLabel
}: {
  maker: Account;
  items: Commission[];
  accent: "blue" | "amber";
  countLabel: string;
}) {
  const styles = accent === "blue"
    ? {
        border: "border-blue-500/20",
        headerBg: "bg-blue-500/5 border-blue-500/10",
        avatarBg: "bg-blue-500/15 text-blue-600",
        pill: "text-blue-600 bg-blue-500/10 border-blue-500/20",
      }
    : {
        border: "border-amber-500/20",
        headerBg: "bg-amber-500/5 border-amber-500/10",
        avatarBg: "bg-amber-500/15 text-amber-600",
        pill: "text-amber-600 bg-amber-500/10 border-amber-500/20",
      };

  return (
    <div className={`bg-card rounded-xl border ${styles.border} overflow-hidden`}>
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${styles.headerBg}`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${styles.avatarBg}`}>
          {maker.firstName[0]}{maker.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{maker.firstName} {maker.lastName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{maker.program || "—"}</p>
        </div>
        <span className={`text-xs font-bold rounded-full px-2.5 py-1 flex-shrink-0 whitespace-nowrap border ${styles.pill}`}>
          {items.length} {countLabel}
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {items.map(c => (
          <div key={c.id} className="px-4 py-2.5 flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">{c.id}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{c.client}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.service}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(c.deadline || c.expectedPickupDate) && (
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5 whitespace-nowrap">
                  <Clock className="w-3 h-3" /> {formatDateOnly(c.deadline || c.expectedPickupDate)}
                </span>
              )}
              <StatusBadge status={c.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}