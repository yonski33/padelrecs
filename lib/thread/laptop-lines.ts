// LaptopRecs' model lines (owner 2026-11-24: "show only the latest generation of each line"). Every laptop has a line and a
// generation order (db/catalogs/laptop-lines.json: slug -> [line, generation], read from names and slugs; renames across
// names are not guessed). The home and the rankings show the newest model of each line that can show yet; older models
// keep their pages, with a "Newer version" link. Pure, so tests feed plain inputs.
import table from "../../db/catalogs/laptop-lines.json";

export type LineTable = Record<string, [string, number]>;
export const LAPTOP_LINES = table as unknown as LineTable;
/** A model can stand for its line once it has a creator page (3+ creator reviews) or 3+ owner and web opinions. */
export const MIN_TO_SHOW = 3;

export type LineItem = { id: string; slug: string; opinions: number; creator: number };
const showable = (x: LineItem) => x.creator >= MIN_TO_SHOW || x.opinions >= MIN_TO_SHOW;

/** Per line: the newest model (`newest`) and the one the lists show (`shown`: the newest that can show, else none).
 *  `current`: the shown model's id per line; `newer`: an older model's slug -> the newest model's slug in its line;
 *  `fallback`: lines whose newest model can't show yet, with the one shown instead. A laptop missing from the table is a
 *  line of its own. */
export function laptopLines(items: LineItem[], lines: LineTable = LAPTOP_LINES) {
  const by = new Map<string, { x: LineItem; gen: number }[]>();
  for (const x of items) { const [line, gen] = lines[x.slug] ?? [`slug:${x.slug}`, 0]; const l = by.get(line) ?? []; l.push({ x, gen }); by.set(line, l); }
  const current = new Set<string>(), newer = new Map<string, string>(), fallback: { line: string; newest: string; shown: string | null }[] = [];
  for (const [line, l] of by) {
    // Newest first; a tie on generation keeps the catalogue order.
    const sorted = [...l].sort((a, b) => b.gen - a.gen), newest = sorted[0];
    const shown = sorted.find(e => showable(e.x)) ?? null;
    if (shown) current.add(shown.x.id);
    if (shown !== newest && l.length > 1) fallback.push({ line, newest: newest.x.slug, shown: shown?.x.slug ?? null });
    for (const e of sorted) if (e.gen < newest.gen) newer.set(e.x.slug, newest.x.slug);
  }
  return { current, newer, fallback };
}
