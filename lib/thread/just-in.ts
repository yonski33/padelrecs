// PadelRecs home "2027 rackets just in" (owner mock 2026-11-21): the newest model year that has at least JUST_IN_MIN
// rackets with a real photo, its most recently added ones first. Pure, so the tests see exactly what the home shows.

export const JUST_IN_MIN = 3;
/** Under this many opinions a card adds "Played with it? Be one of the first". */
export const JUST_IN_THIN = 10;

type Row = { id: string; year: number; pic: string | null; current?: boolean };

/** The year and its first `n` rackets (newest added first), or null when no year has JUST_IN_MIN photographed rackets.
 *  `added`: each racket's catalogue created_at. Older years of a model (current === false) never show. */
export function justIn<T extends Row>(rows: T[], added: Record<string, string>, n = JUST_IN_MIN): { year: number; rows: T[] } | null {
  const ok = rows.filter(r => !!r.pic && r.current !== false && r.year > 0);
  const years = [...new Set(ok.map(r => r.year))].sort((a, b) => b - a);
  for (const year of years) {
    const pool = ok.filter(r => r.year === year);
    if (pool.length < JUST_IN_MIN) continue;
    return { year, rows: [...pool].sort((a, b) => (added[b.id] ?? "").localeCompare(added[a.id] ?? "")).slice(0, n) };
  }
  return null;
}
