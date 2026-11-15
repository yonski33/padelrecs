// The racket page's own words (owner's final mock, 2026-11-15): a tagline under the name, a one-sentence bottom line and the
// "Why yes / Why not" items, written per racket from our evidence like the fit card (lib/fit-card.ts). One story: the
// tagline and bottom line lead with the side the match engine puts the racket on. Every item lists its reports (`src`, ids;
// "other-slug:id" for another racket's page), and its evidence line counts them.
import padel from "../db/racket-page/padel.json";
import { niche } from "./niche";

export type PageItem = { title: string; /** One line; the key phrase sits between == marks. */ t: string; src: string[];
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

/** How many items show before "+N more". */
export const SHOWN_ITEMS = 3;
