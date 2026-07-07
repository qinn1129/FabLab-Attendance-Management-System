import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, Calendar, Save, Trash2, Check } from "lucide-react";
import { PageHeader, Select, Input } from "../../components/common";
import { cn } from "../../lib/utils";
import { accountsService, parseScheduleDays, stringifyScheduleDays, type Account } from "../../services/accountsService";
import { sheetsService } from "../../services/sheetsService";

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
    </div>
  );
}