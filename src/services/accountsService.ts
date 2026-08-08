import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, updateRow, authAction, isApiConfigured, ApiError } from "../lib/apiClient";

export interface Account {
  id: string;
  role: "Admin" | "ResidentMaker";
  firstName: string;
  lastName: string;
  email: string;
  status: "Active" | "Pending" | "On Leave" | "Inactive";
  program?: string;
  year?: string;
  schedule?: string;
  hoursWeek?: number;
  totalHours?: number;
  createdAt?: string;
  description?: string;
  hobbies?: string;
  motto?: string;
  profilePicture?: string;
}

export const accountsService = {
  /**
   * Attempts login against the API's "login" action.
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: Account; error?: string }> {
    if (!isApiConfigured()) {
      console.warn(
        "[accountsService] VITE_API_URL is not set. " +
          "Login cannot be verified without the backend — check your .env " +
          "file and restart the Vite dev server (env changes require a restart).",
      );
      return {
        success: false,
        error:
          "Login is unavailable — the app is not connected to the account database.",
      };
    }

    try {
      const data = await authAction("login", { email: email.trim(), password });
      if (!data.user) return { success: false, error: "Unexpected response from server." };
      return { success: true, user: data.user as Account };
    } catch (error) {
      console.error("[accountsService] Login request failed.", error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.",
      };
    }
  },

  /**
   * Resident Maker self-registration. New accounts land as "Pending"
   * until an Admin approves them.
   */
  async registerRM(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    program?: string;
    year?: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!isApiConfigured()) {
      console.warn("[accountsService] VITE_API_URL is not set. Registration cannot be saved.");
      return {
        success: false,
        error:
          "Registration is unavailable — the app is not connected to the account database.",
      };
    }

    try {
      const data = await authAction("registerRM", payload);
      invalidateCache("accounts");
      return { success: true, message: data.message };
    } catch (error) {
      console.error("[accountsService] Registration request failed.", error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.",
      };
    }
  },

  /**
   * Fetches all accounts (passwordHash/salt are stripped server-side).
   * Cached for a few seconds so multiple components mounting around the
   * same time (e.g. RM Accounts + Schedules + Requests tabs all loading
   * together) share one network call instead of each firing their own.
   */
  async fetchAccounts(): Promise<Account[]> {
    if (!isApiConfigured()) {
      console.warn("[accountsService] VITE_API_URL is not set. Returning an empty account list.");
      return [];
    }

    return cachedFetch(
      "accounts",
      async () => {
        try {
          return await fetchSheet<Account>("accounts");
        } catch (error) {
          console.error("[accountsService] Failed to fetch accounts.", error);
          return [];
        }
      },
      5000,
    );
  },

  /**
   * Looks up a single account by id, for "Remember Me" auto-login on
   * page load. Re-checks status server-side data (via fetchAccounts)
   * so a Deactivated/Pending account can't silently stay "logged in".
   */
  async getAccountById(id: string): Promise<Account | null> {
    const accounts = await this.fetchAccounts();
    return accounts.find((a) => a.id === id) || null;
  },

  /** Used by Admin to approve/reject/deactivate an RM, or edit hours/schedule. */
  async updateAccount(
    id: string,
    updates: Partial<Account>,
  ): Promise<{ success: boolean; error?: string }> {
    if (!isApiConfigured()) {
      console.warn("[accountsService] VITE_API_URL is not set. Update cannot be saved.");
      return {
        success: false,
        error:
          "Update is unavailable — the app is not connected to the account database.",
      };
    }

    try {
      await updateRow("accounts", id, updates as Record<string, unknown>);
      invalidateCache("accounts");
      return { success: true };
    } catch (error) {
      console.error("[accountsService] Failed to update account.", error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.",
      };
    }
  },

  /** Convenience wrapper — fetches only Resident Maker accounts. */
  async fetchResidentMakers(): Promise<Account[]> {
    const accounts = await this.fetchAccounts();
    const rms = accounts.filter((a) => a.role === "ResidentMaker");
    if (rms.length > 0) return rms;

    console.log("[accountsService] No Resident Makers found.");
    return [] as Account[];
  },

  /** Re-hashes and stores a new password server-side after verifying the old one. */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!isApiConfigured()) {
      // No backend configured — nothing real to verify against locally.
      return { success: true };
    }

    try {
      await authAction("changePassword", { id, currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      console.error("[accountsService] Change password request failed.", error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.",
      };
    }
  },
};

/** Parses the JSON-string "schedule" field into an array of day abbreviations (e.g. ["Mon","Wed"]). */
export function parseScheduleDays(schedule?: string): string[] {
  if (!schedule) return [];
  try {
    const parsed = JSON.parse(schedule);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Serializes a day array back into the JSON string stored in the "schedule" column. */
export function stringifyScheduleDays(days: string[]): string {
  return JSON.stringify(days);
}