import { COMMISSIONS as initialCommissions } from "../constants/mockData";

export interface Machine {
  id: string;
  "Machine Model": string;
  "Placement / Location Notes": string;
}

export interface MachineReservation {
  reservation_id: string;
  machine_id: string;
  rm_id: string;
  start_time: string;
  end_time: string;
}

export interface WeeklySchedule {
  resident_ID: string;
  Monday: string;
  Tuesday: string;
  Wednesday: string;
  Thursday: string;
  Friday: string;
  Saturday?: string;
  Sunday?: string;
  [key: string]: string | undefined;
}

export interface AttendanceLog {
  id: string;
  resident_id: string;
  clock_in_timestamp: string;
  clock_out_timestamp: string;
  total_hours: number;
  status: "Active" | "Completed" | "Invalid";
}

export interface Commission {
  id: string;
  client: string;
  clientEmail: string;
  clientContactNumber?: string;
  clientType: string;
  affiliation?: string;
  isDlsuStudent?: boolean;
  idNumber: string;
  program: string;
  college: string;
  department: string;
  service: string;
  purpose: string;
  purposeOther?: string;
  color: string;
  colorOther?: string;
  filament: string;
  urgency?: string;
  expectedPickupDate?: string;
  pickupOption?: string;
  weight: number;
  notes: string;
  file: string;
  driveLink?: string;
  submitted: string;
  rm: string | null;
  printer: string | null;
  status: string;
  deadline: string | null;
  problems: string | null;
}

const LOCAL_STORAGE_KEY = "fablab_commissions_v2";

// Helper to check if Google Apps Script URL is set
const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

// Seed localStorage with mock data if empty
const seedLocalStorage = (): Commission[] => {
  const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.error("Error parsing local storage commissions", e);
    }
  }

  // Map initial commissions from mockData.ts to the new full Commission schema
  const seeded: Commission[] = initialCommissions.map((c, i) => ({
    id: c.id,
    client: c.client,
    clientEmail: `${c.client.toLowerCase().replace(/\s+/g, ".")}@dlsu.edu.ph`,
    clientType: "Student",
    clientContactNumber: "",
    affiliation: "",
    isDlsuStudent: true,
    idNumber: `120${(10000 + i).toString()}`,
    program: "BSCS-ST",
    college: "CCS",
    department: "",
    service: c.service + (c.file === "Has File" ? " W/File" : ""),
    purpose: "Academic / Thesis",
    purposeOther: "",
    color: c.color,
    colorOther: "",
    filament: c.filament,
    urgency: "Standard (3-5 days)",
    expectedPickupDate: "",
    pickupOption: "Animo Labs FabLab JGIC",
    weight: 150,
    notes: "Preseeded mock commission data.",
    file: c.file === "Has File" ? "model_file.stl" : "",
    driveLink: "",
    submitted: c.submitted,
    rm: c.rm,
    printer: c.printer,
    status: c.status,
    deadline: c.deadline === "Pending Approval" ? null : c.deadline,
    problems: null,
  }));

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

