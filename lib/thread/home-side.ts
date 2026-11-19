// The Thread home sidebar's "Latest from the comments" (owner 2026-11-19), replacing "Fresh off the court", which repeated
// the Latest player reviews list. Pure, so tests feed plain rows.
//   - The 3 newest approved comments and replies on racket pages (questions too), whose racket the site still lists.
//   - Fewer than 3: the rest are "Busy this week", the rackets with the most new votes and reviews in the last 7 days,
//     each with its count, and never one already shown above. Both empty: no block.

export const SIDE_SIZE = 3, BUSY_DAYS = 7;
export type SideComment = { id: string; page: string; alias: string; body: string; at: string };
export type SideItem =
  | { kind: "comment"; id: string; racketId: string; alias: string; body: string; at: string }
  | { kind: "busy"; racketId: string; n: number };

/** The racket id in a comment's page key ("racket:<id>"), or null for ranking and guide pages. */
export const racketOf = (page: string) => page.startsWith("racket:") ? page.slice("racket:".length) || null : null;

/** The block's items, newest comments first, then the busiest rackets to make up 3. `known` says a racket can be shown, as
 *  a comment's page or as a busy one. */
export function sideItems(comments: SideComment[], busy: Map<string, number>, known: (racketId: string, kind: SideItem["kind"]) => boolean, size = SIDE_SIZE): SideItem[] {
  const out: SideItem[] = [...comments].sort((a, b) => b.at.localeCompare(a.at)).flatMap(c => {
    const racketId = racketOf(c.page);
    return racketId && known(racketId, "comment") && c.body.trim() ? [{ kind: "comment" as const, id: c.id, racketId, alias: c.alias, body: c.body.trim(), at: c.at }] : [];
  }).slice(0, size);
  const shown = new Set(out.map(x => x.racketId));
  const fill = [...busy].filter(([id, n]) => n > 0 && known(id, "busy") && !shown.has(id)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [racketId, n] of fill) { if (out.length >= size) break; out.push({ kind: "busy", racketId, n }); }
  return out;
}

/** Add one source's per-racket counts (new reviews, quick votes, trait votes) into the week's total. */
export function addCounts(into: Map<string, number>, rows: { racketId: string; n: number | string }[]) {
  for (const r of rows) into.set(r.racketId, (into.get(r.racketId) ?? 0) + Number(r.n));
  return into;
}
