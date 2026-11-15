// One cached page per address (speed batch, owner 2026-11-15): Next renders a page per request once it reads the query, so
// proxy.ts rewrites a public address with a simple query to a path that holds the query as one segment (app/v/…), which is
// then an ISR page the CDN serves. A query with anything else (free text, an unknown key) is left alone and renders per
// request as before. Pure, so tests feed plain objects.

/** Query values the key can hold: short plain words and numbers. */
const TOKEN = /^[a-z0-9-]{1,40}$/;

/** The key for a query, or null when the query can't be one (an unknown key or a value that isn't a plain token). Keys are
 *  sorted and empty values dropped, so one view has one key; no query is "-". */
export function viewKey(q: URLSearchParams | Record<string, string | undefined>, allowed: readonly string[]): string | null {
  const entries = (q instanceof URLSearchParams ? [...q.entries()] : Object.entries(q)).filter(([, v]) => v !== undefined && v !== "") as [string, string][];
  if (entries.some(([k, v]) => !allowed.includes(k) || !TOKEN.test(v))) return null;
  if (new Set(entries.map(([k]) => k)).size !== entries.length) return null;
  return entries.length ? entries.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}.${v}`).join("~") : "-";
}

/** The query a key stands for, or null when it isn't the canonical key of an allowed query. */
export function readViewKey(key: string, allowed: readonly string[]): Record<string, string> | null {
  const k = decodeURIComponent(key);
  if (k === "-") return {};
  const q: Record<string, string> = {};
  for (const part of k.split("~")) { const i = part.indexOf("."); if (i < 1) return null; q[part.slice(0, i)] = part.slice(i + 1); }
  return viewKey(q, allowed) === k ? q : null;
}

/** The query string for a key's query ("" when none). */
export const viewQuery = (q: Record<string, string>) => { const s = new URLSearchParams(q).toString(); return s ? `?${s}` : ""; };

/** The queries each cached view holds (anything else renders per request). The catalogue's free-text ?q= never does. */
export const CATALOG_VIEW = ["style", "level", "shape", "year", "arm", "weight", "feel", "sweet", "sort", "show", "more", "older"] as const;
export const RANKING_VIEW = ["style", "level", "arm", "pct"] as const;
export const RACKET_VIEW = ["style", "level", "arm", "shape", "weight", "feel", "sweet"] as const;