export const sheetsService = {
  /**
   * Fetches all commissions from Google Sheets or localStorage fallback.
   */
  async fetchCommissions(): Promise<Commission[]> {
    const url = getScriptUrl();
    if (!url) {
      console.log(
        "[sheetsService] No VITE_GOOGLE_SCRIPT_URL found. Using localStorage fallback.",
      );
      return seedLocalStorage();
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=commission_reqs`;
      const response = await fetch(fetchUrl);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Parse numerical weight and normalize values
      return data.map((item: any) => ({
        ...item,
        weight: Number(item.weight) || 0,
        rm: item.rm || null,
        printer: item.printer || null,
        deadline: item.deadline || null,
        problems: item.problems || null,
      }));
    } catch (error) {
      console.error(
        "[sheetsService] Failed to fetch from Google Sheets. Falling back to localStorage.",
        error,
      );
      return seedLocalStorage();
    }
  },

  /**
   * Adds a new commission request.
   */
  async addCommission(
    form: Omit<
      Commission,
      "rm" | "printer" | "status" | "deadline" | "problems"
    >,
  ): Promise<Commission> {
    const newCommission: Commission = {
      ...form,
      rm: null,
      printer: null,
      status: "Awaiting Approval",
      deadline: null,
      problems: null,
    };

    const url = getScriptUrl();
    if (!url) {
      const data = seedLocalStorage();
      data.push(newCommission);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return newCommission;
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=commission_reqs`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors", // Crucial for cross-origin script redirects
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "commission_reqs",
          action: "add",
          data: newCommission,
        }),
      });
      return newCommission;
    } catch (error) {
      console.error(
        "[sheetsService] Failed to add to Google Sheets. Saving to localStorage.",
        error,
      );
      const data = seedLocalStorage();
      data.push(newCommission);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return newCommission;
    }
  },

  /**
   * Updates an existing commission.
   */
  async updateCommission(
    id: string,
    updates: Partial<Commission>,
  ): Promise<void> {
    const url = getScriptUrl();
    if (!url) {
      const data = seedLocalStorage();
      const idx = data.findIndex((c) => c.id === id);
      if (idx > -1) {
        data[idx] = { ...data[idx], ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      return;
    }
    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=commission_reqs`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "commission_reqs",
          action: "update",
          id,
          data: updates,
        }),
      });
    } catch (error) {
      console.error(
        "[sheetsService] Failed to update Google Sheets. Saving to localStorage.",
        error,
      );
      const data = seedLocalStorage();
      const idx = data.findIndex((c) => c.id === id);
      if (idx > -1) {
        data[idx] = { ...data[idx], ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    }
  },

  /**
   * Fetches all weekly schedules.
   */
  async fetchWeeklySchedules(): Promise<WeeklySchedule[]> {
    const url = getScriptUrl();
    if (!url) {
      console.log(
        "[sheetsService] No VITE_GOOGLE_SCRIPT_URL found. Using localStorage fallback for weekly schedules.",
      );
      const existing = localStorage.getItem("fablab_weekly_schedules_v1");
      return existing ? JSON.parse(existing) : [];
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=weeklyScheds`;
      const response = await fetch(fetchUrl);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data as WeeklySchedule[];
    } catch (error) {
      console.error(
        "[sheetsService] Failed to fetch weekly schedules from Google Sheets. Falling back to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_weekly_schedules_v1");
      return existing ? JSON.parse(existing) : [];
    }
  },

  /**
   * Saves a schedule for a single day.
   */
  async saveWeeklySchedule(
    residentId: string,
    day: string,
    timeString: string,
  ): Promise<void> {
    const url = getScriptUrl();
    const updates = { [day]: timeString };

    if (!url) {
      const existing = localStorage.getItem("fablab_weekly_schedules_v1");
      const scheds: WeeklySchedule[] = existing ? JSON.parse(existing) : [];
      const idx = scheds.findIndex((s) => s.resident_ID === residentId);
      if (idx > -1) {
        scheds[idx] = { ...scheds[idx], ...updates };
      } else {
        scheds.push({
          resident_ID: residentId,
          Monday: "",
          Tuesday: "",
          Wednesday: "",
          Thursday: "",
          Friday: "",
          Saturday: "",
          Sunday: "",
          ...updates,
        });
      }
      localStorage.setItem("fablab_weekly_schedules_v1", JSON.stringify(scheds));
      return;
    }
    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=weeklyScheds`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "weeklyScheds",
          action: "update",
          id: residentId,
          data: updates,
        }),
      });

      // Also update local storage cache
      const existing = localStorage.getItem("fablab_weekly_schedules_v1");
      const scheds: WeeklySchedule[] = existing ? JSON.parse(existing) : [];
      const idx = scheds.findIndex((s) => s.resident_ID === residentId);
      if (idx > -1) {
        scheds[idx] = { ...scheds[idx], ...updates };
      } else {
        scheds.push({
          resident_ID: residentId,
          Monday: "",
          Tuesday: "",
          Wednesday: "",
          Thursday: "",
          Friday: "",
          Saturday: "",
          Sunday: "",
          ...updates,
        });
      }
      localStorage.setItem("fablab_weekly_schedules_v1", JSON.stringify(scheds));
    } catch (error) {
      console.error(
        "[sheetsService] Failed to save weekly schedule to Google Sheets. Saving to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_weekly_schedules_v1");
      const scheds: WeeklySchedule[] = existing ? JSON.parse(existing) : [];
      const idx = scheds.findIndex((s) => s.resident_ID === residentId);
      if (idx > -1) {
        scheds[idx] = { ...scheds[idx], ...updates };
      } else {
        scheds.push({
          resident_ID: residentId,
          Monday: "",
          Tuesday: "",
          Wednesday: "",
          Thursday: "",
          Friday: "",
          Saturday: "",
          Sunday: "",
          ...updates,
        });
      }
      localStorage.setItem("fablab_weekly_schedules_v1", JSON.stringify(scheds));
    }
  },

  /**
   * Fetches all attendance logs.
   */
  async fetchAttendanceLogs(): Promise<AttendanceLog[]> {
    const url = getScriptUrl();
    if (!url) {
      console.log(
        "[sheetsService] No VITE_GOOGLE_SCRIPT_URL found. Using localStorage fallback for attendance logs.",
      );
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      return existing ? JSON.parse(existing) : [];
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=attendanceLogs`;
      const response = await fetch(fetchUrl);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.map((item: any) => ({
        ...item,
        total_hours: Number(item.total_hours) || 0,
      })) as AttendanceLog[];
    } catch (error) {
      console.error(
        "[sheetsService] Failed to fetch attendance logs from Google Sheets. Falling back to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      return existing ? JSON.parse(existing) : [];
    }
  },

  /**
   * Adds a new attendance log.
   */
  async addAttendanceLog(log: AttendanceLog): Promise<AttendanceLog> {
    const url = getScriptUrl();
    if (!url) {
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      logs.push(log);
      localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      return log;
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=attendanceLogs`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "attendanceLogs",
          action: "add",
          data: log,
        }),
      });

      // Update local storage too so offline sync / fallback is populated
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      logs.push(log);
      localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      return log;
    } catch (error) {
      console.error(
        "[sheetsService] Failed to add attendance log to Google Sheets. Saving to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      logs.push(log);
      localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      return log;
    }
  },

  /**
   * Updates an existing attendance log.
   */
  async updateAttendanceLog(id: string, updates: Partial<AttendanceLog>): Promise<void> {
    const url = getScriptUrl();
    if (!url) {
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      const idx = logs.findIndex((l) => l.id === id);
      if (idx > -1) {
        logs[idx] = { ...logs[idx], ...updates };
        localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      }
      return;
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=attendanceLogs`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "attendanceLogs",
          action: "update",
          id,
          data: updates,
        }),
      });

      // Also update local storage cache
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      const idx = logs.findIndex((l) => l.id === id);
      if (idx > -1) {
        logs[idx] = { ...logs[idx], ...updates };
        localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      }
    } catch (error) {
      console.error(
        "[sheetsService] Failed to update attendance log in Google Sheets. Saving to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      const idx = logs.findIndex((l) => l.id === id);
      if (idx > -1) {
        logs[idx] = { ...logs[idx], ...updates };
        localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      }
    }
  },

  /**
   * Fetches all machines from Google Sheets or localStorage fallback.
   */
  async fetchMachines(): Promise<Machine[]> {
    const url = getScriptUrl();
    if (!url) {
      console.log("[sheetsService] No VITE_GOOGLE_SCRIPT_URL found. Using localStorage fallback for machines.");
      const existing = localStorage.getItem("fablab_machines_v1");
      if (existing) {
        return JSON.parse(existing);
      }
      const seeded: Machine[] = [
        { id: "MAC-001", "Machine Model": "Ender 3 Pro #1", "Placement / Location Notes": "3D Printing Area - Table A" },
        { id: "MAC-002", "Machine Model": "Bambu Lab P1S", "Placement / Location Notes": "3D Printing Area - Shelf A" },
        { id: "MAC-003", "Machine Model": "Ender 3 Pro #2", "Placement / Location Notes": "3D Printing Area - Table A" },
        { id: "MAC-004", "Machine Model": "Bambu Lab A1", "Placement / Location Notes": "3D Printing Area - Table B" },
      ];
      localStorage.setItem("fablab_machines_v1", JSON.stringify(seeded));
      return seeded;
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=machines`;
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data as Machine[];
    } catch (error) {
      console.error("[sheetsService] Failed to fetch machines from Google Sheets. Falling back to localStorage.", error);
      const existing = localStorage.getItem("fablab_machines_v1");
      if (existing) {
        return JSON.parse(existing);
      }
      const seeded: Machine[] = [
        { id: "MAC-001", "Machine Model": "Ender 3 Pro #1", "Placement / Location Notes": "3D Printing Area - Table A" },
        { id: "MAC-002", "Machine Model": "Bambu Lab P1S", "Placement / Location Notes": "3D Printing Area - Shelf A" },
        { id: "MAC-003", "Machine Model": "Ender 3 Pro #2", "Placement / Location Notes": "3D Printing Area - Table A" },
        { id: "MAC-004", "Machine Model": "Bambu Lab A1", "Placement / Location Notes": "3D Printing Area - Table B" },
      ];
      localStorage.setItem("fablab_machines_v1", JSON.stringify(seeded));
      return seeded;
    }
  },

  /**
   * Fetches all machine reservations.
   */
  async fetchReservations(): Promise<MachineReservation[]> {
    const url = getScriptUrl();
    if (!url) {
      console.log("[sheetsService] No VITE_GOOGLE_SCRIPT_URL found. Using localStorage fallback for reservations.");
      const existing = localStorage.getItem("fablab_reservations_v1");
      return existing ? JSON.parse(existing) : [];
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=machine_reservations`;
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data as MachineReservation[];
    } catch (error) {
      console.error("[sheetsService] Failed to fetch reservations from Google Sheets. Falling back to localStorage.", error);
      const existing = localStorage.getItem("fablab_reservations_v1");
      return existing ? JSON.parse(existing) : [];
    }
  },

  /**
   * Adds a new machine reservation.
   */
  async addReservation(reservation: MachineReservation): Promise<MachineReservation> {
    const url = getScriptUrl();
    if (!url) {
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      list.push(reservation);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      return reservation;
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=machine_reservations`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "machine_reservations",
          action: "add",
          data: reservation,
        }),
      });

      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      list.push(reservation);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      return reservation;
    } catch (error) {
      console.error("[sheetsService] Failed to add reservation to Google Sheets. Saving to localStorage.", error);
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      list.push(reservation);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      return reservation;
    }
  },

  /**
   * Cancels/deletes a reservation.
   */
  async deleteReservation(reservationId: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) {
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const filtered = list.filter(r => r.reservation_id !== reservationId);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(filtered));
      return;
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=machine_reservations`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "machine_reservations",
          action: "delete",
          id: reservationId,
        }),
      });

      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const filtered = list.filter(r => r.reservation_id !== reservationId);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(filtered));
    } catch (error) {
      console.error("[sheetsService] Failed to delete reservation from Google Sheets. Saving to localStorage.", error);
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const filtered = list.filter(r => r.reservation_id !== reservationId);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(filtered));
    }
  },

  /**
   * Updates an existing reservation (e.g. for drag rescheduling).
   */
  async updateReservation(reservationId: string, updates: Partial<MachineReservation>): Promise<void> {
    const url = getScriptUrl();
    if (!url) {
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex(r => r.reservation_id === reservationId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      }
      return;
    }

    try {
      const secret = import.meta.env.VITE_WEBAPP_SECRET || "";
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=machine_reservations`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret,
          sheet: "machine_reservations",
          action: "update",
          id: reservationId,
          data: updates,
        }),
      });

      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex(r => r.reservation_id === reservationId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      }
    } catch (error) {
      console.error("[sheetsService] Failed to update reservation. Saving to localStorage.", error);
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex(r => r.reservation_id === reservationId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      }
    }
  },
};
