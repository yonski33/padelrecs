// The catalogue's filters and sort (app/rackets/catalog-v2.tsx), as pure functions over one compact row per racket. The server
// renders the first view from these; the browser re-runs them on every tap (app/rackets/catalog-browser.tsx), with no round
// trip (owner 2026-11-15: "/rackets … still slow on every tap"). One implementation, so a tap and a direct visit to the same
// address always show the same list. A new engine plugs in by changing the rows (or the order), not the page.
import { WEIGHTS, FEELS } from "./fine-tune";
import { BALANCES, FACES } from "./guide";

export const CATALOG_STYLES = ["control", "balance", "power"] as const;
export const CATALOG_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const CATALOG_SHAPES = ["round", "teardrop", "hybrid", "diamond"] as const;
export const CATALOG_SORTS = [["score", "player score"], ["reviews", "most reviewed"], ["newest", "newest"]] as const;
/** The option groups a row is tested on (arm-friendly and a bigger sweet spot are checkboxes). */
export const CATALOG_KEYS = ["style", "level", "shape", "year", "weight", "feel", "balance", "face"] as const;
export type CatalogKey = (typeof CATALOG_KEYS)[number];
/** Every query the catalogue reads; all of them live in the address. */
export const CATALOG_PARAMS = ["style", "level", "shape", "year", "arm", "weight", "feel", "balance", "face", "sweet", "sort", "show", "more", "q", "older"] as const;
export type CatalogFilters = Partial<Record<(typeof CATALOG_PARAMS)[number], string>>;
export const CATALOG_PAGE = 20;

export type CatalogRow = {
  id: string;
  /** For the name tie-break. */ name: string;
  /** What players praise most (lib/fit-verdict.ts styleLean). */ lean: "control" | "power" | "balance" | null;
  /** 0–100 per level (lib/level-suits.ts); a level filter keeps rows at SUITS_OK or more. */ suits?: Record<(typeof CATALOG_LEVELS)[number], number>;
  shape: string | null; year: string;
  /** Arm-friendly mentions at the fit check's bar. */ arm: boolean;
  weight: string | null; feel: string | null;
  /** Low / medium / high balance and the face material (lib/guide.ts), from the specs. */ balance?: string | null; face?: string | null;
  /** Forgiveness 4+ dots. */ sweet: boolean;
  /** The Player score. */ signal: number | null;
  /** Every report; reviews with a verdict (the "most reviewed" sort). */ n: number; judged: number;
  /** The year that takes its model's one row (lib/compare-pairs.ts rowOfFamily). */ newest: boolean;
};

export function catalogTests(suitsOk: number): Record<CatalogKey, (x: CatalogRow, v: string) => boolean> {
  return {
    style: (x, v) => x.lean === v, level: (x, v) => (x.suits?.[v as (typeof CATALOG_LEVELS)[number]] ?? 0) >= suitsOk, shape: (x, v) => x.shape === v,
    year: (x, v) => x.year === v, weight: (x, v) => x.weight === v, feel: (x, v) => x.feel === v,
    balance: (x, v) => x.balance === v, face: (x, v) => x.face === v,
  };
}

export type CatalogView = {
  shown: CatalogRow[]; sort: string; show: number;
  /** How many rows each option would leave (the other picks held). */ counts: Record<string, Record<string, number>>;
  /** Older years the current picks hide. */ olderN: number;
  /** Rows on the default view (one per model). */ total: number;
  years: string[];
};

/** The list for the filters. One model, newest year (owner 2026-11-15, as quick match): a family's older years are hidden
 *  unless ?older=1, a search or a year pick asks for them. */
export function catalogView(rows: CatalogRow[], f: CatalogFilters, suitsOk: number): CatalogView {
  const tests = catalogTests(suitsOk);
  const allYears = f.older === "1" || !!f.q || !!f.year;
  const current = (x: CatalogRow) => allYears || x.newest;
  const others = (x: CatalogRow, skip?: string) => CATALOG_KEYS.every(k => k === skip || !f[k] || tests[k](x, f[k]!)) && (skip === "arm" || f.arm !== "1" || x.arm) && (skip === "sweet" || f.sweet !== "1" || x.sweet);
  const pass = (x: CatalogRow, skip?: string) => current(x) && others(x, skip);
  const sort = CATALOG_SORTS.some(([k]) => k === f.sort) ? f.sort! : "score";
  const order = (a: CatalogRow, b: CatalogRow) => sort === "reviews" ? b.judged - a.judged : sort === "newest" ? Number(b.year) - Number(a.year) || (b.signal ?? -1) - (a.signal ?? -1) : (b.signal ?? -1) - (a.signal ?? -1) || b.judged - a.judged;
  const shown = rows.filter(x => pass(x)).sort((a, b) => order(a, b) || a.name.localeCompare(b.name));
  const show = Math.min(1000, Math.max(CATALOG_PAGE, Number(f.show) || CATALOG_PAGE));
  const years = [...new Set(rows.map(x => x.year))].sort().reverse();
  const values: Record<CatalogKey, readonly string[]> = { style: CATALOG_STYLES, level: CATALOG_LEVELS, shape: CATALOG_SHAPES, year: years, weight: WEIGHTS, feel: FEELS, balance: BALANCES, face: FACES };
  const counts = Object.fromEntries(CATALOG_KEYS.map(k => [k, Object.fromEntries(values[k].map(v => [v, rows.filter(x => pass(x, k) && tests[k](x, v)).length]))]));
  return { shown, sort, show, counts, olderN: rows.filter(x => !x.newest && others(x)).length, total: rows.filter(x => x.newest).length, years };
}

/** The address for the filters: every other choice kept, the "show more" count dropped unless given. */
export function catalogHref(base: string, f: CatalogFilters, next: CatalogFilters = {}) {
  const q = new URLSearchParams(Object.entries({ ...f, show: undefined, ...next }).filter(([k, v]) => v && (CATALOG_PARAMS as readonly string[]).includes(k)) as [string, string][]);
  return q.size ? `${base}?${q}` : base;
}
/** The filters an address asks for (unknown keys dropped). */
export function readCatalogFilters(q: Record<string, string | undefined>): CatalogFilters {
  return Object.fromEntries(CATALOG_PARAMS.flatMap(k => q[k] ? [[k, q[k]]] : [])) as CatalogFilters;
}
