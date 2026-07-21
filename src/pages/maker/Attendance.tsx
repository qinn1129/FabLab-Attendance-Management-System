import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, Calendar, Save, Trash2, Check } from "lucide-react";
import { PageHeader, Select, Input } from "../../components/common";
import { cn } from "../../lib/utils";
import { accountsService, parseScheduleDays, stringifyScheduleDays, type Account } from "../../services/accountsService";
import { sheetsService, type AttendanceLog, type AttendanceRequest } from "../../services/sheetsService";

const dayMap: Record<string, string> = {
  "Mon": "Monday",
  "Tue": "Tuesday",
  "Wed": "Wednesday",
  "Thu": "Thursday",
  "Fri": "Friday",
  "Sat": "Saturday",
  "Sun": "Sunday"
};

const TIME_SLOTS: number[] = [];
for (let h = 7; h < 22; h++) {
  TIME_SLOTS.push(h * 60);
  TIME_SLOTS.push(h * 60 + 30);
}

function parseTimeToMinutes(timeStr: string): number | null {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const hr = parseInt(parts[0], 10);
  const min = parseInt(parts[1], 10);
  if (isNaN(hr) || isNaN(min)) return null;
  return hr * 60 + min;
}

function formatMinutesToTime(m: number): string {
  const mins = m % 60;
  const hrs = Math.floor(m / 60);
  const mm = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hrs}:${mm}`;
}

function parseTimeStringToSlots(timeStr: string): Record<number, boolean> {
  const selected: Record<number, boolean> = {};
  if (!timeStr || timeStr.trim() === "") return selected;
  const parts = timeStr.split(",");
  parts.forEach(part => {
    const range = part.trim().split("-");
    if (range.length === 2) {
      const [startStr, endStr] = range;
      const startMins = parseTimeToMinutes(startStr);
      const endMins = parseTimeToMinutes(endStr);
      if (startMins !== null && endMins !== null) {
        for (let m = startMins; m < endMins; m += 30) {
          selected[m] = true;
        }
      }
    }
  });
  return selected;
}

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
     return `${hrs}:${String(mins).padStart(2, "0")} ${ampm}`;
   };
   return `${convert(parts[0])} - ${convert(parts[1])}`;
 }

function serializeSlotsToTimeString(selected: Record<number, boolean>): string {
  const sortedSlots = Object.keys(selected)
    .map(Number)
    .filter(m => selected[m])
    .sort((a, b) => a - b);
  
  if (sortedSlots.length === 0) return "";

  const ranges: string[] = [];
  let rangeStart = sortedSlots[0];
  let lastVal = sortedSlots[0];

  for (let i = 1; i < sortedSlots.length; i++) {
    const currentVal = sortedSlots[i];
    if (currentVal === lastVal + 30) {
      lastVal = currentVal;
    } else {
      ranges.push(`${formatMinutesToTime(rangeStart)}-${formatMinutesToTime(lastVal + 30)}`);
      rangeStart = currentVal;
      lastVal = currentVal;
    }
  }
  ranges.push(`${formatMinutesToTime(rangeStart)}-${formatMinutesToTime(lastVal + 30)}`);

  return ranges.join(",");
}

function formatSlotDisplay(startMinutes: number): string {
  const endMinutes = startMinutes + 30;
  
  const formatTime = (m: number) => {
    const mins = m % 60;
    let hrs = Math.floor(m / 60);
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${mm} ${ampm}`;
  };

  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
}

function getFormattedDaySummary(timeStr: string): string {
  if (!timeStr || timeStr.trim() === "") return "No hours scheduled";
  return timeStr.split(",").map(part => {
    const range = part.split("-");
    if (range.length !== 2) return part;
    const startMins = parseTimeToMinutes(range[0]);
    const endMins = parseTimeToMinutes(range[1]);
    if (startMins === null || endMins === null) return part;
    
    const formatTime = (m: number) => {
      const mins = m % 60;
      let hrs = Math.floor(m / 60);
      const ampm = hrs >= 12 ? "PM" : "AM";
      hrs = hrs % 12;
      if (hrs === 0) hrs = 12;
      const mm = mins < 10 ? `0${mins}` : `${mins}`;
      return `${hrs}:${mm} ${ampm}`;
    };
    return `${formatTime(startMins)}-${formatTime(endMins)}`;
  }).join(", ");
}

