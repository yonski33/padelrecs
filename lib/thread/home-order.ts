// PadelRecs home "Top rackets right now" (owner 2026-11-21): this season's models only and player opinions count.
//   - Pool: the season's year only (the same rule as Best overall, lib/thread/vote-order.ts "loved"), 10+ opinions, one row per
//     model (the one with the most opinions). Older years and 2027 previews with a handful of reviews stay in the catalogue.
//   - No picks: most loved first.
//   - By your match: 10-point match bands (90+, 80-89, ...), most loved first inside a band, then the higher match. A racket
//     never jumps a band, so a 73% never sits above an 82%; inside a band players' opinions decide.
// Pure, so tests feed plain rows. The catalogue (/rackets) keeps its full list and plain match order.

export const HOME_ORDER = { minOpinions: 10, band: 10 };

export type SeasonRow = { id: string; family: string; year: number; opinions: number };
/** The home's pool: the season's year, the opinion floor, one row per model. */
export function seasonIds(rows: SeasonRow[], year: number, cfg = HOME_ORDER): string[] {
  const best = new Map<string, SeasonRow>();
  for (const r of rows) if (r.year === year && r.opinions >= cfg.minOpinions) { const b = best.get(r.family); if (!b || r.opinions > b.opinions) best.set(r.family, r); }
  return [...best.values()].map(r => r.id);
}

/** "By your match" on the home: the band, then loved, then the match %. Rows without a match go last. */
export function bandOrder(a: { id: string; pos: number }, b: { id: string; pos: number }, pct: Map<string, number | null>, band = HOME_ORDER.band) {
  const pa = pct.get(a.id) ?? -1, pb = pct.get(b.id) ?? -1;
  return Math.floor(pb / band) - Math.floor(pa / band) || b.pos - a.pos || pb - pa;
}
