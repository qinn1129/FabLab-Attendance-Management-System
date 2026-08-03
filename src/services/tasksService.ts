import { type Account } from "./accountsService";
import { type Commission } from "./sheetsService";

export type RMTaskStatus = "Pending" | "In Progress" | "Completed";
export type RMTaskSource = "Manual" | "Auto";

export interface RMTask {
  id: string;
  rm_id: string;
  task: string;
  deadline: string;
  status: RMTaskStatus;
  source: RMTaskSource;
  createdAt: string;
}

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

/**
 * This service now backs ONLY standalone, non-commission work items (lab
 * upkeep, training, one-off errands — see Admin > Manual Tasks). Commission
 * assignment/workload is tracked in the "commission_reqs" sheet itself
 * (via Commission.rm / Commission.status), not mirrored here — a prior
 * version of this app logged a task-sheet row every time a commission was
 * approved/assigned, purely to power the "least busy RM" auto-assign pick,
 * but nothing ever updated or cleared those rows when a commission was
 * later reassigned or completed in the Tracker, so the workload count
 * could drift arbitrarily far from reality over time. See
 * pickLeastBusyMakerIdFromCommissions below for the fix — it counts
 * directly from live commission data instead.
 */
export const tasksService = {
  async fetchTasks(): Promise<RMTask[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[tasksService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty list.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=tasks`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return (data as RMTask[]).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } catch (error) {
      console.error("[tasksService] Failed to fetch tasks.", error);
      return [];
    }
  },

  async addTask(task: { rm_id: string; task: string; deadline: string; source: RMTaskSource }): Promise<RMTask> {
    const newTask: RMTask = {
      id: `TASK-${Date.now()}`,
      ...task,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    const url = getScriptUrl();
    if (!url) {
      console.warn("[tasksService] VITE_GOOGLE_SCRIPT_URL is not set. Task was not saved.");
      return newTask;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=tasks`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "tasks", action: "add", data: newTask }),
      });
    } catch (error) {
      console.error("[tasksService] Failed to save task.", error);
    }
    return newTask;
  },

  async updateTask(id: string, updates: Partial<RMTask>): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=tasks`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "tasks", action: "update", id, data: updates }),
      });
    } catch (error) {
      console.error("[tasksService] Failed to update task.", error);
    }
  },

  async deleteTask(id: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=tasks`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "tasks", action: "delete", id }),
      });
    } catch (error) {
      console.error("[tasksService] Failed to delete task.", error);
    }
  },
};

/**
 * Counts each active Resident Maker's current commission workload directly
 * from live commission data (status "Pending" or "In Progress", matched by
 * assigned name), then returns whichever RM has the fewest. Ties are broken
 * by whoever appears first in `activeMakers` (stable, no randomness).
 *
 * Replaces the old tasks-sheet-based counter, which could drift from
 * reality once a commission was reassigned or completed in the Tracker
 * (nothing updated the corresponding task-log row when that happened).
 * This always reflects the Tracker's current state, since it reads the
 * same `commissions` data the Tracker itself displays.
 */
import { isCommissionAssignedToMaker } from "../lib/commissionUtils";

export function pickLeastBusyMakerIdFromCommissions(
  activeMakers: Account[],
  commissions: Commission[]
): string | null {
  if (activeMakers.length === 0) return null;

  const load: Record<string, number> = {};
  activeMakers.forEach(m => { load[m.id] = 0; });

  commissions.forEach(c => {
    if (!c.rm) return;
    if (c.status !== "Pending" && c.status !== "In Progress") return;
    const assignedMaker = activeMakers.find(m => isCommissionAssignedToMaker(c, m));
    if (assignedMaker) {
      load[assignedMaker.id] += 1;
    }
  });

  return activeMakers.reduce((best, m) => (load[m.id] < load[best] ? m.id : best), activeMakers[0].id);
}