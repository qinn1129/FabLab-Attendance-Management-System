const getApiUrl = (): string | null => {
  const url = import.meta.env.VITE_API_URL;
  return url && url.trim() !== "" ? url.trim().replace(/\/$/, "") : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** True if VITE_API_URL is configured. Services use this to fall back gracefully (matching the old "no script URL configured" behavior) instead of throwing. */
export function isApiConfigured(): boolean {
  return getApiUrl() !== null;
}

/**
 * GET all rows for a sheet/collection.
 * Throws ApiError on failure — callers should catch and decide their own
 * fallback (most existing services log + return an empty array, matching
 * prior behavior).
 */
export async function fetchSheet<T>(sheet: string): Promise<T[]> {
  const base = getApiUrl();
  if (!base) throw new ApiError("VITE_API_URL is not set.");

  const url = `${base}/api/data?secret=${encodeURIComponent(getSecret())}&sheet=${encodeURIComponent(sheet)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status} fetching "${sheet}"`);
  }
  const data = await response.json();
  if (data && typeof data === "object" && !Array.isArray(data) && (data as any).error) {
    throw new ApiError((data as any).error);
  }
  return data as T[];
}

/** POST helper shared by add/update/delete/auth actions. */
async function postAction(sheet: string | null, payload: Record<string, unknown>): Promise<any> {
  const base = getApiUrl();
  if (!base) throw new ApiError("VITE_API_URL is not set.");

  const url = sheet
    ? `${base}/api/data?sheet=${encodeURIComponent(sheet)}`
    : `${base}/api/data`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: getSecret(), ...payload }),
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(`Server returned a non-JSON response (HTTP ${response.status}).`);
  }

  if (data && data.error) {
    throw new ApiError(data.error);
  }
  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`);
  }
  return data;
}

export async function addRow(sheet: string, data: Record<string, unknown>): Promise<void> {
  await postAction(sheet, { action: "add", data });
}

export async function updateRow(sheet: string, id: string, data: Record<string, unknown>): Promise<{ created?: boolean }> {
  return postAction(sheet, { action: "update", id, data });
}

export async function deleteRow(sheet: string, id: string): Promise<void> {
  await postAction(sheet, { action: "delete", id });
}

/** Dedicated auth actions (login / registerRM / changePassword) — these don't target a specific sheet, they always operate on accounts server-side. */
export async function authAction(action: "login" | "registerRM" | "changePassword", payload: Record<string, unknown>): Promise<any> {
  return postAction(null, { action, ...payload });
}