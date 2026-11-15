// The racket page's own words (owner's final mock, 2026-11-15): a tagline under the name, a one-sentence bottom line and the
// "Why yes / Why not" items, written per racket from our evidence like the fit card (lib/fit-card.ts). One story: the
// tagline and bottom line lead with the side the match engine puts the racket on. Every item lists its reports (`src`, ids;
// "other-slug:id" for another racket's page), and its evidence line counts them.
import padel from "../db/racket-page/padel.json";
import { niche } from "./niche";

export type PageItem = { title: string; /** One line; the key phrase sits between == marks. */ t: string; src: string[];
  /** Who it matters for (lib/fit-card.ts CardTag): picks that earn the "matters for you" tag. */ for?: string[];
  /** The evidence line, {n} = the number of reports ("the #1 complaint, {n} players"); default "{n} players mention it". */ ev?: string };
export type PageContent = { tagline: string; bottom: string; yes: PageItem[]; no: PageItem[] };

const SITES: Record<string, Record<string, PageContent>> = { padel: padel as Record<string, PageContent> };

export function pageContent(slug: string, site = niche.id): PageContent | null {
  return SITES[site]?.[slug] ?? null;
}

/** "19 players mention it": the item's evidence line from its own report count. */
export function evidenceLine(item: PageItem, many = "players") {
  const n = new Set(item.src).size;
  return (item.ev ?? `{n} ${many} mention it`).replace("{n}", String(n));
}

/** Splits a line at its == marks: [plain, highlighted, plain, …]. */
export function marked(t: string): { text: string; mark: boolean }[] {
  return t.split("==").map((text, i) => ({ text, mark: i % 2 === 1 })).filter(x => x.text);
}

/** Content tiers (owner 2026-11-15, counted on the racket's own reports): 10+ the full version (bottom line, 3 items a side
 *  and "+N more"); 6–9 a short one (bottom line, 1–2 items a side, "based on N reports"); under 6 none of it shows. */
export const PAGE_FULL = 10, PAGE_SHORT = 6;
export type PageTier = "full" | "short";
export const pageTier = (reports: number): PageTier | null => reports >= PAGE_FULL ? "full" : reports >= PAGE_SHORT ? "short" : null;
/** How many items a side the short tier shows. */
export const SHORT_ITEMS = 2;

/** Engine axis cut-offs for the style chip and copy: below CONTROL a control racket, above POWER a power racket, else all-round. */
export const AXIS_CONTROL = 0.42, AXIS_POWER = 0.58;

/** How many items show before "+N more". */
export const SHOWN_ITEMS = 3;

/** "matters for you": up to 2 items per column whose tags meet the visitor's picks (owner's final mock); a sore arm first, then
 *  the style, then the level (the fit card's order, lib/fit-card.ts), the author's order breaking ties. */
const W: Record<string, number> = { arm: 4, control: 3, balance: 3, power: 3, beginner: 2, intermediate: 2, advanced: 2 };
export function mattersFor(items: PageItem[], picks: string[], max = 2): Set<string> {
  const score = (it: PageItem) => (it.for ?? []).reduce((a, t) => a + (picks.includes(t) ? W[t] ?? 1 : 0), 0);
  return new Set(items.map((it, i) => ({ it, i, s: score(it) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, max).map(x => x.it.title));
}
