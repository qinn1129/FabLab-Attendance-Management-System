import React, { useState, useEffect } from "react";
import { PageHeader, StatusBadge, Input } from "../../components/common";
import { RESIDENT_MAKERS } from "../../constants/mockData";
import { cn } from "../../lib/utils";
import { accountsService, type Account } from "../../services/accountsService";
import { sheetsService, type WeeklySchedule, type AttendanceRequest } from "../../services/sheetsService";
import { Clock } from "lucide-react";

const dayMap: Record<string, string> = {
  "Mon": "Monday",
  "Tue": "Tuesday",
  "Wed": "Wednesday",
  "Thu": "Thursday",
  "Fri": "Friday",
  "Sat": "Saturday",
  "Sun": "Sunday"
};

function formatRangeTo12H(rangeStr: string): string {
  const parts = rangeStr.split("-");
  if (parts.length !== 2) return rangeStr;
  
  const convert = (time: string) => {
    const tParts = time.split(":");
    if (tParts.length !== 2) return time;
    let hrs = parseInt(tParts[0], 10);
    const mins = parseInt(tParts[1], 10);
    if (isNaN(hrs) || isNaN(mins)) return time;
    
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    const mm = String(mins).padStart(2, "0");
    return `${hrs}:${mm} ${ampm}`;
  };
  
  return `${convert(parts[0])} - ${convert(parts[1])}`;
}

