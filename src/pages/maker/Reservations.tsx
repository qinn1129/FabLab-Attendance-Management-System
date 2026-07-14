import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Cpu, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Lock,
  X,
  Check
} from "lucide-react";
import { PageHeader } from "../../components/common";
import { cn } from "../../lib/utils";
import { sheetsService, type Machine, type MachineReservation } from "../../services/sheetsService";
import { accountsService, type Account } from "../../services/accountsService";

// Calendar constants
const START_HOUR = 7;
const END_HOUR = 22; // 10 PM
const HOUR_HEIGHT = 60; // 1 hour = 60px (1 minute = 1px)
const TOTAL_HOURS = END_HOUR - START_HOUR; // 15 hours
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT; // 900px

// List of hours for Y-axis and grid lines
const HOURS_ARRAY = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

// Helper to convert minutes to AM/PM format
function formatMinsTo12H(m: number): string {
  const mins = m % 60;
  let hrs = Math.floor(m / 60);
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  return `${hrs}:${String(mins).padStart(2, "0")} ${ampm}`;
}

// Snapping helper (15-minute snaps = 15px increments)
function snapMins(mins: number): number {
  return Math.round(mins / 15) * 15;
}

// Get YYYY-MM-DD local format
function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Find Monday of a given date's week
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

// Generate the 7 Dates of the week starting from Monday
function getWeekDates(weekStart: Date): Date[] {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Format date header: e.g. "Mon, 13.07."
function formatDateHeader(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dStr = String(date.getDate()).padStart(2, "0");
  const mStr = String(date.getMonth() + 1).padStart(2, "0");
  return `${days[date.getDay()]}, ${dStr}.${mStr}.`;
}

interface InteractionState {
  type: "draw" | "resize-top" | "resize-bottom" | "move";
  dayIndex: number;
  anchorMins: number; // For scaling logic
  initialStartMins?: number;
  initialEndMins?: number;
  resId?: string; // If dragging existing booking
  dragStartDay?: number;
  clickOffsetMins?: number; // Distance of click from block top
}

export function MakerReservations({ account }: { account: Account }) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [reservations, setReservations] = useState<MachineReservation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Selection states
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  
  // Interactive draft selection state
  const [draftReservation, setDraftReservation] = useState<{ dayIndex: number; startMins: number; endMins: number } | null>(null);
  
  // Interaction tracker
  const [activeInteraction, setActiveInteraction] = useState<InteractionState | null>(null);

  // Editing states for existing bookings
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [originalReservationState, setOriginalReservationState] = useState<{ start_time: string; end_time: string } | null>(null);

  // UX states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Load all sheet data
  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [fetchedMachines, fetchedReservations, fetchedAccounts] = await Promise.all([
        sheetsService.fetchMachines(),
        sheetsService.fetchReservations(),
        accountsService.fetchAccounts()
      ]);
      
      setMachines(fetchedMachines);
      setReservations(fetchedReservations);
      setAccounts(fetchedAccounts);
      
      if (fetchedMachines.length > 0 && !selectedMachineId) {
        setSelectedMachineId(fetchedMachines[0].id);
      }
    } catch (e) {
      console.error("Error loading reservations data", e);
      setErrorMsg("Failed to load machine or reservation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const weekDates = getWeekDates(currentWeekStart);

  // Account ID to Name resolver
  const getMakerName = (rmId: string): string => {
    if (rmId === account.id) return "You";
    const found = accounts.find(a => a.id === rmId);
    return found ? `${found.firstName} ${found.lastName}` : "Unknown Maker";
  };

  // Check if a date string falls inside the currently visible week dates
  const getDayIndexForDate = (date: Date): number => {
    const localDateStr = getLocalDateString(date);
    return weekDates.findIndex(d => getLocalDateString(d) === localDateStr);
  };

  // Format existing reservations for the weekly columns
  const visibleReservations = reservations
    .filter(r => r.machine_id === selectedMachineId)
    .map(r => {
      const start = new Date(r.start_time);
      const end = new Date(r.end_time);
      const dayIndex = getDayIndexForDate(start);
      
      const startMins = start.getHours() * 60 + start.getMinutes();
      const endMins = end.getHours() * 60 + end.getMinutes();

      return {
        ...r,
        dayIndex,
        startMins,
        endMins,
        isMine: r.rm_id === account.id
      };
    })
    // Filter to only display reservations falling in the current visible week
    .filter(r => r.dayIndex !== -1);

  // Snaps client coordinates to snap intervals relative to the calendar viewport
  const getMinsFromClientY = (clientY: number, columnElement: HTMLElement): number => {
    const rect = columnElement.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(GRID_HEIGHT, relativeY));
    // Each minute is 1px, starting at START_HOUR (7 AM = 420 minutes)
    const mins = Math.round(clampedY / 15) * 15 + START_HOUR * 60;
    return mins;
  };

  // Navigations for previous / next week
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(prev);
    setDraftReservation(null);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
    setDraftReservation(null);
  };

  const handleDateChange = (dateVal: string) => {
    if (!dateVal) return;
    const parsed = new Date(dateVal);
    setCurrentWeekStart(getMonday(parsed));
    setDraftReservation(null);
  };

  // Mousedown handler inside the columns grid to start drawing a new block
  const handleColumnMouseDown = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    // If target is inside an existing block or resize handle, ignore to allow their own mouse drag logic
    const target = e.target as HTMLElement;
    if (target.closest(".res-block") || target.closest(".resize-handle") || target.closest(".float-actions")) {
      return;
    }

    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const columnEl = e.currentTarget;
    const startMins = getMinsFromClientY(e.clientY, columnEl);
    
    // Check if clicked exactly on top of an existing booking
    const overlaps = visibleReservations.find(r => r.dayIndex === dayIndex && startMins >= r.startMins && startMins < r.endMins);
    if (overlaps) return;

    setDraftReservation({
      dayIndex,
      startMins,
      endMins: Math.min(1320, startMins + 60) // default to 1 hour
    });

    setActiveInteraction({
      type: "draw",
      dayIndex,
      anchorMins: startMins
    });
  };

  // Starts editing an existing user reservation
  const handleStartEdit = (res: any) => {
    setErrorMsg("");
    setSuccessMsg("");
    setDraftReservation(null); // clear draft if drawing
    setEditingReservationId(res.reservation_id);
    setOriginalReservationState({
      start_time: res.start_time,
      end_time: res.end_time
    });
  };

  // Cancels editing: restores original times
  const handleCancelEdit = (resId: string) => {
    if (originalReservationState) {
      setReservations(prev => prev.map(r => r.reservation_id === resId ? {
        ...r,
        start_time: originalReservationState.start_time,
        end_time: originalReservationState.end_time
      } : r));
    }
    setEditingReservationId(null);
    setOriginalReservationState(null);
  };

  // Confirms editing: checks overlaps and updates sheets database
  const handleConfirmEdit = async (resId: string) => {
    setErrorMsg("");
    setSuccessMsg("");

    const currentRes = reservations.find(r => r.reservation_id === resId);
    if (!currentRes) return;

    const bStart = new Date(currentRes.start_time);
    const bEnd = new Date(currentRes.end_time);

    // Validation: Date in past check
    const now = new Date();
    if (bStart.getTime() < now.getTime() - 5 * 60 * 1000) {
      setErrorMsg("You cannot reschedule a booking to a past time.");
      return;
    }

    // Validation: Overlap check
    const overlap = reservations.find(r => {
      if (r.reservation_id === resId || r.machine_id !== selectedMachineId) return false;
      const rStart = new Date(r.start_time).getTime();
      const rEnd = new Date(r.end_time).getTime();
      return bStart.getTime() < rEnd && bEnd.getTime() > rStart;
    });

    if (overlap) {
      const makerName = getMakerName(overlap.rm_id);
      const oStart = formatMinsTo12H(new Date(overlap.start_time).getHours() * 60 + new Date(overlap.start_time).getMinutes());
      const oEnd = formatMinsTo12H(new Date(overlap.end_time).getHours() * 60 + new Date(overlap.end_time).getMinutes());
      setErrorMsg(`Rescheduling conflict! Overlaps with reservation by ${makerName} (${oStart} - ${oEnd}).`);
      return;
    }

    setSubmitting(true);
    try {
      await sheetsService.updateReservation(resId, {
        start_time: currentRes.start_time,
        end_time: currentRes.end_time
      });
      setSuccessMsg("Reservation updated successfully!");
      setEditingReservationId(null);
      setOriginalReservationState(null);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update reservation in database.");
    } finally {
      setSubmitting(false);
    }
  };

  // Mousedown handler for dragging top of editing reservation to move/reschedule
  const handleMoveMousedown = (e: React.MouseEvent, res: any) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg("");

    const blockEl = (e.currentTarget as HTMLElement).closest(".res-block") as HTMLElement;
    const rect = blockEl.getBoundingClientRect();
    const clickOffsetMins = Math.round((e.clientY - rect.top) / 15) * 15;

    setActiveInteraction({
      type: "move",
      resId: res.reservation_id,
      dayIndex: res.dayIndex,
      dragStartDay: res.dayIndex,
      anchorMins: res.startMins,
      initialStartMins: res.startMins,
      initialEndMins: res.endMins,
      clickOffsetMins
    });
  };

  // Mousedown handler for dragging bottom of editing reservation to resize/lengthen
  const handleResizeMousedown = (e: React.MouseEvent, res: any) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg("");

    setActiveInteraction({
      type: "resize-bottom",
      resId: res.reservation_id,
      dayIndex: res.dayIndex,
      anchorMins: res.startMins,
      initialStartMins: res.startMins,
      initialEndMins: res.endMins
    });
  };

  // Global mousemove and mouseup events are registered during active drag
  useEffect(() => {
    if (!activeInteraction) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!gridContainerRef.current) return;

      const columns = gridContainerRef.current.querySelectorAll(".grid-column");
      const currentColumnEl = columns[activeInteraction.dayIndex] as HTMLElement;

      if (activeInteraction.type === "draw") {
        const currentMins = getMinsFromClientY(e.clientY, currentColumnEl);
        const anchor = activeInteraction.anchorMins;

        if (currentMins > anchor) {
          setDraftReservation({
            dayIndex: activeInteraction.dayIndex,
            startMins: anchor,
            endMins: Math.min(1320, currentMins)
          });
        } else {
          setDraftReservation({
            dayIndex: activeInteraction.dayIndex,
            startMins: Math.max(420, currentMins),
            endMins: anchor
          });
        }
      } else if (activeInteraction.type === "resize-bottom") {
        const currentMins = getMinsFromClientY(e.clientY, currentColumnEl);
        const minEnd = activeInteraction.anchorMins + 15; // Minimum 15-minute reservation
        const finalEnd = Math.max(minEnd, Math.min(1320, currentMins));
        
        if (activeInteraction.resId) {
          setReservations(prev => prev.map(r => {
            if (r.reservation_id === activeInteraction.resId) {
              const targetDate = weekDates[activeInteraction.dayIndex];
              const endDateTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), Math.floor(finalEnd / 60), finalEnd % 60);
              return {
                ...r,
                end_time: endDateTime.toISOString()
              };
            }
            return r;
          }));
        } else {
          setDraftReservation(prev => prev ? { ...prev, endMins: finalEnd } : null);
        }
      } else if (activeInteraction.type === "resize-top") {
        const currentMins = getMinsFromClientY(e.clientY, currentColumnEl);
        const maxStart = activeInteraction.anchorMins - 15;
        const finalStart = Math.min(maxStart, Math.max(420, currentMins));

        setDraftReservation(prev => prev ? { ...prev, startMins: finalStart } : null);
      } else if (activeInteraction.type === "move" && activeInteraction.resId) {
        // Drag-and-drop movement across different columns/days
        const gridRect = gridContainerRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const gridWidth = gridRect.width;
        
        // Find which column is being hovered
        const relativeX = clientX - gridRect.left;
        let hoveredDay = Math.floor(relativeX / (gridWidth / 7));
        hoveredDay = Math.max(0, Math.min(6, hoveredDay));

        const targetColEl = columns[hoveredDay] as HTMLElement;
        const mouseGridY = e.clientY - targetColEl.getBoundingClientRect().top;
        const duration = activeInteraction.initialEndMins! - activeInteraction.initialStartMins!;

        // Snap and clamp vertical coordinates
        const rawMins = Math.round(mouseGridY / 15) * 15 + START_HOUR * 60;
        const offsetMins = activeInteraction.clickOffsetMins || 0;
        let newStart = rawMins - offsetMins;
        newStart = Math.max(420, Math.min(1320 - duration, newStart));
        const newEnd = newStart + duration;

        // Perform real-time optimistic update in local state for drag preview
        setReservations(prev => prev.map(r => {
          if (r.reservation_id === activeInteraction.resId) {
            const targetDate = weekDates[hoveredDay];
            const startDateTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), Math.floor(newStart / 60), newStart % 60);
            const endDateTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), Math.floor(newEnd / 60), newEnd % 60);

            return {
              ...r,
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString()
            };
          }
          return r;
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Just terminate movement/resizing interaction. The draft changes remain
      // in local state. The changes are saved on Google Sheets only on Confirm (Check) click.
      setActiveInteraction(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeInteraction, reservations, weekDates]);

  // Saves the newly drawn active draft selection to database
  const handleSaveDraft = async () => {
    if (!draftReservation) return;
    setErrorMsg("");
    setSuccessMsg("");
    
    const targetDate = weekDates[draftReservation.dayIndex];
    const sHour = Math.floor(draftReservation.startMins / 60);
    const sMin = draftReservation.startMins % 60;
    const eHour = Math.floor(draftReservation.endMins / 60);
    const eMin = draftReservation.endMins % 60;

    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), sHour, sMin);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), eHour, eMin);

    const now = new Date();
    if (start.getTime() < now.getTime() - 5 * 60 * 1000) {
      setErrorMsg("You cannot book a timeslot in the past.");
      return;
    }

    // Double-check overlaps inside visible week
    const overlap = visibleReservations.find(r => {
      return r.dayIndex === draftReservation.dayIndex &&
             draftReservation.startMins < r.endMins &&
             draftReservation.endMins > r.startMins;
    });

    if (overlap) {
      const makerName = getMakerName(overlap.rm_id);
      const oStart = formatMinsTo12H(overlap.startMins);
      const oEnd = formatMinsTo12H(overlap.endMins);
      setErrorMsg(`Cannot book! This slot overlaps with ${makerName} (${oStart} - ${oEnd}).`);
      return;
    }

    setSubmitting(true);
    const newReservation: MachineReservation = {
      reservation_id: "RES-" + Date.now(),
      machine_id: selectedMachineId,
      rm_id: account.id,
      start_time: start.toISOString(),
      end_time: end.toISOString()
    };

    try {
      await sheetsService.addReservation(newReservation);
      setReservations(prev => [...prev, newReservation]);
      setSuccessMsg("Reservation created successfully!");
      setDraftReservation(null);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save reservation. Please sync and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (resId: string) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await sheetsService.deleteReservation(resId);
      setReservations(prev => prev.filter(r => r.reservation_id !== resId));
      setSuccessMsg("Reservation cancelled successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to cancel reservation.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      <PageHeader 
        title="Machine Reservation Calendar" 
        sub="Drag and resize to create or edit machine bookings"
        action={
          <button 
            onClick={loadData} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-sm font-semibold transition shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Database
          </button>
        }
      />

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-start gap-3 animate-fade-in text-sm font-medium">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl flex items-start gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm font-mono bg-card border border-border rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-sidebar-primary" />
          Loading calendar databases and machines...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Machine selector (Sidebar - left) */}
          <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sidebar-primary" />
              Select Machine
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {machines.map(m => {
                const isSelected = m.id === selectedMachineId;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMachineId(m.id);
                      setDraftReservation(null);
                      setErrorMsg("");
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1",
                      isSelected 
                        ? "bg-purple-500/10 border-purple-500 text-purple-950 dark:text-purple-100 shadow-sm"
                        : "bg-background border-border text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sm tracking-tight">{m["Machine Model"]}</span>
                      {/* Unified purple badges for all machine IDs */}
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {m.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/75" />
                      <span className="truncate">{m["Placement / Location Notes"]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Weekly Grid Container */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Header & Date / Navigation Filter Controls */}
            <div className="bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={selectedMachineId}
                  onChange={e => {
                    setSelectedMachineId(e.target.value);
                    setDraftReservation(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m["Machine Model"]}</option>
                  ))}
                </select>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrevWeek}
                    className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition"
                    title="Previous Week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextWeek}
                    className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition"
                    title="Next Week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden md:inline">Week starting:</span>
                <input 
                  type="date"
                  value={getLocalDateString(currentWeekStart)}
                  onChange={e => handleDateChange(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition w-full sm:w-auto"
                />
              </div>
            </div>

            {/* Calendar Grid Box */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
              
              {/* Header row: Days list */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted text-foreground border-b border-border/80 text-center font-bold text-xs select-none">
                <div className="p-3 border-r border-border/60 text-muted-foreground flex items-center justify-center">Time</div>
                {weekDates.map((date, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-3 border-r border-border/60 last:border-r-0 flex flex-col gap-0.5",
                      getLocalDateString(date) === getLocalDateString(new Date()) && "bg-purple-500/10 text-purple-900 dark:text-purple-100"
                    )}
                  >
                    <span>{formatDateHeader(date).split(",")[0]}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{formatDateHeader(date).split(",")[1]}</span>
                  </div>
                ))}
              </div>

              {/* Scrollable Viewport */}
              <div className="max-h-[600px] overflow-y-auto relative w-full flex" style={{ contentVisibility: "auto" }}>
                
                {/* Y-axis hour labels */}
                <div className="w-[80px] flex-shrink-0 bg-muted/30 border-r border-border select-none relative font-mono text-[10px] text-muted-foreground" style={{ height: `${GRID_HEIGHT}px` }}>
                  {HOURS_ARRAY.map((hour, idx) => (
                    <div 
                      key={hour} 
                      className="absolute left-0 right-0 border-b border-border/40 text-center flex items-start justify-center pt-1"
                      style={{ 
                        top: `${idx * HOUR_HEIGHT}px`, 
                        height: `${HOUR_HEIGHT}px` 
                      }}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {/* Main 7 Columns grid container */}
                <div 
                  ref={gridContainerRef}
                  className="flex-1 grid grid-cols-7 relative overflow-hidden" 
                  style={{ height: `${GRID_HEIGHT}px` }}
                >
                  
                  {/* Background grid horizontal lines */}
                  <div className="absolute inset-0 pointer-events-none z-0">
                    {HOURS_ARRAY.map((_, idx) => (
                      <div 
                        key={idx} 
                        className="absolute left-0 right-0 border-b border-border/30"
                        style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      />
                    ))}
                  </div>

                  {/* Rendering the daily column contents */}
                  {weekDates.map((_, dayIndex) => {
                    const dayReservations = visibleReservations.filter(r => r.dayIndex === dayIndex);
                    
                    return (
                      <div
                        key={dayIndex}
                        className="grid-column relative h-full border-r border-border/30 last:border-r-0 z-10"
                        onMouseDown={e => handleColumnMouseDown(e, dayIndex)}
                      >
                        
                        {/* Reservation blocks */}
                        {dayReservations.map(res => {
                          const topPos = (res.startMins - START_HOUR * 60);
                          const blockHeight = res.endMins - res.startMins;
                          const makerName = getMakerName(res.rm_id);
                          const formattedTime = `${formatMinsTo12H(res.startMins)} - ${formatMinsTo12H(res.endMins)}`;

                          // If the reservation belongs to another user, it is Locked.
                          const isLocked = !res.isMine;
                          const isEditing = editingReservationId === res.reservation_id;

                          if (isEditing) {
                            return (
                              <div
                                key={res.reservation_id}
                                className={cn(
                                  "res-block absolute left-1 right-1 rounded-xl border-2 border-dashed border-purple-600 bg-purple-500/10 text-purple-950 dark:text-purple-100 shadow-lg z-30 transition-all"
                                )}
                                style={{ 
                                  top: `${topPos}px`, 
                                  height: `${blockHeight}px` 
                                }}
                              >
                                {/* Top drag zone (Move): 65% of the block height */}
                                <div 
                                  className="absolute top-0 left-0 right-0 h-[65%] cursor-move flex flex-col justify-between p-2 pb-0"
                                  onMouseDown={(e) => handleMoveMousedown(e, res)}
                                >
                                  <div className="flex items-start justify-between gap-1 w-full overflow-hidden">
                                    <span className="font-bold truncate select-none leading-none">
                                      {makerName}
                                    </span>
                                    <Pencil className="w-5 h-5 text-purple-600 dark:text-purple-300 flex-shrink-0 opacity-80" />
                                  </div>
                                  <div className="text-[7.5px] font-semibold text-purple-700 dark:text-purple-300 select-none">
                                    Drag top to move
                                  </div>
                                </div>

                                {/* Bottom drag zone (Resize): 35% of the block height */}
                                <div 
                                  className="absolute bottom-0 left-0 right-0 h-[35%] cursor-ns-resize flex items-end justify-center pb-1 hover:bg-purple-600/15 transition rounded-b-xl"
                                  onMouseDown={(e) => handleResizeMousedown(e, res)}
                                >
                                  {/* Resize handle bar */}
                                  <div className="w-6 h-1 rounded-full bg-purple-600/50 mb-0.5" />
                                </div>

                                {/* Floating Confirm / Cancel controls for the editing block */}
                                <div className="float-actions absolute -bottom-11 left-1/2 -translate-x-1/2 bg-popover border border-border shadow-lg rounded-full py-1.5 px-2.5 flex items-center gap-2 z-40">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelEdit(res.reservation_id);
                                    }}
                                    className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition shadow-sm"
                                    title="Discard edits"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConfirmEdit(res.reservation_id);
                                    }}
                                    disabled={submitting}
                                    className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition disabled:opacity-50 shadow-sm"
                                    title="Confirm changes"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={res.reservation_id}
                              className={cn(
                                "res-block absolute left-1 right-1 rounded-xl p-2 flex flex-col justify-between text-[10px] border shadow-xs transition-all z-20 group bg-card",
                                isLocked
                                  ? "bg-muted/80 border-border/80 text-muted-foreground select-none"
                                  : "border-purple-200 text-purple-950 dark:text-purple-100 dark:border-purple-800"
                              )}
                              style={{ 
                                top: `${topPos}px`, 
                                height: `${blockHeight}px` 
                              }}
                              title={`${selectedMachine?.["Machine Model"]} - ${formattedTime} (by ${makerName})`}
                            >
                              <div className="flex items-start justify-between gap-1.5 w-full overflow-hidden">
                                <span className="font-bold truncate select-none leading-none pt-1">
                                  {makerName}
                                </span>
                                {isLocked ? (
                                  <Lock className="w-3.5 h-3.5 flex-shrink-0 opacity-60 mt-0.5" />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(res);
                                    }}
                                    className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-300 transition"
                                    title="Edit reservation"
                                  >
                                    <Pencil className="w-5.5 h-5.5 text-purple-600 dark:text-purple-300 flex-shrink-0" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[8px] font-semibold font-mono tracking-tight select-none">
                                <span>{formatMinsTo12H(res.startMins).split(" ")[0]} {isLocked ? "🔒" : "📝"}</span>
                                <span className="text-[7.5px] opacity-75">{Math.round(blockHeight / 60 * 10) / 10}h</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Rendering the active draft reservation box */}
                        {draftReservation && draftReservation.dayIndex === dayIndex && (() => {
                          const draftTop = draftReservation.startMins - START_HOUR * 60;
                          const draftHeight = draftReservation.endMins - draftReservation.startMins;
                          const formattedRange = `${formatMinsTo12H(draftReservation.startMins)} - ${formatMinsTo12H(draftReservation.endMins)}`;
                          const draftHrs = Math.round(draftHeight / 60 * 100) / 100;

                          return (
                            <div
                              className="absolute left-1.5 right-1.5 border-2 border-dashed border-purple-600 bg-purple-500/10 rounded-xl flex flex-col justify-between p-2 shadow-lg animate-fade-in z-30 pointer-events-auto"
                              style={{
                                top: `${draftTop}px`,
                                height: `${draftHeight}px`
                              }}
                            >
                              {/* Top Resize Handle */}
                              <div 
                                className="resize-handle absolute top-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center hover:bg-purple-600/30 rounded-t-md transition"
                                onMouseDown={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveInteraction({
                                    type: "resize-top",
                                    dayIndex,
                                    anchorMins: draftReservation.endMins
                                  });
                                }}
                              >
                                <div className="w-6 h-1 rounded-full bg-purple-600/60" />
                              </div>

                              {/* Draft details label */}
                              <div className="text-[10px] font-bold text-purple-800 dark:text-purple-200 mt-2 select-none select-none text-center leading-tight truncate">
                                Selected: {draftHrs} hrs
                              </div>

                              <div className="text-[8px] font-mono font-bold text-purple-700 dark:text-purple-300 select-none text-center truncate mb-1">
                                {formatMinsTo12H(draftReservation.startMins).split(" ")[0]} - {formatMinsTo12H(draftReservation.endMins).split(" ")[0]}
                              </div>

                              {/* Floating inline Confirm/Cancel controls */}
                              <div className="float-actions absolute -bottom-11 left-1/2 -translate-x-1/2 bg-popover border border-border shadow-lg rounded-full py-1.5 px-2.5 flex items-center gap-2 z-40">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDraftReservation(null);
                                  }}
                                  className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition shadow-sm"
                                  title="Discard selection"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveDraft();
                                  }}
                                  disabled={submitting}
                                  className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition disabled:opacity-50 shadow-sm"
                                  title="Confirm reservation"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Bottom Resize Handle */}
                              <div 
                                className="resize-handle absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center hover:bg-purple-600/30 rounded-b-md transition"
                                onMouseDown={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveInteraction({
                                    type: "resize-bottom",
                                    dayIndex,
                                    anchorMins: draftReservation.startMins
                                  });
                                }}
                              >
                                <div className="w-6 h-1 rounded-full bg-purple-600/60" />
                              </div>
                            </div>
                          );
                        })()}
                        
                      </div>
                    );
                  })}

                </div>

              </div>

              {/* Bottom indicator bar for active selections */}
              {draftReservation && (
                <div className="bg-purple-500/5 border-t border-purple-500/20 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/40 rounded-xl flex items-center justify-center text-purple-700 dark:text-purple-300">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">
                        Draft Reservation: {selectedMachine?.["Machine Model"]}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Selected: <strong className="text-foreground">{weekDates[draftReservation.dayIndex].toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</strong> @ <strong className="font-mono text-purple-600 dark:text-purple-400">{formatMinsTo12H(draftReservation.startMins)} - {formatMinsTo12H(draftReservation.endMins)}</strong> ({Math.round((draftReservation.endMins - draftReservation.startMins) / 60 * 100) / 100} hours)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <button
                      onClick={() => setDraftReservation(null)}
                      className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold transition"
                    >
                      Discard Draft
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      disabled={submitting}
                      className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {submitting ? "Booking slot..." : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Guidelines indicator */}
            <div className="p-4 bg-muted/40 border border-border/80 rounded-2xl flex gap-3 text-xs text-muted-foreground leading-relaxed">
              <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Weekly Grid Tips:</strong> Click and drag vertically in any empty column to define a new reservation. 
                Use the handles on the top or bottom of your selection to fine-tune the timeslot (snaps to 15-minute intervals). 
                You can drag and drop your existing bookings (marked with a <Pencil className="w-3 h-3 inline text-purple-600" /> icon) to relocate them to other hours or days. 
                Reservations made by other makers are locked (<Lock className="w-3 h-3 inline text-muted-foreground" />) and cannot be rescheduled.
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
