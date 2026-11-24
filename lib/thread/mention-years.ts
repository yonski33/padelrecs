// Mention links on sites whose catalogue keeps one row per model year (PadelRecs, owner 2026-11-24: "missing links for all
// those models"). There, "Metalbone Carbon" or "AT10 Genius 18K" is the name of two or three rows (2025, 2026, 2027), so
// lib/thread/mention-links.ts drops it as shared and nothing links. This step runs first, per page, and makes each name
// mean one racket by its context:
//   - Each model (its name without the year) keeps one row: the page's own season (the racket's year), else the newest
//     year before it, else the oldest after it. The page's own racket always stays, and its model keeps only it.
//   - `lines`: short names that span generations ("HRD+" = HRD+ 3.3, 3.4 and 3.5) pick the version by the same rule.
//     A line member whose own name IS the line's name and that the line didn't pick drops out on that page ("Adidas
//     Metalbone HRD+", the 2026 row, on a 2025 page, where "HRD+" means the 3.4), so the name means the pick alone.
//   - `fullOnly`: rows whose model name is everyday words ("Hybrid Carbon") link by their full name only, with the brand.
//   - `scoped`: names that only mean something inside one line's pages ("the 3.4" on an Adidas Metalbone page),
//     keyed by the page slug's start.
// The result feeds mentionIndex unchanged, which still drops any name two rackets share. Pure, so tests feed plain rows.
import type { MentionAliases, MentionRow } from "./mention-links";

export type YearRow = MentionRow & { slug: string; year: number | null };
export type MentionYears = MentionAliases & {
  /** Short names over several generations: name → the slugs it may mean (any order). */ lines?: Record<string, string[]>;
  /** Names that only resolve on some pages: page slug start → (name → slugs it may mean). */ scoped?: Record<string, Record<string, string[]>>;
  /** Slugs that link by their full name only. */ fullOnly?: string[];
};

const base = (name: string) => name.replace(/\s*\(?20\d\d\)?\s*$/, "").toLowerCase();
const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** A row's own names as words: the full name without the year, and without the brand. */
const ownNames = (r: YearRow) => { const f = words(base(r.name)), b = words(r.brand); return b && f.startsWith(`${b} `) ? [f, f.slice(b.length + 1)] : [f]; };

/** The row the season `at` means among several: the same year, else the newest before it, else the oldest after it. */
export function pickYear<R extends { year: number | null }>(rows: R[], at: number): R | null {
  const y = (r: R) => r.year ?? 0;
  return rows.find(r => y(r) === at) ?? [...rows].filter(r => y(r) < at).sort((a, b) => y(b) - y(a))[0]
    ?? [...rows].sort((a, b) => y(a) - y(b))[0] ?? null;
}

/** The page's rows and aliases, one racket per name, for the page racket `selfSlug` of season `at`. */
export function yearContext<R extends YearRow>(rows: R[], selfSlug: string, at: number, extra: MentionYears = {}): { rows: R[]; extra: MentionAliases } {
  const self = rows.find(r => r.slug === selfSlug);
  const fams = new Map<string, R[]>();
  for (const r of rows) { const k = base(r.name); fams.set(k, [...(fams.get(k) ?? []), r]); }
  const kept: R[] = [];
  for (const [k, rs] of fams) {
    const p = self && base(self.name) === k ? self : pickYear(rs, at);
    if (p) kept.push(p);
  }
  const bySlug = new Map(rows.map(r => [r.slug, r]));
  // Lines and the page's scoped names, each resolved to its version for this season.
  const named = [...Object.entries(extra.lines ?? {}), ...Object.entries(extra.scoped ?? {}).flatMap(([start, ns]) => selfSlug.startsWith(start) ? Object.entries(ns) : [])]
    .map(([name, slugs]) => ({ name, slugs, pick: pickYear(slugs.flatMap(s => bySlug.get(s) ?? []), at) }));
  // A line member named exactly as the line, not picked (and not the page's racket), leaves the page's index.
  const drop = new Set(named.flatMap(({ name, slugs, pick }) => slugs.filter(s => s !== pick?.slug && s !== selfSlug
    && (bySlug.get(s) ? ownNames(bySlug.get(s)!).includes(words(name)) : false))));
  const full = new Set(extra.fullOnly ?? []);
  const kept2 = kept.filter(r => !drop.has(r.slug)).map(r => full.has(r.slug) ? { ...r, brand: base(r.name) } : r);
  kept.splice(0, kept.length, ...kept2);
  const keptSlugs = new Set(kept.map(r => r.slug));
  const aliases = Object.fromEntries(Object.entries(extra.aliases ?? {}).filter(([s]) => keptSlugs.has(s)));
  const defaults: Record<string, string> = Object.fromEntries(Object.entries(extra.defaults ?? {}).filter(([, s]) => keptSlugs.has(s)));
  // A line or scoped name: its version for this season, among the rows that exist. The page's own racket counts: then the
  // name claims its text and never links.
  for (const { name, pick } of named) if (pick && keptSlugs.has(pick.slug)) defaults[name] = pick.slug;
  return { rows: kept, extra: { aliases, defaults } };
}
