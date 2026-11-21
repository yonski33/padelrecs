// PadelRecs racket page "Similar rackets" (owner bug 2026-11-21: one old racket in a half column). Pure, so tests feed plain
// specs. The page's data (app/thread/racket-data.ts) builds the candidates; the page drops the ones Often compared with shows.

export type SimSpec = {
  id: string; family: string; year: number; shape: string | null; feel: string | null; balance: string | null;
  levels: string[]; style: "control" | "power" | "balance" | null;
  /** Review-tag similarity to the racket, 0 to 1 (lib/similar.ts tagSimilarity). */ tags: number;
  /** Loved + mixed + not for me. */ votes: number;
};

const same = (a: string | null, b: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** How close `x` is to `self`: what reviewers say most, then shape and style, then feel, balance and level overlap, and a
 *  small nudge for rackets with more opinions. */
export function closeness(self: SimSpec, x: SimSpec): number {
  const lv = new Set([...self.levels, ...x.levels]), both = self.levels.filter(l => x.levels.includes(l)).length;
  return 3 * x.tags + (same(self.shape, x.shape) ? 1.5 : 0) + (self.style && self.style === x.style ? 1.5 : 0)
    + (same(self.feel, x.feel) ? 1 : 0) + (same(self.balance, x.balance) ? 0.75 : 0) + (lv.size ? both / lv.size : 0)
    + 0.5 * Math.min(1, x.votes / 30);
}

/** Up to `n` similar rackets, closest first: never the racket itself, its own model, anything in `exclude` (Often compared
 *  with), or a model's older year when a newer one is listed. Current models only (the newest catalog year and the one
 *  before); older years only fill up to `min` when too few current ones exist. */
export function pickSimilar(self: SimSpec, all: SimSpec[], exclude: Set<string>, n = 4, min = 3): string[] {
  const newest = new Map<string, number>();
  for (const x of all) newest.set(x.family, Math.max(newest.get(x.family) ?? 0, x.year));
  const top = Math.max(0, ...all.map(x => x.year));
  const pool = all.filter(x => x.id !== self.id && x.family !== self.family && !exclude.has(x.id) && x.year === newest.get(x.family))
    .map(x => ({ x, c: closeness(self, x) })).sort((a, b) => b.c - a.c || b.x.votes - a.x.votes || a.x.id.localeCompare(b.x.id))
    .filter((p, i, a) => a.findIndex(q => q.x.family === p.x.family) === i); // one per model
  const fresh = pool.filter(p => !top || p.x.year >= top - 1), old = pool.filter(p => top && p.x.year < top - 1);
  const out = fresh.slice(0, n);
  for (const p of old) { if (out.length >= min) break; out.push(p); }
  return out.map(p => p.x.id);
}
