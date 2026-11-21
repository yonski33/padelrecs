// PadelRecs home "Top rackets right now" (owner 2026-11-21): this season's models only and player opinions count.
//   - Pool: the season's year only (the same rule as Best overall, lib/thread/vote-order.ts "loved"), 10+ opinions, one row per
//     model (the one with the most opinions). Older years and 2027 previews with a handful of reviews stay in the catalogue.
//   - No picks: most loved first.
//   - By your match: 10-point match bands (90+, 80-89, ...), most loved first inside a band, then the higher match. A racket
//     never jumps a band, so a 73% never sits above an 82%; inside a band players' opinions decide.
// Pure, so tests feed plain rows. The catalogue (/rackets) keeps its full list (current models, "Show older"); since
// 2026-11-21 it sorts the same way (Most loved by default, the bands and want order below).

export const HOME_ORDER = { minOpinions: 10, band: 10 };

export type SeasonRow = { id: string; family: string; year: number; opinions: number };
/** The home's pool: the season's year, the opinion floor, one row per model. */
export function seasonIds(rows: SeasonRow[], year: number, cfg = HOME_ORDER): string[] {
  const best = new Map<string, SeasonRow>();
  for (const r of rows) if (r.year === year && r.opinions >= cfg.minOpinions) { const b = best.get(r.family); if (!b || r.opinions > b.opinions) best.set(r.family, r); }
  return [...best.values()].map(r => r.id);
}

// "I want" picks follow players' trait votes (owner 2026-11-21: with Power picked, Fenix Pro's 63 power votes should lead), on
// the home and the catalogue alike.
//   - A trait counts only where it leads the racket's "How does it play?" group (as on Best for power / control), so a row's
//     pill never says "Most picked for power" for a racket players mostly call all-round.
//   - Want pick alone (no level, no Arm comfort): that trait's votes, 10+ to rank by them; the rest follow by match.
//   - Anything else with a match: the 10-point bands; inside a band the trait's votes (5+, the pill's floor) when a want pick
//     is set, then Arm comfort votes when it's ticked, then loved.
export const WANT_ORDER = { rankMin: 10, pillMin: 5 };
/** "balance" is the "all-round play" answer. */
export const WANT_TRAIT: Record<string, string> = { power: "power", control: "control", balance: "all_round" };
export const WANT_WORDS: Record<string, string> = { power: "power", control: "control", all_round: "all-round play" };
/** The trait's votes when it leads the group and reaches `min`, else 0. */
export function leadVotes(group: Record<string, number> | undefined, trait: string, min: number): number {
  const v = group?.[trait] ?? 0;
  return v >= min && Object.entries(group ?? {}).every(([k, n]) => k === trait || v > n) ? v : 0;
}
export type WantRow = { id: string; pos: number };
export type WantCtx = { pct: Map<string, number | null>; trait: string | null; level: boolean; arm: boolean;
  plays: Record<string, Record<string, number>>; armVotes: Record<string, number> };
/** The match sort for these picks. */
export function wantOrder(a: WantRow, b: WantRow, c: WantCtx, band = HOME_ORDER.band): number {
  const pa = c.pct.get(a.id) ?? -1, pb = c.pct.get(b.id) ?? -1;
  if (c.trait && !c.level && !c.arm) return leadVotes(c.plays[b.id], c.trait, WANT_ORDER.rankMin) - leadVotes(c.plays[a.id], c.trait, WANT_ORDER.rankMin) || pb - pa || b.pos - a.pos;
  return Math.floor(pb / band) - Math.floor(pa / band)
    || (c.trait ? leadVotes(c.plays[b.id], c.trait, WANT_ORDER.pillMin) - leadVotes(c.plays[a.id], c.trait, WANT_ORDER.pillMin) : 0)
    || (c.arm ? (c.armVotes[b.id] ?? 0) - (c.armVotes[a.id] ?? 0) : 0)
    || b.pos - a.pos || pb - pa;
}
/** The row's pill while a want pick is set: "Most picked for power · 63 players", or null (keep the usual pill). */
export function wantPill(group: Record<string, number> | undefined, trait: string): string | null {
  const n = leadVotes(group, trait, WANT_ORDER.pillMin);
  return n ? `Most picked for ${WANT_WORDS[trait]} · ${n} players` : null;
}
