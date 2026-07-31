export function formatDateTime(input?: string | Date | null): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (isNaN(date.getTime())) return "—";

  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = String(minutes).padStart(2, "0");

  return `${month} ${day}, ${year}, ${hours}:${mm} ${ampm}`;
}

export function formatDateOnly(input?: string | Date | null): string {
  if (!input) return "—";

  // Treat bare "YYYY-MM-DD" strings as local dates so we don't lose a day
  // to UTC-shift when the browser parses them as midnight UTC.
  let date: Date;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    date = new Date(input + "T00:00:00");
  } else {
    date = typeof input === "string" ? new Date(input) : input;
  }
  if (isNaN(date.getTime())) return "—";

  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatShortDate(input?: string | Date | null): string {
  return formatDateOnly(input);
}


export function formatFlexibleDate(input?: string | null): string {
  if (!input || !input.trim()) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return formatDateOnly(input.trim());
  }
  return input.trim();
}

export function combineDateAndTime(day: Date, hours: number, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

/** @deprecated kept for backward compatibility — now returns the full canonical format. */
export function formatSmartTimestamp(iso?: string): string {
  return formatDateTime(iso);
}

/** @deprecated kept for backward compatibility — now returns the full canonical format. */
export function formatChatTimestamp(iso?: string): string {
  return formatDateTime(iso);
}