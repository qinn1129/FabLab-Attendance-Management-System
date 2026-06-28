import React from "react";
import { Check } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common";
import { RESIDENT_MAKERS } from "../../constants/mockData";

/**
 * Renders the RM Schedules view for Admins.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminRMSchedules() {
  const days = ["Mon","Tue","Wed","Thu","Fri"];
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
          
          <tbody> {/*Mapping of RM Information*/}
            {RESIDENT_MAKERS.map(rm => (
              <tr key={rm.id} className="border-b border-muted hover:bg-muted/50 transition">
                <td className="px-3 py-3 font-semibold text-foreground whitespace-nowrap">{rm.name}</td>
                <td className="px-3 py-3 text-muted-foreground text-xs">{rm.program}</td>
                <td className="px-3 py-3 text-muted-foreground text-center font-mono">{rm.year}</td>
                {days.map(d => (
                  <td key={d} className="px-3 py-3 text-center"> {/*For their schedules*/}
                    {rm.schedule.includes(d) ? (
                      <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-muted mx-auto" />
                    )}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-mono font-semibold text-card-foreground">{rm.hoursWeek}h</td>
                <td className="px-3 py-3 text-center font-mono text-muted-foreground">{rm.totalHours}h</td>
                <td className="px-3 py-3"><StatusBadge status={rm.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-card rounded-xl border border-border p-5">

        {/*Displays the progress overview for each RM*/}
        <h3 className="text-sm font-semibold text-card-foreground mb-3">RM Progress Overview</h3>
        <div className="space-y-3">
          {RESIDENT_MAKERS.map(rm => (
            <div key={rm.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-500 text-xs font-bold">{rm.name.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-card-foreground font-medium truncate">{rm.name}</span>
                  <span className="text-xs font-mono text-muted-foreground ml-2">{rm.totalHours}h total</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((rm.totalHours / 400) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
