// Kept in this server instance's memory between requests (owner, 2026-11-12: cache misses took 5–25 s because every page
// reloaded every review; 2026-11-16: the v2 sites' first visits took 8–49 s because the evidence rows and the match
// context were rebuilt on every page). A copy younger than FRESH_MS is used as is; an older one is still served at once
// while a fresh load runs in the background, up to STALE_MS. Pages are cached at the edge anyway, so new reviews show
// within a couple of minutes, as before.
export const FRESH_MS = 2 * 60_000, STALE_MS = 30 * 60_000;

const all = new Set<() => void>();

/** A loader whose result this instance keeps (see above). A failed load is not kept; a failed refresh keeps the old copy. */
export function kept<T>(load: () => Promise<T>, now: () => number = Date.now): { get: () => Promise<T>; forget: () => void } {
  let memo: { at: number; value: Promise<T>; refreshing?: boolean } | null = null;
  const forget = () => { memo = null; };
  all.add(forget);
  const get = (): Promise<T> => {
    const t = now();
    if (memo && (t - memo.at < FRESH_MS || (memo.refreshing && t - memo.at < STALE_MS))) return memo.value;
    if (memo && t - memo.at < STALE_MS) {
      const current = memo; current.refreshing = true;
      load().then(fresh => { if (memo === current) memo = { at: now(), value: Promise.resolve(fresh) }; }, () => { current.refreshing = false; });
      return current.value;
    }
    const value = load();
    const entry = { at: t, value };
    memo = entry;
    value.catch(() => { if (memo === entry) memo = null; });
    return value;
  };
  return { get, forget };
}

/** Drops every kept copy, so the next page reads fresh (after an admin publish or edit: app/funtimes/auth.ts). */
export function forgetKept() { for (const f of all) f(); }
