import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** this is for tailwind stuff
 * @param inputs 
 * @returns {string}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseSheetBoolean(raw: unknown, defaultValue = true): boolean {
  if (raw === undefined || raw === null || raw === "") return defaultValue;
  if (typeof raw === "boolean") return raw;
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "false") return false;
  if (normalized === "true") return true;
  return defaultValue;
}