function formatRequestDate(dateStr: string): string {
  if (!dateStr) return "—";
  const isYYYYMMDD = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const parsedDate = isYYYYMMDD ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
  
  if (isNaN(parsedDate.getTime())) return dateStr;
  
  return parsedDate.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * RM Account Management view for Admins.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminRMAccounts() {
  const [tab, setTab] = useState<"list"|"schedules"|"requests"|"register">("list");
  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", email: "", password: "", program: "", year: "" });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [weeklyScheds, setWeeklyScheds] = useState<WeeklySchedule[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsData, schedsData, requestsData] = await Promise.all([
        accountsService.fetchAccounts(),
        sheetsService.fetchWeeklySchedules(),
        sheetsService.fetchAttendanceRequests()
      ]);
      setAccounts(accountsData.filter(a => a.role === "ResidentMaker"));
      setWeeklyScheds(schedsData);
      setRequests(requestsData);
    } catch (e) {
      console.error("Error loading admin RM accounts/requests/schedules:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getMakerName = (rmId: string): string => {
    const found = accounts.find(a => a.id === rmId);
    return found ? `${found.firstName} ${found.lastName}` : "Unknown Maker";
  };

  const handleRegister = async () => {
    setRegError("");
    setRegSuccess("");
    const result = await accountsService.registerRM(regForm);
    if (!result.success) {
      setRegError(result.error || "Registration failed.");
      return;
    }
    setRegSuccess(result.message || "Registered successfully.");
    setRegForm({ firstName: "", lastName: "", email: "", password: "", program: "", year: "" });
    loadData();
  };

  const [actionError, setActionError] = useState("");

  const handleApprove = async (id: string) => {
    setActionError("");
    const result = await accountsService.updateAccount(id, { status: "Active" });
    if (!result.success) {
      setActionError(result.error || "Failed to approve account.");
      return;
    }
    loadData();
  };

  const handleDeactivate = async (id: string) => {
    setActionError("");
    const result = await accountsService.updateAccount(id, { status: "Inactive" });
    if (!result.success) {
      setActionError(result.error || "Failed to deactivate account.");
      return;
    }
    loadData();
  };

    const handleReactivate = async (id: string) => {
      setActionError("");
      const result = await accountsService.updateAccount(id, { status: "Active" });
      if (!result.success) {
        setActionError(result.error || "Failed to reactivate account.");
        return;
      }
      loadData();
    };

  const handleApproveRequest = async (requestId: string) => {
    setActionError("");
    try {
      await sheetsService.updateAttendanceRequest(requestId, { status: "Approved" });
      setRequests(prev => prev.map(r => r.attendance_request_id === requestId ? { ...r, status: "Approved" } : r));
    } catch (err) {
      console.error(err);
      setActionError("Failed to approve attendance request.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionError("");
    try {
      await sheetsService.updateAttendanceRequest(requestId, { status: "Rejected" });
      setRequests(prev => prev.map(r => r.attendance_request_id === requestId ? { ...r, status: "Rejected" } : r));
    } catch (err) {
      console.error(err);
      setActionError("Failed to reject attendance request.");
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="RM Account Management" sub="Manage Resident Maker accounts and attendance" />
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {(["list","schedules","requests","register"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground")}>
            {t === "list" ? "RM List" : t === "schedules" ? "RM Schedules" : t === "requests" ? "Attendance Requests" : "Register New RM"}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <>
        {actionError && <p className="text-red-500 text-sm mb-3">{actionError}</p>}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["Name","Email","Program","Year","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>

            {/*Displayin of RM Information*/}    
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">No Resident Makers yet.</td></tr>
              ) : accounts.map(rm => (
                <tr key={rm.id} className="border-b border-muted hover:bg-muted/50 transition">
                  <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{rm.firstName} {rm.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{rm.email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{rm.program || "—"}</td>
                  <td className="px-4 py-3 text-center font-mono">{rm.year || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={rm.status} /></td>
                  <td className="px-4 py-3">
                    {rm.status === "Pending" ? (
                      <button onClick={() => handleApprove(rm.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Approve</button>
                    ) : rm.status === "Active" ? (
                      <button onClick={() => handleDeactivate(rm.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Deactivate</button>
                    ) : rm.status === "Inactive" ? (
                      <button onClick={() => handleReactivate(rm.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Reactivate</button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {tab === "schedules" && (
        <>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
               <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Resident Maker</th>
               <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Hrs/Week</th>
               <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Total Hrs</th>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                  <th key={d} className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-6 text-center text-muted-foreground text-sm">Loading schedules...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-6 text-center text-muted-foreground text-sm">No Resident Makers yet.</td></tr>
              ) : accounts.map(rm => {
                const sched = weeklyScheds.find(s => s.resident_ID === rm.id);
                return (
                  <tr key={rm.id} className="border-b border-muted hover:bg-muted/50 transition">
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap align-middle">
                      {rm.firstName} {rm.lastName}
                      <span className="block text-[10px] text-muted-foreground font-normal">{rm.email}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-semibold text-card-foreground align-middle">{Number(rm.hoursWeek) || 0}h</td>
                    <td className="px-3 py-3 text-center font-mono text-muted-foreground align-middle">{Number(rm.totalHours) || 0}h</td>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => {
                      const fullDay = dayMap[d];
                      const val = sched ? sched[fullDay] : "";
                      const hasValue = val && val.trim() !== "";
                      
                      if (hasValue) {
                        const slots = val.split(",");
                        return (
                          <td key={d} className="px-4 py-3 align-middle">
                            <div className="flex flex-col gap-1.5 justify-center items-center">
                              {slots.map((slot, sIdx) => (
                                <div 
                                  key={sIdx} 
                                  className="w-full max-w-[150px] px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100 font-semibold text-[10px] shadow-sm transition hover:scale-102 flex items-center justify-center gap-1"
                                >
                                  <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                  <span className="font-mono">{formatRangeTo12H(slot)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      } else {
                        return (
                          <td key={d} className="px-4 py-3 align-middle">
                            <div className="w-full max-w-[150px] h-[34px] rounded-xl border border-dashed border-border/50 bg-muted/15 flex items-center justify-center text-muted-foreground/30 text-[10px] italic select-none mx-auto">
                              —
                            </div>
                          </td>
                        );
                      }
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
         <h3 className="text-sm font-semibold text-card-foreground mb-3">RM Progress Overview</h3>
         <div className="space-y-3">
           {accounts.map(rm => {
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
       </>
      )}

      {/*For requests*/}
      {tab === "requests" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-6 bg-card border border-border rounded-xl">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6 bg-card border border-border rounded-xl">No attendance requests found.</p>
          ) : requests.map(r => {
            const makerName = getMakerName(r.rm_id);
            return (
              <div key={r.attendance_request_id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">{makerName}</span>
                      <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 text-xs font-medium px-2 py-0.5 rounded">{r.type}</span>
                      <span className="text-muted-foreground text-xs font-mono ml-2">{formatRequestDate(r.date)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{r.reason}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 items-center">
                    <StatusBadge status={r.status} />
                    {r.status === "Pending" && (
                      <>
                        <button 
                          onClick={() => handleApproveRequest(r.attendance_request_id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(r.attendance_request_id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*For register*/}
      {tab === "register" && (
        <div className="bg-card rounded-xl border border-border p-6 max-w-md">
          <h3 className="font-semibold text-foreground mb-4">Register New Resident Maker</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={regForm.firstName} onChange={v => setRegForm(f => ({ ...f, firstName: v }))} placeholder="e.g. Juan" required />
              <Input label="Last Name" value={regForm.lastName} onChange={v => setRegForm(f => ({ ...f, lastName: v }))} placeholder="e.g. dela Cruz" required />
            </div>
            <Input label="Email Address" type="email" value={regForm.email} onChange={v => setRegForm(f => ({ ...f, email: v }))} placeholder="name@dlsu.edu.ph" required />
            <Input label="Temporary Password" type="password" value={regForm.password} onChange={v => setRegForm(f => ({ ...f, password: v }))} placeholder="••••••••" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Program" value={regForm.program} onChange={v => setRegForm(f => ({ ...f, program: v }))} placeholder="e.g. BSCS-ST" />
              <Input label="Year Level" value={regForm.year} onChange={v => setRegForm(f => ({ ...f, year: v }))} placeholder="e.g. 3rd Year" />
            </div>
          </div>
          {regError && <p className="text-red-500 text-sm mt-3">{regError}</p>}
          {regSuccess && <p className="text-emerald-600 text-sm mt-3">{regSuccess}</p>}
          <button onClick={handleRegister} disabled={!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.password} className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition">
            Create RM Account
          </button>
        </div>
      )}
    </div>
  );
}
