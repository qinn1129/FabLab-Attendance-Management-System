import React, { useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { PageHeader, Select, Input } from "../../components/common";
import { cn } from "../../lib/utils";
import { accountsService, parseScheduleDays, stringifyScheduleDays, type Account } from "../../services/accountsService";

export function MakerAttendance({
  account,
  onAccountUpdate
}: {
  account: Account;
  onAccountUpdate: (account: Account) => void;
}) {
  const [clockedIn, setClockedIn] = useState(true);
  const [clockInTime] = useState("9:58 AM");
  const [tab, setTab] = useState<"clock"|"schedule"|"request">("clock");
  const [schedDays, setSchedDays] = useState<string[]>(parseScheduleDays(account.schedule));
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState("");
  const [reqForm, setReqForm] = useState({ type: "", date: "", reason: "" });
  const [requestSubmitted, setRequestSubmitted] = useState("");
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const isFriday = new Date().getDay() === 5;

  const handleClockToggle = () => {
    setClockedIn(o => !o);
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    setScheduleSaved("");
    const updates = { schedule: stringifyScheduleDays(schedDays) };
    const result = await accountsService.updateAccount(account.id, updates);
    setSavingSchedule(false);
    if (!result.success) {
      setScheduleSaved(""); // clear on failure — reuse a dedicated error state if you prefer
      alert(result.error || "Failed to save schedule.");
      return;
    }
    setScheduleSaved("Schedule saved!");
    onAccountUpdate({ ...account, ...updates });
  };

  const submitRequest = () => {
    // Attendance Approval Requests need a dedicated sheet/action on the
    // backend (separate from account data) — tracked as a follow-up.
    setRequestSubmitted("Submitted. This will route to Admin review once attendance requests are wired up on the backend.");
  };

  return (
    <div className="p-6">
      <PageHeader title="Attendance System" sub="Track your time and manage schedules" />
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {(["clock","schedule","request"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground")}>
            {t === "clock" ? "Time In/Out" : t === "schedule" ? "My Schedule" : "Attendance Request"}
          </button>
        ))}
      </div>

      {tab === "clock" && (
        <div className="max-w-sm">
          <div className="bg-card rounded-2xl border border-border p-8 text-center mb-4">
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all", clockedIn ? "bg-emerald-500/20 ring-4 ring-emerald-500/30" : "bg-muted")}>
              <Clock className={cn("w-12 h-12", clockedIn ? "text-emerald-500" : "text-muted-foreground")} />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1 font-mono">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-muted-foreground text-sm mb-1">{new Date().toDateString()}</p>
            {clockedIn && <p className="text-emerald-500 text-sm font-medium">Clocked in at {clockInTime}</p>}
          </div>
          <button
            onClick={handleClockToggle}
            className={cn("w-full py-4 rounded-xl font-bold text-lg transition", clockedIn ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
          >
            {clockedIn ? "⏹ Clock Out" : "▶ Clock In"}
          </button>
          {clockedIn && (
            <div className="mt-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-3 text-center">
              <p className="text-emerald-600 text-sm">Current session: <strong className="font-mono">5h 42m</strong></p>
            </div>
          )}
        </div>
      )}

      {tab === "schedule" && (
        <div className="max-w-md bg-card rounded-xl border border-border p-6">
          {isFriday && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-600 text-sm"><strong>Friday reminder:</strong> Please update your schedule for next week before end of day.</p>
            </div>
          )}
          <h3 className="font-semibold text-foreground mb-4">Select Weekly Schedule</h3>
          <div className="grid grid-cols-7 gap-2 mb-5">
            {days.map(d => (
               <button
                 key={d}
                 onClick={() => setSchedDays(sd => sd.includes(d) ? sd.filter(x => x !== d) : [...sd, d])}
                 className={cn("py-2.5 rounded-lg text-sm font-medium transition", schedDays.includes(d) ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}
               >
                 {d}
               </button>
            ))}
          </div>
          <div className="bg-muted rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-1">Selected days:</p>
            <p className="text-sm font-medium text-card-foreground">{schedDays.length > 0 ? schedDays.join(", ") : "None selected"}</p>
          </div>

          {scheduleSaved && <p className="text-emerald-600 text-sm mb-3">{scheduleSaved}</p>}
          <button onClick={saveSchedule} disabled={savingSchedule} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition">
            {savingSchedule ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      )}

      {tab === "request" && (
        <div className="max-w-md bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Submit Attendance Request</h3>
          <div className="space-y-3">
            <Select
              label="Request Type"
              value={reqForm.type}
              onChange={v => setReqForm(f => ({ ...f, type: v }))}
              options={["Late Attendance", "Missed Schedule", "Canceled Schedule", "Early Departure"]}
            />
            <Input label="Date" type="date" value={reqForm.date} onChange={v => setReqForm(f => ({ ...f, date: v }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Reason <span className="text-red-500">*</span></label>
              <textarea
                value={reqForm.reason}
                onChange={e => setReqForm(f => ({ ...f, reason: e.target.value }))}
                rows={4}
                placeholder="Please provide a detailed reason for your attendance request..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
          </div>
          {requestSubmitted && <p className="text-emerald-600 text-sm mt-3">{requestSubmitted}</p>}
          <button onClick={submitRequest} className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition">
            Submit Request
          </button>
        </div>
      )}
    </div>
  );
}