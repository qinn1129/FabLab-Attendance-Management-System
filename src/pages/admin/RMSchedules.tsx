import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { accountsService, parseScheduleDays, type Account } from "../../services/accountsService";

export function AdminRMSchedules() {
  const [makers, setMakers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const days = ["Mon","Tue","Wed","Thu","Fri"];

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await accountsService.fetchResidentMakers();
      setMakers(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="RM List & Schedules" sub="All Resident Makers and their weekly schedule" />
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["Name","Program","Year","Mon","Tue","Wed","Thu","Fri","Hrs / Week","Total Hrs","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="px-3 py-6 text-center text-muted-foreground text-sm">Loading...</td></tr>
            ) : makers.length === 0 ? (
              <tr><td colSpan={11} className="px-3 py-6 text-center text-muted-foreground text-sm">No Resident Makers yet.</td></tr>
            ) : makers.map(rm => {
              const scheduleDays = parseScheduleDays(rm.schedule);
              return (
                <tr key={rm.id} className="border-b border-muted hover:bg-muted/50 transition">
                  <td className="px-3 py-3 font-semibold text-foreground whitespace-nowrap">{rm.firstName} {rm.lastName}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{rm.program || "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground text-center font-mono">{rm.year || "—"}</td>
                  {days.map(d => (
                    <td key={d} className="px-3 py-3 text-center">
                      {scheduleDays.includes(d) ? (
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-muted mx-auto" />
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center font-mono font-semibold text-card-foreground">{Number(rm.hoursWeek) || 0}h</td>
                  <td className="px-3 py-3 text-center font-mono text-muted-foreground">{Number(rm.totalHours) || 0}h</td>
                  <td className="px-3 py-3"><StatusBadge status={rm.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">RM Progress Overview</h3>
        <div className="space-y-3">
          {makers.map(rm => {
            const totalHours = Number(rm.totalHours) || 0;
            return (
              <div key={rm.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-500 text-xs font-bold">{rm.firstName[0]}{rm.lastName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-card-foreground font-medium truncate">{rm.firstName} {rm.lastName}</span>
                    <span className="text-xs font-mono text-muted-foreground ml-2">{totalHours}h total</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((totalHours / 400) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}