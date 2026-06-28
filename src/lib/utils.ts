import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** this is for tailwind stuff
 * @param inputs 
 * @returns {string}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
