import React from "react";
import { Clock, Package, Pin } from "lucide-react";
import { PageHeader, StatCard, StatusBadge } from "../../components/common";
import { COMMISSIONS, ANNOUNCEMENTS_DATA } from "../../constants/mockData";

/**
 * Resident Maker Dashboard view.
 * Domain: Maker
 * @returns {JSX.Element}
 */
export function MakerDashboard() {
  const myCommissions = COMMISSIONS.filter(c => c.rm === "Juan dela Cruz");

  return (
    <div className="p-6">
      
      {/*Welcome back! <actual rm>*/}
      {/*hardcoded in the view*/}
      <PageHeader title="My Dashboard" sub="Monday, June 23, 2026 · Welcome back, Juan!" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Active Jobs" value={1} sub="In Progress" color="text-blue-600" />
        <StatCard label="Completed" value={8} sub="All time" color="text-emerald-600" />
        <StatCard label="Hours This Week" value="14h" sub="of 20h target" color="text-foreground" />
        <StatCard label="Total Hours" value="203h" sub="Cumulative" color="text-violet-600" />
      </div>

      {/*Today's Schedule*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Today&apos;s Schedule
          </h3>
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              
              {/*hardcoded in the view*/}
              <p className="text-sm font-medium text-foreground">FabLab Shift — Mon</p>
              <p className="text-xs text-muted-foreground">10:00 AM – 4:00 PM · Clocked in at 9:58 AM</p>
            </div>
            <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded">On Duty</span>
          </div>
        </div>

        {/*My Active Jobs*/}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" /> My Active Jobs
          </h3>
          {myCommissions.filter(c => c.status === "In Progress").map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.id} — {c.client}</p>
                <p className="text-xs text-muted-foreground">{c.service} · {c.color} {c.filament} · Due {c.deadline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Printer: {c.printer}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </div>

      {/*Upcoming Announcements*/}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Upcoming Announcements</h3>
        {ANNOUNCEMENTS_DATA.slice(0, 2).map(a => (
          <div key={a.id} className="flex gap-3 py-2 border-b border-muted last:border-0">
            {a.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-sm font-medium text-card-foreground">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.body}</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono ml-auto whitespace-nowrap">{a.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
