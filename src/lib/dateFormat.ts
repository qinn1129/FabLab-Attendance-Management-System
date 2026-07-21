/**
 * Formats an ISO timestamp into a readable "Today · 3:45 PM" /
 * "Yesterday · 3:45 PM" / "Jul 21, 2026 · 3:45 PM" string.
 */
export function formatSmartTimestamp(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;

  const day = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  return `${day} · ${time}`;
}

/** Shorter variant for tight chat bubbles: time-only if today, else "Jul 21 · 3:45 PM". */
export function formatChatTimestamp(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${day} · ${time}`;
}