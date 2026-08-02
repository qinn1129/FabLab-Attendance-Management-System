const STORAGE_PREFIX = "fablab_rm_seen_ids_";

function storageKey(accountId: string): string {
  return `${STORAGE_PREFIX}${accountId}`;
}

/** Reads the set of IDs (commission IDs and/or task IDs) this account has already seen. */
export function getSeenIds(accountId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(accountId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/** Marks the given IDs as seen (merges with whatever was already recorded). */
export function markIdsSeen(accountId: string, ids: string[]): void {
  if (!accountId || ids.length === 0) return;
  const current = getSeenIds(accountId);
  ids.forEach(id => current.add(id));
  try {
    localStorage.setItem(storageKey(accountId), JSON.stringify(Array.from(current)));
  } catch {
    // Storage full/unavailable — the badge just won't clear until it works again, not worth surfacing an error for.
  }
}

/** True if any of the given "currently relevant" IDs haven't been marked seen yet. */
export function hasUnseenIds(accountId: string, currentIds: string[]): boolean {
  if (!accountId || currentIds.length === 0) return false;
  const seen = getSeenIds(accountId);
  return currentIds.some(id => !seen.has(id));
}