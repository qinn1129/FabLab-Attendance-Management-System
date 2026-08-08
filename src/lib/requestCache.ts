type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();
const pending = new Map<string, Promise<any>>();

const DEFAULT_TTL_MS = 4000;

export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  const inFlight = pending.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const promise = fetchFn()
    .then(data => {
      cache.set(key, { data, timestamp: Date.now() });
      pending.delete(key);
      return data;
    })
    .catch(err => {
      pending.delete(key);
      throw err;
    });

  pending.set(key, promise);
  return promise;
}

/** Call after any write (add/update/delete) so the next read doesn't serve stale cached data for that key. */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/** Clears every cached entry. Rarely needed — mostly useful on logout. */
export function clearAllCache(): void {
  cache.clear();
  pending.clear();
}