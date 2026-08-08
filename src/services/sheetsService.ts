import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured, ApiError } from "../lib/apiClient";

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

export interface AttendanceRequest {
  attendance_request_id: string;
  rm_id: string;
  type: string;
  date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
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

export const sheetsService = {
  /**
   * Fetches all commissions from the API, or localStorage fallback if
   * VITE_API_URL isn't configured. Cached briefly (3s) since this is the
   * single most-requested collection in the app — App.tsx, Approvals,
   * Tracker, Assignment, and both Maker/Admin dashboards all read from it.
   */
  async fetchCommissions(): Promise<Commission[]> {
    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Returning no commissions.");
      return [] as Commission[];
    }

    return cachedFetch(
      "commissions",
      async () => {
        try {
          const data = await fetchSheet<any>("commission_reqs");
          return data.map((item) => ({
            ...item,
            weight: Number(item.weight) || 0,
            rm: item.rm || null,
            printer: item.printer || null,
            deadline: item.deadline || null,
            problems: item.problems || null,
          })) as Commission[];
        } catch (error) {
          console.error(
            "[sheetsService] Failed to fetch commissions from the API. Returning no commissions.",
            error,
          );
          return [] as Commission[];
        }
      },
      3000,
    );
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
      submitted: new Date().toISOString(),
      rm: null,
      printer: null,
      status: "Awaiting Approval",
      deadline: null,
      problems: null,
    };

    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Saving to localStorage.");
      let data = [];
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (existing) data = JSON.parse(existing);
      data.push(newCommission);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return newCommission;
    }

    try {
      await addRow("commission_reqs", newCommission as unknown as Record<string, unknown>);
      invalidateCache("commissions");
      return newCommission;
    } catch (error) {
      console.error(
        "[sheetsService] Failed to add commission via the API. Saving to localStorage.",
        error,
      );
      let data = [];
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (existing) data = JSON.parse(existing);
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
    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Using localStorage.");
      let data = [];
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (existing) data = JSON.parse(existing);
      const idx = data.findIndex((c: Commission) => c.id === id);
      if (idx > -1) {
        data[idx] = { ...data[idx], ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      return;
    }
    try {
      await updateRow("commission_reqs", id, updates as Record<string, unknown>);
      invalidateCache("commissions");
    } catch (error) {
      console.error(
        "[sheetsService] Failed to update commission via the API. Saving to localStorage.",
        error,
      );
      let data = [];
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (existing) data = JSON.parse(existing);
      const idx = data.findIndex((c: Commission) => c.id === id);
      if (idx > -1) {
        data[idx] = { ...data[idx], ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      return;
    }
  },

  /**
   * Fetches all weekly schedules.
   */
  async fetchWeeklySchedules(): Promise<WeeklySchedule[]> {
    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Using localStorage fallback for weekly schedules.");
      const existing = localStorage.getItem("fablab_weekly_schedules_v1");
      return existing ? JSON.parse(existing) : [];
    }

    return cachedFetch(
      "weeklyScheds",
      async () => {
        try {
          return await fetchSheet<WeeklySchedule>("weeklyScheds");
        } catch (error) {
          console.error(
            "[sheetsService] Failed to fetch weekly schedules from the API. Falling back to localStorage.",
            error,
          );
          const existing = localStorage.getItem("fablab_weekly_schedules_v1");
          return existing ? JSON.parse(existing) : [];
        }
      },
      5000,
    );
  },

  /**
   * Saves a schedule for a single day.
   */
  async saveWeeklySchedule(
    residentId: string,
    day: string,
    timeString: string,
  ): Promise<void> {
    const updates = { [day]: timeString };

    if (!isApiConfigured()) {
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
      await updateRow("weeklyScheds", residentId, updates);
      invalidateCache("weeklyScheds");

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
        "[sheetsService] Failed to save weekly schedule via the API. Saving to localStorage.",
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
    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Using localStorage fallback for attendance logs.");
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      return existing ? JSON.parse(existing) : [];
    }

    return cachedFetch(
      "attendanceLogs",
      async () => {
        try {
          const data = await fetchSheet<any>("attendanceLogs");
          return data.map((item) => ({
            ...item,
            total_hours: Number(item.total_hours) || 0,
          })) as AttendanceLog[];
        } catch (error) {
          console.error(
            "[sheetsService] Failed to fetch attendance logs from the API. Falling back to localStorage.",
            error,
          );
          const existing = localStorage.getItem("fablab_attendance_logs_v1");
          return existing ? JSON.parse(existing) : [];
        }
      },
      // Kept short since Attendance.tsx relies on this to detect the
      // currently-active clock-in session.
      2000,
    );
  },

  /**
   * Adds a new attendance log.
   */
  async addAttendanceLog(log: AttendanceLog): Promise<AttendanceLog> {
    if (!isApiConfigured()) {
      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      logs.push(log);
      localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      return log;
    }

    try {
      await addRow("attendanceLogs", log as unknown as Record<string, unknown>);
      invalidateCache("attendanceLogs");

      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      logs.push(log);
      localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      return log;
    } catch (error) {
      console.error(
        "[sheetsService] Failed to add attendance log via the API. Saving to localStorage.",
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
  async updateAttendanceLog(
    id: string,
    updates: Partial<AttendanceLog>,
  ): Promise<void> {
    if (!isApiConfigured()) {
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
      await updateRow("attendanceLogs", id, updates as Record<string, unknown>);
      invalidateCache("attendanceLogs");

      const existing = localStorage.getItem("fablab_attendance_logs_v1");
      const logs: AttendanceLog[] = existing ? JSON.parse(existing) : [];
      const idx = logs.findIndex((l) => l.id === id);
      if (idx > -1) {
        logs[idx] = { ...logs[idx], ...updates };
        localStorage.setItem("fablab_attendance_logs_v1", JSON.stringify(logs));
      }
    } catch (error) {
      console.error(
        "[sheetsService] Failed to update attendance log via the API. Saving to localStorage.",
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
   * Fetches all machines. Given machines are effectively static config
   * data (no add/update/delete flow exists for them anywhere in the app),
   * this uses a longer cache TTL.
   */
  async fetchMachines(): Promise<Machine[]> {
    const seeded: Machine[] = [
      { id: "MAC-001", "Machine Model": "Ender 3 Pro #1", "Placement / Location Notes": "3D Printing Area - Table A" },
      { id: "MAC-002", "Machine Model": "Bambu Lab P1S", "Placement / Location Notes": "3D Printing Area - Shelf A" },
      { id: "MAC-003", "Machine Model": "Ender 3 Pro #2", "Placement / Location Notes": "3D Printing Area - Table A" },
      { id: "MAC-004", "Machine Model": "Bambu Lab A1", "Placement / Location Notes": "3D Printing Area - Table B" },
    ];

    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Using localStorage fallback for machines.");
      const existing = localStorage.getItem("fablab_machines_v1");
      if (existing) return JSON.parse(existing);
      localStorage.setItem("fablab_machines_v1", JSON.stringify(seeded));
      return seeded;
    }

    return cachedFetch(
      "machines",
      async () => {
        try {
          const data = await fetchSheet<Machine>("machines");
          if (data.length === 0) {
            // Mirrors the old behavior of seeding default machines when the sheet is empty.
            return seeded;
          }
          return data;
        } catch (error) {
          console.error(
            "[sheetsService] Failed to fetch machines from the API. Falling back to localStorage.",
            error,
          );
          const existing = localStorage.getItem("fablab_machines_v1");
          if (existing) return JSON.parse(existing);
          localStorage.setItem("fablab_machines_v1", JSON.stringify(seeded));
          return seeded;
        }
      },
      15000,
    );
  },

  /**
   * Fetches all machine reservations.
   */
  async fetchReservations(): Promise<MachineReservation[]> {
    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Using localStorage fallback for reservations.");
      const existing = localStorage.getItem("fablab_reservations_v1");
      return existing ? JSON.parse(existing) : [];
    }

    return cachedFetch(
      "reservations",
      async () => {
        try {
          return await fetchSheet<MachineReservation>("machine_reservations");
        } catch (error) {
          console.error(
            "[sheetsService] Failed to fetch reservations from the API. Falling back to localStorage.",
            error,
          );
          const existing = localStorage.getItem("fablab_reservations_v1");
          return existing ? JSON.parse(existing) : [];
        }
      },
      // Short TTL — the Reservations calendar is drag/drop interactive and
      // multiple Resident Makers may be booking the same machine.
      2000,
    );
  },

  /**
   * Adds a new machine reservation.
   */
  async addReservation(
    reservation: MachineReservation,
  ): Promise<MachineReservation> {
    if (!isApiConfigured()) {
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      list.push(reservation);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      return reservation;
    }

    try {
      await addRow("machine_reservations", reservation as unknown as Record<string, unknown>);
      invalidateCache("reservations");

      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      list.push(reservation);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      return reservation;
    } catch (error) {
      console.error(
        "[sheetsService] Failed to add reservation via the API. Saving to localStorage.",
        error,
      );
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
    if (!isApiConfigured()) {
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const filtered = list.filter((r) => r.reservation_id !== reservationId);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(filtered));
      return;
    }

    try {
      await deleteRow("machine_reservations", reservationId);
      invalidateCache("reservations");

      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const filtered = list.filter((r) => r.reservation_id !== reservationId);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(filtered));
    } catch (error) {
      console.error(
        "[sheetsService] Failed to delete reservation via the API. Saving to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const filtered = list.filter((r) => r.reservation_id !== reservationId);
      localStorage.setItem("fablab_reservations_v1", JSON.stringify(filtered));
    }
  },

  /**
   * Updates an existing reservation (e.g. for drag rescheduling).
   */
  async updateReservation(
    reservationId: string,
    updates: Partial<MachineReservation>,
  ): Promise<void> {
    if (!isApiConfigured()) {
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((r) => r.reservation_id === reservationId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      }
      return;
    }

    try {
      await updateRow("machine_reservations", reservationId, updates as Record<string, unknown>);
      invalidateCache("reservations");

      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((r) => r.reservation_id === reservationId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      }
    } catch (error) {
      console.error(
        "[sheetsService] Failed to update reservation via the API. Saving to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_reservations_v1");
      const list: MachineReservation[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((r) => r.reservation_id === reservationId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_reservations_v1", JSON.stringify(list));
      }
    }
  },

  /**
   * Fetches all attendance requests.
   */
  async fetchAttendanceRequests(): Promise<AttendanceRequest[]> {
    if (!isApiConfigured()) {
      console.log("[sheetsService] No VITE_API_URL found. Using localStorage fallback for attendance requests.");
      const existing = localStorage.getItem("fablab_attendance_requests_v1");
      return existing ? JSON.parse(existing) : [];
    }

    return cachedFetch(
      "attendanceRequests",
      async () => {
        try {
          return await fetchSheet<AttendanceRequest>("attendance_requests");
        } catch (error) {
          console.error(
            "[sheetsService] Failed to fetch attendance requests from the API. Falling back to localStorage.",
            error,
          );
          const existing = localStorage.getItem("fablab_attendance_requests_v1");
          return existing ? JSON.parse(existing) : [];
        }
      },
      5000,
    );
  },

  /**
   * Adds a new attendance request.
   */
  async addAttendanceRequest(
    request: AttendanceRequest,
  ): Promise<AttendanceRequest> {
    if (!isApiConfigured()) {
      const existing = localStorage.getItem("fablab_attendance_requests_v1");
      const list: AttendanceRequest[] = existing ? JSON.parse(existing) : [];
      list.push(request);
      localStorage.setItem("fablab_attendance_requests_v1", JSON.stringify(list));
      return request;
    }

    try {
      await addRow("attendance_requests", request as unknown as Record<string, unknown>);
      invalidateCache("attendanceRequests");

      const existing = localStorage.getItem("fablab_attendance_requests_v1");
      const list: AttendanceRequest[] = existing ? JSON.parse(existing) : [];
      list.push(request);
      localStorage.setItem("fablab_attendance_requests_v1", JSON.stringify(list));
      return request;
    } catch (error) {
      console.error(
        "[sheetsService] Failed to add attendance request via the API. Saving to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_attendance_requests_v1");
      const list: AttendanceRequest[] = existing ? JSON.parse(existing) : [];
      list.push(request);
      localStorage.setItem("fablab_attendance_requests_v1", JSON.stringify(list));
      return request;
    }
  },

  /**
   * Updates an existing attendance request.
   */
  async updateAttendanceRequest(
    requestId: string,
    updates: Partial<AttendanceRequest>,
  ): Promise<void> {
    if (!isApiConfigured()) {
      const existing = localStorage.getItem("fablab_attendance_requests_v1");
      const list: AttendanceRequest[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((r) => r.attendance_request_id === requestId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_attendance_requests_v1", JSON.stringify(list));
      }
      return;
    }

    try {
      await updateRow("attendance_requests", requestId, updates as Record<string, unknown>);
      invalidateCache("attendanceRequests");

      const existing = localStorage.getItem("fablab_attendance_requests_v1");
      const list: AttendanceRequest[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((r) => r.attendance_request_id === requestId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_attendance_requests_v1", JSON.stringify(list));
      }
    } catch (error) {
      console.error(
        "[sheetsService] Failed to update attendance request via the API. Saving to localStorage.",
        error,
      );
      const existing = localStorage.getItem("fablab_attendance_requests_v1");
      const list: AttendanceRequest[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((r) => r.attendance_request_id === requestId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("fablab_attendance_requests_v1", JSON.stringify(list));
      }
    }
  },
};