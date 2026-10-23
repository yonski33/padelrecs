// In-memory limits for the review form and the admin sign-in. Each server instance keeps its own counts; Vercel reuses
// instances (Fluid compute), so a flood from one client mostly lands on the same few and is cut off. That is enough to
// blunt scripted bursts without a new table or service. Supabase Auth applies its own sign-in limits on top (429s).
const MAX_KEYS = 10_000;
const trim = <V>(map: Map<string, V>) => { while (map.size > MAX_KEYS) map.delete(map.keys().next().value as string); };

/** Client IP as Vercel reports it (x-real-ip, else the first x-forwarded-for hop). */
export function clientIp(request: Request) {
 return request.headers.get("x-real-ip")?.trim() || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

/** At most `limit` hits per key within `windowMs`. */
export function createLimiter({limit, windowMs}: {limit: number; windowMs: number}) {
 const hits = new Map<string, number[]>();
 return {
  /** Records a hit; false once the key is over its limit. */
  hit(key: string, now = Date.now()) {
   const recent = (hits.get(key) || []).filter(t => t > now - windowMs);
   recent.push(now);
   hits.delete(key); hits.set(key, recent); trim(hits);
   return recent.length <= limit;
  },
 };
}

/**
 * Failed sign-ins per key with exponential backoff: `free` failures are allowed, then each further one locks the key for
 * baseMs, 2×baseMs, 4×baseMs … up to maxMs. A success clears the key; a key with no failures for forgetMs starts over.
 */
export function createLoginThrottle({free = 5, baseMs = 60_000, maxMs = 60 * 60_000, forgetMs = 24 * 60 * 60_000} = {}) {
 const state = new Map<string, {failures: number; until: number; last: number}>();
 const current = (key: string, now: number) => { const s = state.get(key); return s && now - s.last < forgetMs ? s : undefined; };
 return {
  /** Milliseconds until any of the keys may try again (0 = allowed now). */
  wait(keys: string[], now = Date.now()) {
   return Math.max(0, ...keys.map(k => (current(k, now)?.until ?? 0) - now));
  },
  fail(keys: string[], now = Date.now()) {
   for (const key of keys) {
    const failures = (current(key, now)?.failures ?? 0) + 1;
    const until = failures > free ? now + Math.min(maxMs, baseMs * 2 ** (failures - free - 1)) : 0;
    state.delete(key); state.set(key, {failures, until, last: now}); trim(state);
   }
  },
  succeed(keys: string[]) { keys.forEach(k => state.delete(k)); },
 };
}
