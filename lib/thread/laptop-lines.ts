// LaptopRecs' model lines (owner 2026-11-24). Every laptop has a line, a generation order and a release year
// (db/catalogs/laptop-lines.json: slug -> [line, generation, year]; renamed successors such as XPS 14 -> Dell 14 Premium share
// their predecessor's line). Lists show current models only:
//   - a line's newest ready 2026 model;
//   - a ready 2025 model only when its line has no ready 2026 model;
//   - nothing from 2024 or older, even when the line has nothing newer.
// Only READY models take part (owner 2026-11-24: thin pages stay unlisted and unlinked until they have real content, see
// LAPTOP_READY): the slot goes to the newest ready 2026 model, else the newest ready 2025 one. Older models keep their pages
// as reference, with a "Newer version" link to the line's current model. Pure, so tests feed plain inputs.
import table from "../../db/catalogs/laptop-lines.json";

export type LineTable = Record<string, [string, number, number]>;
export const LAPTOP_LINES = table as unknown as LineTable;
/** The year lists show, and the one year before it that may stand in for a line with nothing newer. */
export const CURRENT_YEAR = 2026;

/** When a laptop page has enough real content to list and link: 3+ creator reviews or a written TL;DR, plus 3+ owner votes
 *  (the loved / mixed / not for me opinions the page shows). Not-ready models keep their page but are never listed, linked or
 *  put in the sitemap (no noindex, owner rule). */
export const LAPTOP_READY = { creatorReviews: 3, votes: 3 };
export type Readiness = { creator: number; tldr: boolean; votes: number };
export const laptopReady = (x: Readiness, cfg = LAPTOP_READY) => (x.creator >= cfg.creatorReviews || x.tldr) && x.votes >= cfg.votes;

export type LineItem = { id: string; slug: string; ready: boolean };
/** `current`: the ready id that stands for each line in every list; `newer`: an older model's slug (ready or not) -> its line's
 *  current slug, so a link only ever points at a ready page (none when the line has no current model);
 *  `standIns`: lines shown by a model from the year before (no CURRENT_YEAR successor yet). A laptop missing from the table
 *  is a line of its own with no known year, so it never lists until it is added. */
export function laptopLines(items: LineItem[], lines: LineTable = LAPTOP_LINES, year = CURRENT_YEAR) {
  const by = new Map<string, { x: LineItem; gen: number; year: number }[]>();
  for (const x of items) { const e = lines[x.slug]; if (!e) continue; const l = by.get(e[0]) ?? []; l.push({ x, gen: e[1], year: e[2] }); by.set(e[0], l); }
  const current = new Set<string>(), newer = new Map<string, string>(), standIns: { line: string; slug: string }[] = [];
  const older = (a: { year: number; gen: number }, b: { year: number; gen: number }) => a.year < b.year || (a.year === b.year && a.gen < b.gen);
  for (const [line, l] of by) {
    // Newest ready first: release year, then generation.
    const top = l.filter(e => e.x.ready).sort((a, b) => b.year - a.year || b.gen - a.gen)[0];
    if (!top || top.year < year - 1) continue;
    current.add(top.x.id); if (top.year < year) standIns.push({ line, slug: top.x.slug });
    for (const e of l) if (older(e, top)) newer.set(e.x.slug, top.x.slug);
  }
  return { current, newer, standIns };
}
