import React, { useState } from "react";
import { Package } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { COMMISSIONS } from "../../constants/mockData";
import { cn } from "../../lib/utils";

/**
 * RM Commissions view showing assigned jobs.
 * Domain: Maker
 * @returns {JSX.Element}
 */
export function MakerCommissions() {
  const myJobs = React.useMemo(() => COMMISSIONS.filter(c => c.rm === "Juan dela Cruz"), []);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(myJobs.map(j => [j.id, j.status]))
  );

  // TODO
  const handleStatusUpdate = (id: string, s: string) => {
    setStatuses(st => ({ ...st, [id]: s }));
  };

  return (
    <div className="p-6">
      <PageHeader title="My Commissions" sub="Your assigned fabrication jobs" />
      <div className="space-y-3">

        {myJobs.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No commissions assigned yet.</p>
          </div>
        ) : myJobs.map(c => (
          <div key={c.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                  <span className="font-semibold text-foreground">{c.client}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{c.service}</span>
                  <span>Color: {c.color}</span>
                  <span>Filament: {c.filament}</span>
                  {c.printer && <span>Printer: {c.printer}</span>}
                  <span className="font-mono">Due: {c.deadline}</span>
                </div>
              </div>
              <StatusBadge status={statuses[c.id] || c.status} />
              
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Update status:</span>
              {["In Progress", "Completed", "Pending"].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusUpdate(c.id, s)}
                  className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition", statuses[c.id] === s ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
