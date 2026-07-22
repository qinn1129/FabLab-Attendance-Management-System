import { RESIDENT_MAKERS } from "../constants/mockData";

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

// const LOCAL_STORAGE_KEY = "fablab_accounts_v1";

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

// Local fallback so the app still runs without a deployed backend.
  // const seedLocalAccounts = (): Account[] => {
  //   const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  //   if (existing) {
  //     try {
  //       return JSON.parse(existing);
  //     } catch (e) {
  //       console.error("Error parsing local accounts", e);
  //     }
  //   }
  //   const seeded: Account[] = [
  //     { id: "ACC-local-admin", role: "Admin", firstName: "Domie James", lastName: "Jucutan", email: "admin@animolabs.ph", status: "Active" },
  //   ];
  //   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
  //   return seeded;
  // };

export const accountsService = {
  /**
   * Attempts login against the Apps Script "login" action.
   * Falls back to a no-op local check ONLY when no script URL is
   * configured, so local dev still works.
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: Account; error?: string }> {
    const url = getScriptUrl();

     if (!url) {
      console.warn(
        "[accountsService] VITE_GOOGLE_SCRIPT_URL is not set. " +
        "Login cannot be verified without the backend — check your .env " +
        "file and restart the Vite dev server (env changes require a restart)."
      );
      return { success: false, error: "Login is unavailable — the app is not connected to the account database." };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // avoids CORS preflight, per existing pattern
        body: JSON.stringify({
          secret: getSecret(),
          action: "login",
          email: email.trim(),
          password
        })
      });
      const data = await response.json();
      if (data.error) return { success: false, error: data.error };
      if (!data.user) return { success: false, error: "Unexpected response from server." };
      return { success: true, user: data.user as Account };
    } catch (error) {
      console.error("[accountsService] Login request failed.", error);
      return { success: false, error: "Unable to reach the server. Please try again." };
    }
  },

  /**
   * Resident Maker self-registration. New accounts land as "Pending"
   * until an Admin approves them.
   */
  async registerRM(payload: {
    firstName: string; lastName: string; email: string; password: string;
    program?: string; year?: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    const url = getScriptUrl();

     if (!url) {
      console.warn("[accountsService] VITE_GOOGLE_SCRIPT_URL is not set. Registration cannot be saved.");
      return { success: false, error: "Registration is unavailable — the app is not connected to the account database." };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ secret: getSecret(), action: "registerRM", ...payload })
      });
      const data = await response.json();
      if (data.error) return { success: false, error: data.error };
      return { success: true, message: data.message };
    } catch (error) {
      console.error("[accountsService] Registration request failed.", error);
      return { success: false, error: "Unable to reach the server. Please try again." };
    }
  },

  /** Fetches all accounts (passwordHash/salt are stripped server-side). */
  async fetchAccounts(): Promise<Account[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[accountsService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty account list.");
      return [];
    }

    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=accounts`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data as Account[];
    } catch (error) {
      console.error("[accountsService] Failed to fetch accounts.", error);
      return [];
    }
  },

  /**
   * Looks up a single account by id, for "Remember Me" auto-login on
   * page load. Re-checks status server-side data (via fetchAccounts)
   * so a Deactivated/Pending account can't silently stay "logged in".
   */
  async getAccountById(id: string): Promise<Account | null> {
    const accounts = await this.fetchAccounts();
    return accounts.find(a => a.id === id) || null;
  },

  /** Used by Admin to approve/reject/deactivate an RM, or edit hours/schedule. */
  async updateAccount(id: string, updates: Partial<Account>): Promise<{ success: boolean; error?: string }> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[accountsService] VITE_GOOGLE_SCRIPT_URL is not set. Update cannot be saved.");
      return { success: false, error: "Update is unavailable — the app is not connected to the account database." };
    }

    try {
      const response = await fetch(`${url}?sheet=accounts`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ secret: getSecret(), action: "update", id, data: updates })
      });
      const data = await response.json();
      if (data.error) return { success: false, error: data.error };
      return { success: true };
    } catch (error) {
      console.error("[accountsService] Failed to update account.", error);
      return { success: false, error: "Unable to reach the server. Please try again." };
    }
  },

  /** Convenience wrapper — fetches only Resident Maker accounts. */
  async fetchResidentMakers(): Promise<Account[]> {
    const accounts = await this.fetchAccounts();
    const rms = accounts.filter(a => a.role === "ResidentMaker");
    if (rms.length > 0) return rms;

    // Fallback to mock resident makers for local dev / offline mode
    return RESIDENT_MAKERS.map(rm => {
      const nameParts = rm.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      return {
        id: `RM-${rm.id}`,
        role: "ResidentMaker",
        firstName,
        lastName,
        email: rm.email,
        status: (rm.status as Account["status"]) || "Active",
        program: rm.program,
        year: String(rm.year),
        hoursWeek: rm.hoursWeek,
        totalHours: rm.totalHours,
        schedule: JSON.stringify(rm.schedule)
      };
    });
  },

    /** Re-hashes and stores a new password server-side after verifying the old one. */
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const url = getScriptUrl();
    if (!url) {
      // No backend configured — nothing real to verify against locally.
      return { success: true };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ secret: getSecret(), action: "changePassword", id, currentPassword, newPassword })
      });
      const data = await response.json();
      if (data.error) return { success: false, error: data.error };
      return { success: true };
    } catch (error) {
      console.error("[accountsService] Change password request failed.", error);
      return { success: false, error: "Unable to reach the server. Please try again." };
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

