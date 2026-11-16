// The racket page's own words (owner's final mock, 2026-11-15): a tagline under the name, a one-sentence bottom line and the
// "Why yes / Why not" items, written per racket from our evidence like the fit card (lib/fit-card.ts). One story: the
// tagline and bottom line lead with the side the match engine puts the racket on. Every item lists its reports (`src`, ids;
// "other-slug:id" for another racket's page), and its evidence line counts them.
import padel from "../db/racket-page/padel.json";
import pickleball from "../db/racket-page/pickleball.json";
import discgolf from "../db/racket-page/discgolf.json";
import { niche } from "./niche";
import type { CardContent, CardTag } from "./fit-card";

export type PageItem = { title: string; /** One line; the key phrase sits between == marks. */ t: string; src: string[];
  /** Who it matters for (lib/fit-card.ts CardTag): picks that earn the "matters for you" tag. */ for?: string[];
  /** The evidence line, {n} = the number of reports ("the #1 complaint, {n} players"); default "{n} players mention it". */ ev?: string };
export type PageContent = { tagline: string; bottom: string; yes: PageItem[]; no: PageItem[];
  /** "research" (owner 2026-11-16): written from published reviews and specs for a product with under 4 player reports; `src`
   *  holds source URLs, and the page shows no player counts or Player score for it ("Based on published reviews and specs"). */
  source?: "research" };
/** The page's quiet proof line for research content, in place of player counts and the Player score. */
export const RESEARCH_LINE = "Based on published reviews and specs";

const SITES: Record<string, Record<string, PageContent>> = { padel: padel as Record<string, PageContent>, pickleball: pickleball as Record<string, PageContent>,
  discgolf: discgolf as Record<string, PageContent> };

export function pageContent(slug: string, site = niche.id): PageContent | null {
  return SITES[site]?.[slug] ?? null;
}

/** The fewest reports an evidence line may show (owner rule, all sites, 2026-11-16): under this the item still shows but its
 *  "N players mention it" line (and any special line with a count) is left out. Copy guide: QUICK-TAKE-RECIPE.md, "Counts". */
export const MIN_COUNT_SHOWN = 5;

/** "19 players mention it": the item's evidence line from its own report count, in the site's word for people ("users" on
 *  SkinRecs); null under MIN_COUNT_SHOWN. */
export function evidenceLine(item: PageItem, many = niche.people.many): string | null {
  const n = new Set(item.src).size;
  if (n < MIN_COUNT_SHOWN) return null;
  return (item.ev ?? `{n} ${many} mention it`).replace("{n}", String(n));
}

/** Splits a line at its == marks: [plain, highlighted, plain, …]. */
export function marked(t: string): { text: string; mark: boolean }[] {
  return t.split("==").map((text, i) => ({ text, mark: i % 2 === 1 })).filter(x => x.text);
}

/** Content tiers (owner 2026-11-15, revised: evidence quality, not report count; "meaningful 4 reports from long in-depth
 *  YouTube" can carry an entry). Full: 3+ items a side (3 show, the rest under "+N more"); short: fewer, 1–2 a side shown with
 *  "based on N reports"; no entry: none of it. Every item needs 2+ distinct sources (tests/fit-card.test.ts). */
export type PageTier = "full" | "short";
export const pageTier = (c: PageContent | null): PageTier | null => !c ? null : c.yes.length >= 3 && c.no.length >= 3 ? "full" : "short";
/** How many items a side the short tier shows. */
export const SHORT_ITEMS = 2;

/** Engine axis cut-offs for the style chip and copy: below CONTROL a control racket, above POWER a power racket, else all-round. */
export const AXIS_CONTROL = 0.42, AXIS_POWER = 0.58;

/** How many items show before "+N more". */
export const SHOWN_ITEMS = 3;

/** "matters for you": up to 2 items per column whose tags meet the visitor's picks (owner's final mock); a sore arm first, then
 *  the style, then the level (the fit card's order, lib/fit-card.ts), the author's order breaking ties. */
const W: Record<string, number> = { arm: 4, control: 3, balance: 3, power: 3, spin: 3, beginner: 2, intermediate: 2, advanced: 2 };
export function mattersFor(items: PageItem[], picks: string[], max = 2): Set<string> {
  const score = (it: PageItem) => (it.for ?? []).reduce((a, t) => a + (picks.includes(t) ? W[t] ?? 1 : 0), 0);
  return new Set(items.map((it, i) => ({ it, i, s: score(it) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, max).map(x => x.it.title));
}

/** A racket's page items as fit-card lines (lib/fit-card.ts): "Title: line", the == marks dropped, the same tags and sources. */
export function cardFromPage(c: PageContent): CardContent {
  const line = (it: PageItem) => ({ t: `${it.title}: ${it.t.replace(/==/g, "").replace(/^./, x => x.toLowerCase())}`.replace(/\.$/, "") + ".",
    for: (it.for ?? []) as CardTag[], only: it.for?.length === 1 && it.for[0] === "arm" ? ["arm" as CardTag] : undefined, src: it.src });
  return { strengths: c.yes.map(line), catches: c.no.map(line) };
}
