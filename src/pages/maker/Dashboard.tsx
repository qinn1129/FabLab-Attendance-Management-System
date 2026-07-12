import React, { useState, useEffect } from "react";
import { Clock, Package, Pin } from "lucide-react";
import { PageHeader, StatCard, StatusBadge } from "../../components/common";
import { type Commission } from "../../services/sheetsService";
import { type Account } from "../../services/accountsService";
import { announcementsService, type Announcement } from "../../services/announcementsService";

const WEEKLY_HOURS_TARGET = 20;

/**
 * Resident Maker Dashboard view.
 * Domain: Maker
 * @returns {JSX.Element}
 */
export function MakerDashboard({
  commissions,
  account
}: {
  commissions: Commission[];
  account: Account;
}) {
  const makerName = `${account.firstName} ${account.lastName}`;
  const myCommissions = commissions.filter(c => c.rm === makerName);
  const activeCount = myCommissions.filter(c => c.status === "In Progress" || c.status === "Pending").length;
  const completedCount = myCommissions.filter(c => c.status === "Completed").length;

  const firstName = account.firstName;
  const hoursThisWeek = Number(account.hoursWeek) || 0;
  const totalHours = Number(account.totalHours) || 0;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => { announcementsService.fetchAnnouncements().then(setAnnouncements); }, []);

  return (
    <div className="p-6">
      
      <PageHeader title="My Dashboard" sub={`Welcome back, ${firstName}!`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Active Jobs" value={activeCount} sub="In Progress / Pending" color="text-blue-600" />
        <StatCard label="Completed" value={completedCount} sub="Synced from Sheets" color="text-emerald-600" />
        <StatCard label="Hours This Week" value={`${hoursThisWeek}h`} sub={`of ${WEEKLY_HOURS_TARGET}h target`} color="text-foreground" />
        <StatCard label="Total Hours" value={`${totalHours}h`} sub="Cumulative" color="text-violet-600" />
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
          {myCommissions.filter(c => c.status === "In Progress" || c.status === "Pending").length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">No active jobs at the moment.</p>
          ) : (
            myCommissions.filter(c => c.status === "In Progress" || c.status === "Pending").map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-2 last:mb-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.id} — {c.client}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.service} · {c.color} {c.filament}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">Due: {c.deadline || "Not set"} · Printer: {c.printer || "None"}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/*Upcoming Announcements*/}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Upcoming Announcements</h3>
        {announcements.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No announcements yet.</p>
        ) : (
          announcements.slice(0, 2).map(a => (
            <div key={a.id} className="flex gap-3 py-2 border-b border-muted last:border-0">
              {a.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-medium text-card-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.body}</p>
              </div>
              <span className="text-xs text-muted-foreground font-mono ml-auto whitespace-nowrap">{a.date}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}