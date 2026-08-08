import { type Account } from "./accountsService";
import { type Commission } from "./sheetsService";
import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured } from "../lib/apiClient";

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

/**
 * This service backs ONLY standalone, non-commission work items (lab
 * upkeep, training, one-off errands — see Admin > Manual Tasks). Commission
 * assignment/workload is tracked in the "commission_reqs" collection itself
 * (via Commission.rm / Commission.status), not mirrored here — see
 * pickLeastBusyMakerIdFromCommissions below, which counts directly from
 * live commission data instead of a separate task log that could drift out
 * of sync.
 */
export const tasksService = {
  async fetchTasks(): Promise<RMTask[]> {
    if (!isApiConfigured()) {
      console.warn("[tasksService] VITE_API_URL is not set. Returning an empty list.");
      return [];
    }
    return cachedFetch(
      "tasks",
      async () => {
        try {
          const data = await fetchSheet<RMTask>("tasks");
          return data.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        } catch (error) {
          console.error("[tasksService] Failed to fetch tasks.", error);
          return [];
        }
      },
      // Kept short since the RM sidebar badge and Admin's "active
      // commissions" pill both rely on this staying reasonably fresh.
      3000,
    );
  },

  async addTask(task: { rm_id: string; task: string; deadline: string; source: RMTaskSource }): Promise<RMTask> {
    const newTask: RMTask = {
      id: `TASK-${Date.now()}`,
      ...task,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    if (!isApiConfigured()) {
      console.warn("[tasksService] VITE_API_URL is not set. Task was not saved.");
      return newTask;
    }
    try {
      await addRow("tasks", newTask as unknown as Record<string, unknown>);
      invalidateCache("tasks");
    } catch (error) {
      console.error("[tasksService] Failed to save task.", error);
    }
    return newTask;
  },

  async updateTask(id: string, updates: Partial<RMTask>): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await updateRow("tasks", id, updates as Record<string, unknown>);
      invalidateCache("tasks");
    } catch (error) {
      console.error("[tasksService] Failed to update task.", error);
    }
  },

  async deleteTask(id: string): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await deleteRow("tasks", id);
      invalidateCache("tasks");
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
 * Pure function — no network calls, unaffected by the Mongo migration.
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