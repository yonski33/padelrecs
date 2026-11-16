// The SkinRecs product page's own words (owner 2026-11-16): a 2–3 sentence bottom line and "Why yes / Why not" items written
// per product from our evidence, in the expert voice (lib/voice.ts): a statement of what the product does and for whom, never
// "N users said". Same shape as padel's db/racket-page (lib/racket-page.ts) without the tagline; a Why not item may carry a
// tip or a try-instead product (another slug in the catalog). Every item, tip and try-instead lists its reports (`src`, review
// ids), at least 2 distinct (tests/skin-page.test.ts). Products under FEW_VOICES reports get no entry ("few reports so far").
import skin from "../db/racket-page/skin.json";
import type { SkinChoice } from "./skin-choice";

export type SkinTag = "dry" | "oily" | "combination" | "normal" | "sensitive" | "acne" | "hydrate" | "calm" | "clear" | "matte" | "dewy" | "light" | "rich";
export type SkinItem = { title: string; /** One line; the key phrase sits between == marks. */ t: string; src: string[];
  /** The picks this item matters for: they earn the "for your skin" tag. */ for?: SkinTag[];
  tip?: { t: string; src: string[] }; alt?: { slug: string; t: string; src: string[] } };
/** `source: "research"`: written from published reviews and INCI lists for a product with few reports (sources are URLs). */
export type SkinPage = { bottom: string; yes: SkinItem[]; no: SkinItem[]; source?: "research" };
export const RESEARCH_PROOF = "from published reviews & ingredient lists";

const PAGES = skin as Record<string, SkinPage>;
export const skinPage = (slug: string): SkinPage | null => PAGES[slug] ?? null;
export const skinPages = () => PAGES;

/** The visitor's picks as item tags: skin type, reacts easily, the goal, finish and texture. */
export function skinTags(c: SkinChoice): SkinTag[] {
  return [c.skin, c.concerns.includes("sensitive") ? "sensitive" : null, c.concerns.includes("acne") || c.goal === "clear" ? "acne" : null,
    c.goal && c.goal !== "daily" ? c.goal : null, c.finish, c.tex].filter((x): x is SkinTag => !!x);
}

/** Up to `max` items whose tags meet the picks, the skin type and reactive skin weighing most, the author's order breaking ties. */
const W: Partial<Record<SkinTag, number>> = { dry: 3, oily: 3, combination: 3, normal: 3, sensitive: 3, acne: 2 };
export function skinMatters(items: SkinItem[], picks: SkinTag[], max = 2): Set<string> {
  const score = (it: SkinItem) => (it.for ?? []).reduce((a, t) => a + (picks.includes(t) ? W[t] ?? 1 : 0), 0);
  return new Set(items.map((it, i) => ({ it, i, s: score(it) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, max).map(x => x.it.title));
}

/** "from forums, YouTube & blogs": the kinds of source behind an item, no counts. */
const KIND: Record<string, string> = { Reddit: "forums", Forum: "forums", YouTube: "YouTube", Blog: "blogs", SkinRecs: "SkinRecs reviews" };
export function sourceKinds(src: string[], platformOf: (id: string) => string | undefined): string {
  const kinds = [...new Set(src.map(id => KIND[platformOf(id) ?? ""] ?? "reviews"))];
  const order = ["forums", "YouTube", "blogs", "SkinRecs reviews", "reviews"];
  kinds.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return `from ${kinds.length > 1 ? `${kinds.slice(0, -1).join(", ")} & ${kinds.at(-1)}` : kinds[0]}`;
}

/** Splits a line at its == marks into before, highlighted and after. */
export function splitMark(t: string): { pre: string; hl: string; post: string } {
  const [pre = "", hl = "", ...rest] = t.split("==");
  return { pre, hl, post: rest.join("") };
}
