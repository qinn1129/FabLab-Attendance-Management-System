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
 * Picks the Active RM with the fewest non-Completed tasks. Ties are broken
 * by whoever appears first in `activeMakers` (stable, no randomness) so the
 * result is deterministic and easy to reason about from the Assignment Log.
 */
export function pickLeastBusyMakerId(
  activeMakerIds: string[],
  tasks: RMTask[]
): string | null {
  if (activeMakerIds.length === 0) return null;
  const load: Record<string, number> = {};
  activeMakerIds.forEach(id => (load[id] = 0));
  tasks.forEach(t => {
    if (t.status !== "Completed" && load[t.rm_id] !== undefined) {
      load[t.rm_id] += 1;
    }
  });
  return activeMakerIds.reduce((best, id) => (load[id] < load[best] ? id : best), activeMakerIds[0]);
}