export function MakerAttendance({
  account,
  onAccountUpdate
}: {
  account: Account;
  onAccountUpdate: (account: Account) => void;
}) {
  const [clockedIn, setClockedIn] = useState(false);
  const [activeSession, setActiveSession] = useState<AttendanceLog | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tab, setTab] = useState<"clock"|"schedule"|"team"|"request">("clock");

  // Load and check active session on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkActiveSession = async () => {
      setLoadingSession(true);
      try {
        const logs = await sheetsService.fetchAttendanceLogs();
        if (!isMounted) return;
        const myLogs = logs.filter(log => log.resident_id === account.id);
        const active = myLogs.find(log => log.status === "Active" || !log.clock_out_timestamp);
        
        if (active) {
          const clockInDate = new Date(active.clock_in_timestamp);
          const now = new Date();
          const isDiffDay = clockInDate.getFullYear() !== now.getFullYear() ||
                            clockInDate.getMonth() !== now.getMonth() ||
                            clockInDate.getDate() !== now.getDate();
          
          if (isDiffDay) {
            // Day ended and they didn't clock out, invalidate session
            await sheetsService.updateAttendanceLog(active.id, {
              status: "Invalid",
              total_hours: 0
            });
            if (isMounted) {
              setActiveSession(null);
              setClockedIn(false);
            }
          } else {
            if (isMounted) {
              setActiveSession(active);
              setClockedIn(true);
            }
          }
        } else {
          if (isMounted) {
            setActiveSession(null);
            setClockedIn(false);
          }
        }
      } catch (err) {
        console.error("Error loading active session", err);
      } finally {
        if (isMounted) {
          setLoadingSession(false);
        }
      }
    };

    checkActiveSession();
    return () => {
      isMounted = false;
    };
  }, [account.id]);

  // Live dynamic clock and end-of-day invalidation check
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // If there is an active session, check if the day changed in real-time
      if (activeSession) {
        const clockInDate = new Date(activeSession.clock_in_timestamp);
        const isDiffDay = clockInDate.getFullYear() !== now.getFullYear() ||
                          clockInDate.getMonth() !== now.getMonth() ||
                          clockInDate.getDate() !== now.getDate();
        if (isDiffDay) {
          // day ended, invalidate active session
          sheetsService.updateAttendanceLog(activeSession.id, {
            status: "Invalid",
            total_hours: 0
          }).then(() => {
            setActiveSession(null);
            setClockedIn(false);
          }).catch(console.error);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const getSessionDuration = () => {
    if (!activeSession) return "0h 0m";
    const start = new Date(activeSession.clock_in_timestamp);
    const diffMs = currentTime.getTime() - start.getTime();
    if (diffMs < 0) return "0h 0m";
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const handleClockIn = async () => {
    setLoadingSession(true);
    const now = new Date();
    const newLog: AttendanceLog = {
      id: "ATT-" + now.getTime(),
      resident_id: account.id,
      clock_in_timestamp: now.toISOString(),
      clock_out_timestamp: "",
      total_hours: 0,
      status: "Active"
    };
    try {
      await sheetsService.addAttendanceLog(newLog);
      setActiveSession(newLog);
      setClockedIn(true);
    } catch (err) {
      console.error("Error clocking in:", err);
      alert("Failed to clock in. Please try again.");
    } finally {
      setLoadingSession(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeSession) return;
    setLoadingSession(true);
    const now = new Date();
    const start = new Date(activeSession.clock_in_timestamp);
    const diffMs = now.getTime() - start.getTime();
    const diffHrs = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
    
    try {
      // 1. Update attendance log
      await sheetsService.updateAttendanceLog(activeSession.id, {
        clock_out_timestamp: now.toISOString(),
        total_hours: diffHrs,
        status: "Completed"
      });
      
      // 2. Update account totalHours and hoursWeek
      const currentTotal = Number(account.totalHours) || 0;
      const currentWeek = Number(account.hoursWeek) || 0;
      const updatedTotal = Math.round((currentTotal + diffHrs) * 100) / 100;
      const updatedWeek = Math.round((currentWeek + diffHrs) * 100) / 100;
      
      const accountUpdates = {
        totalHours: updatedTotal,
        hoursWeek: updatedWeek
      };
      
      const result = await accountsService.updateAccount(account.id, accountUpdates);
      if (result.success) {
        onAccountUpdate({
          ...account,
          ...accountUpdates
        });
      } else {
        console.warn("Failed to update account total hours in sheets:", result.error);
        onAccountUpdate({
          ...account,
          ...accountUpdates
        });
      }
      
      setActiveSession(null);
      setClockedIn(false);
    } catch (err) {
      console.error("Error clocking out:", err);
      alert("Failed to clock out. Please try again.");
    } finally {
      setLoadingSession(false);
    }
  };
  const [schedDays, setSchedDays] = useState<string[]>(parseScheduleDays(account.schedule));
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState("");
  const [reqForm, setReqForm] = useState({ type: "Late Attendance", date: "", reason: "" });
  const [requestSubmitted, setRequestSubmitted] = useState("");
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const isFriday = new Date().getDay() === 5;

  // New Scheduler States
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [weeklyScheds, setWeeklyScheds] = useState<Record<string, string>>({
    Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: ""
  });
  const [selectedSlots, setSelectedSlots] = useState<Record<number, boolean>>({});
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect">("select");
  const [loadingScheds, setLoadingScheds] = useState(false);
  const [savingActiveDay, setSavingActiveDay] = useState(false);

  useEffect(() => {
    if (tab === "schedule") {
      setLoadingScheds(true);
      sheetsService.fetchWeeklySchedules().then(scheds => {
        const mySched = scheds.find(s => s.resident_ID === account.id);
        if (mySched) {
          setWeeklyScheds({
            Monday: mySched.Monday || "",
            Tuesday: mySched.Tuesday || "",
            Wednesday: mySched.Wednesday || "",
            Thursday: mySched.Thursday || "",
            Friday: mySched.Friday || "",
            Saturday: mySched.Saturday || "",
            Sunday: mySched.Sunday || "",
          });
        } else {
          setWeeklyScheds({
            Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: ""
          });
        }
        setLoadingScheds(false);
      }).catch(err => {
        console.error("Error fetching schedules", err);
        setLoadingScheds(false);
      });
    }
  }, [tab, account.id]);

  useEffect(() => {
    if (activeDay) {
      const fullDay = dayMap[activeDay];
      const timeStr = weeklyScheds[fullDay] || "";
      setSelectedSlots(parseTimeStringToSlots(timeStr));
    } else {
      setSelectedSlots({});
    }
  }, [activeDay, weeklyScheds]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

 const [teamMakers, setTeamMakers] = useState<Account[]>([]);
 const [teamScheds, setTeamScheds] = useState<Record<string, Record<string, string>>>({});
 const [loadingTeam, setLoadingTeam] = useState(false);

 useEffect(() => {
   if (tab !== "team") return;
   setLoadingTeam(true);
   Promise.all([
     accountsService.fetchResidentMakers(),
     sheetsService.fetchWeeklySchedules()
   ]).then(([makers, scheds]) => {
     setTeamMakers(makers.filter(m => m.status === "Active"));
     const byId: Record<string, Record<string, string>> = {};
     scheds.forEach(s => {
       byId[s.resident_ID] = {
         Monday: s.Monday || "", Tuesday: s.Tuesday || "", Wednesday: s.Wednesday || "",
         Thursday: s.Thursday || "", Friday: s.Friday || "", Saturday: s.Saturday || "", Sunday: s.Sunday || "",
       };
     });
     setTeamScheds(byId);
   }).catch(err => {
     console.error("Error loading team schedules", err);
   }).finally(() => setLoadingTeam(false));
 }, [tab]);

  const handleSlotMouseDown = (slotMins: number) => {
    setIsMouseDown(true);
    const newMode = !selectedSlots[slotMins] ? "select" : "deselect";
    setDragMode(newMode);
    setSelectedSlots(prev => ({
      ...prev,
      [slotMins]: newMode === "select"
    }));
  };

  const handleSlotMouseEnter = (slotMins: number) => {
    if (isMouseDown) {
      setSelectedSlots(prev => ({
        ...prev,
        [slotMins]: dragMode === "select"
      }));
    }
  };

  const computeTotalHours = (selected: Record<number, boolean>): number => {
    const count = Object.values(selected).filter(Boolean).length;
    return count * 0.5;
  };

  const saveDaySchedule = async () => {
    if (!activeDay) return;
    setSavingActiveDay(true);
    const timeString = serializeSlotsToTimeString(selectedSlots);
    const fullDay = dayMap[activeDay];
    try {
      await sheetsService.saveWeeklySchedule(account.id, fullDay, timeString);
      setWeeklyScheds(prev => ({
        ...prev,
        [fullDay]: timeString
      }));
      setScheduleSaved(`Successfully saved schedule for ${fullDay}!`);
      setTimeout(() => setScheduleSaved(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save schedule.");
    } finally {
      setSavingActiveDay(false);
    }
  };

  const clearDaySchedule = () => {
    setSelectedSlots({});
  };

  // Removed static toggle in favor of real sheets service actions

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

  const submitRequest = async () => {
    if (!reqForm.type || !reqForm.date || !reqForm.reason.trim()) {
      alert("Please fill in all fields (type, date, and reason).");
      return;
    }
    const newRequest: AttendanceRequest = {
      attendance_request_id: "ARQ-" + Date.now(),
      rm_id: account.id,
      type: reqForm.type,
      date: reqForm.date,
      reason: reqForm.reason.trim(),
      status: "Pending"
    };
    try {
      await sheetsService.addAttendanceRequest(newRequest);
      setRequestSubmitted("Request submitted successfully!");
      setReqForm({ type: "Late Attendance", date: "", reason: "" });
      setTimeout(() => setRequestSubmitted(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Attendance System" sub="Track your time and manage schedules" />
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {(["clock","schedule","team","request"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground")}>
            {t === "clock" ? "Time In/Out" : t === "schedule" ? "My Schedule" : t === "team" ? "Team Schedules" : "Attendance Request"}
          </button>
        ))}
      </div>

      {tab === "clock" && (
        <div className="max-w-sm">
          <div className="bg-card rounded-2xl border border-border p-8 text-center mb-4 animate-fade-in">
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all", clockedIn ? "bg-emerald-500/20 ring-4 ring-emerald-500/30 animate-pulse" : "bg-muted")}>
              <Clock className={cn("w-12 h-12", clockedIn ? "text-emerald-500" : "text-muted-foreground")} />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1 font-mono tracking-wider">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-muted-foreground text-sm mb-2">{currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            {clockedIn && activeSession && (
              <p className="text-emerald-500 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full w-fit mx-auto mt-2 border border-emerald-500/20">
                Clocked in at {new Date(activeSession.clock_in_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <button
            onClick={clockedIn ? handleClockOut : handleClockIn}
            disabled={loadingSession}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2", 
              clockedIn ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white",
              loadingSession && "opacity-50 cursor-not-allowed"
            )}
          >
            {loadingSession ? "Processing..." : clockedIn ? "⏹ Clock Out" : "▶ Clock In"}
          </button>
          {clockedIn && activeSession && (
            <div className="mt-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-3 text-center animate-fade-in">
              <p className="text-emerald-600 text-sm">Current session: <strong className="font-mono">{getSessionDuration()}</strong></p>
            </div>
          )}
        </div>
      )}

      {tab === "schedule" && (
        <div className="w-full">
          {isFriday && (
            <div className="max-w-4xl mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-600 text-sm"><strong>Friday reminder:</strong> Please update your schedule for next week before end of day.</p>
            </div>
          )}
          
          {loadingScheds ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-card border border-border rounded-xl max-w-4xl">
              Loading schedules...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
              {/* Day Selection List */}
              <div className="bg-card rounded-xl border border-border p-6 h-fit">
                <h3 className="font-semibold text-foreground mb-4 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  Select Day to Edit
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Select a day to open the calendar-like hourly schedule planner on the right.
                </p>
                <div className="space-y-2">
                  {days.map(d => {
                    const fullDay = dayMap[d];
                    const timeString = weeklyScheds[fullDay] || "";
                    const hasHours = timeString.trim() !== "";
                    const totalHours = computeTotalHours(parseTimeStringToSlots(timeString));
                    const isActive = activeDay === d;

                    return (
                      <button
                        key={d}
                        onClick={() => setActiveDay(d)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition flex items-center justify-between",
                          isActive
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-950 font-semibold"
                            : "bg-background border-border text-foreground hover:bg-muted/50"
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{fullDay}</span>
                            {hasHours && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-700 px-2 py-0.5 rounded font-bold font-mono">
                                {totalHours} hrs
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs mt-1 truncate",
                            hasHours ? "text-muted-foreground" : "text-muted-foreground/60 italic"
                          )}>
                            {getFormattedDaySummary(timeString)}
                          </p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all",
                          isActive
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : hasHours
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                            : "border-muted-foreground/30 bg-muted"
                        )}>
                          {hasHours ? <Check className="w-3.5 h-3.5" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Planner panel */}
              <div className="bg-card rounded-xl border border-border p-6 flex flex-col min-h-[500px]">
                {activeDay ? (
                  <div className="flex flex-col h-full flex-1">
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-base">
                          {dayMap[activeDay]} Schedule
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Click & drag to select your hours
                        </p>
                      </div>
                      <button
                        onClick={clearDaySchedule}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All
                      </button>
                    </div>

                    {/* LettuceMeet slot grid */}
                    <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 mb-4 border border-border/80 rounded-lg bg-background/50 divide-y divide-border/60">
                      {TIME_SLOTS.map(mins => {
                        const isSelected = !!selectedSlots[mins];
                        return (
                          <div
                            key={mins}
                            onMouseDown={() => handleSlotMouseDown(mins)}
                            onMouseEnter={() => handleSlotMouseEnter(mins)}
                            className={cn(
                              "py-2 px-4 flex items-center justify-between cursor-pointer select-none transition-all duration-100",
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-800 font-medium font-semibold"
                                : "hover:bg-muted/40 text-muted-foreground text-sm"
                            )}
                          >
                            <span className="font-mono text-xs">{formatSlotDisplay(mins)}</span>
                            <div className={cn(
                              "w-4 h-4 rounded-full border transition-all",
                              isSelected ? "bg-emerald-500 border-emerald-600 scale-110" : "border-muted-foreground/30 bg-background"
                            )} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-auto border-t border-border pt-4">
                      <div className="flex justify-between items-center mb-3 bg-muted/60 p-3 rounded-lg">
                        <span className="text-xs font-semibold text-muted-foreground">Total Hours for Day:</span>
                        <span className="text-base font-bold text-card-foreground font-mono">
                          {computeTotalHours(selectedSlots)} hrs
                        </span>
                      </div>

                      {scheduleSaved && (
                        <p className="text-emerald-600 text-xs mb-3 text-center animate-fade-in">
                          {scheduleSaved}
                        </p>
                      )}

                      <button
                        onClick={saveDaySchedule}
                        disabled={savingActiveDay}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/10"
                      >
                        <Save className="w-4 h-4" />
                        {savingActiveDay ? "Saving Schedule..." : `Save ${dayMap[activeDay]} Schedule`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl">
                    <Calendar className="w-12 h-12 text-muted-foreground/40 mb-3" />
                    <h4 className="font-semibold text-foreground/80 mb-1">No Day Selected</h4>
                    <p className="text-xs text-muted-foreground max-w-[240px]">
                      Please choose a day of the week from the left panel to configure and save your schedule.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
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
      {tab === "team" && (
        <div className="w-full">
          {loadingTeam ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-card border border-border rounded-xl">
              Loading team schedules...
            </div>
          ) : teamMakers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-card border border-border rounded-xl">
              No other active Resident Makers found.
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Resident Maker
                    </th>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                      <th key={d} className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMakers.map(rm => {
                    const sched = teamScheds[rm.id] || {};
                    const isMe = rm.id === account.id;
                    return (
                      <tr key={rm.id} className={cn("border-b border-muted transition", isMe ? "bg-emerald-500/5" : "hover:bg-muted/50")}>
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <span className="font-semibold text-foreground">{rm.firstName} {rm.lastName}</span>
                          {isMe && <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">(You)</span>}
                          <span className="block text-[10px] text-muted-foreground font-normal">{rm.program || "—"}</span>
                        </td>
                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(fullDay => {
                          const val = sched[fullDay] || "";
                          const hasValue = val.trim() !== "";
                          if (!hasValue) {
                            return (
                              <td key={fullDay} className="px-2 py-3 align-top">
                                <div className="w-full max-w-[110px] h-[28px] rounded-lg border border-dashed border-border/50 bg-muted/15 mx-auto" />
                              </td>
                            );
                          }
                          const slots = val.split(",");
                          return (
                            <td key={fullDay} className="px-2 py-3 align-top">
                              <div className="flex flex-col gap-1 items-center">
                                {slots.map((slot, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] font-mono font-semibold px-1.5 py-1 rounded-md bg-purple-500/10 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100 whitespace-nowrap"
                                  >
                                    {formatRangeTo12H(slot)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}