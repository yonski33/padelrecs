// The racket guide (/guide, owner 2026-11-16, Claude Design mock Mc3i2eFFXPUgzLDQvfQTT8): a shared template whose sections
// come from a per-niche `guide` config (lib/niche/<niche>-guide.ts). Every number on the page comes from the catalogue, never
// from the config: an option's count is the catalogue list its link opens (lib/catalog-filter.ts catalogView), and "most-liked"
// is the top Player score among that option's rows (one per model, newest year), shown only with 3+ rated rackets.
import type { CatalogRow, CatalogFilters } from "./catalog-filter";
import { catalogView } from "./catalog-filter";

/** Shape class from the spec ("Teardrop", "Diamond (oversized)"); other shapes count as hybrid, like the catalogue's filter. */
export const shapeWord = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return /diamond/.test(x) ? "diamond" : /round/.test(x) ? "round" : /tear|drop/.test(x) ? "teardrop" : x ? "hybrid" : null; };

export const BALANCES = ["low", "medium", "high"] as const;
/** Low / medium / high from the spec ("Medium-high (~25.4 cm)", "High (272 mm)", "270 mm"). A word wins; a lone length decides
 *  otherwise (under 255 mm low, over 265 mm high). "Medium-high" counts as high and "Low/Medium" as medium. */
export function balanceOf(spec: string | null | undefined): (typeof BALANCES)[number] | null {
  const x = (spec ?? "").toLowerCase();
  if (!x) return null;
  if (/medium[- ]?high/.test(x)) return "high";
  if (/low\s*\/\s*medium/.test(x)) return "medium";
  if (/\bhigh\b|head-heavy/.test(x)) return "high";
  if (/\blow\b|head-light/.test(x)) return "low";
  if (/medium|even|neutral|balanced/.test(x)) return "medium";
  const mm = /(\d{2,3}(?:\.\d)?)\s*(mm|cm)/.exec(x);
  if (mm) { const v = Number(mm[1]) * (mm[2] === "cm" ? 10 : 1); return v < 255 ? "low" : v > 265 ? "high" : "medium"; }
  return null;
}

export const FACES = ["fibreglass", "mixed", "carbon"] as const;
/** Face material from the spec (padel stores it as `surface`: "3K carbon", "Fiberglass", "Fibrix (fiberglass + carbon)"). */
export function faceOf(spec: string | null | undefined): (typeof FACES)[number] | null {
  const x = (spec ?? "").toLowerCase();
  if (!x) return null;
  const glass = /fib(er|re)?|glass/.test(x), carbon = /carbon|\d+k\b|tricarbon/.test(x);
  return glass && carbon ? "mixed" : glass ? "fibreglass" : carbon ? "carbon" : null;
}

/** A guide option: one card / band / end of a scale. `value` is the catalogue filter value; text-only sections have none. */
export type GuideOption = { value?: string; label: string; text: string; best?: string; kicker?: string; big?: string; note?: string;
  /** "Most-liked <liked> racket"; defaults to the label in lower case. */ liked?: string; accent?: boolean };
export type GuideFilter = "shape" | "feel" | "balance" | "weight" | "face";
export type GuideSection = { id: string; title: string; sub: string;
  /** The mock's layouts. */ layout: "cards" | "scale" | "meter" | "bands" | "split";
  /** The catalogue filter behind the counts; none: a text-only section. */ filter?: GuideFilter;
  options: GuideOption[]; rule?: string;
  /** Text-only sections say why there are no counts. */ textOnlyNote?: string;
  /** Whether "most-liked" shows (one line, for the option the config names; default the option with the most rows). */ liked?: string | false };
export type GuidePlayer = { label: string; desc: string; picks: { style?: string; level?: string; arm?: boolean } };
export type GuideConfig = {
  title: string; description: string; h1: [string, string]; intro: string;
  tldr: GuidePlayer[]; sections: GuideSection[];
  /** "Players are happiest with a round or teardrop": the two shapes with the highest share of positive reviews, worked out. */
  buys?: { kicker: string; tail?: { unlessTop: string; text: string } };
  /** A real player's words (verbatim, checked against the report at render) and the reports that say the same. */
  overheard?: { kicker: string; reportId: string; words: string; who: string; similar: string[]; lesson: string };
  cta: { title: string; text: string; button: string };
};

/** One option's count and catalogue link (the list it opens). */
export function optionCount(rows: CatalogRow[], filter: GuideFilter, value: string, suitsOk: number) {
  return catalogView(rows, { [filter]: value } as CatalogFilters, suitsOk).shown.length;
}
/** The option's top Player score among its default-view rows (one per model, newest year), with 3+ rated rackets. */
export function mostLiked(rows: CatalogRow[], filter: GuideFilter, value: string, suitsOk: number, min = 3): CatalogRow | null {
  const rated = catalogView(rows, { [filter]: value } as CatalogFilters, suitsOk).shown.filter(x => x.signal !== null);
  if (rated.length < min) return null;
  return [...rated].sort((a, b) => (b.signal ?? 0) - (a.signal ?? 0) || b.judged - a.judged)[0];
}
/** Positive share by shape over the default-view rows' judged reviews: the two happiest shapes and the reviews counted. */
export function happiestShapes(rows: CatalogRow[], pos: Map<string, number>): { top: string[]; reviews: number } {
  const by = new Map<string, { p: number; n: number }>();
  for (const x of rows) { if (!x.newest || !x.shape) continue; const b = by.get(x.shape) ?? { p: 0, n: 0 }; b.p += pos.get(x.id) ?? 0; b.n += x.judged; by.set(x.shape, b); }
  const top = [...by].filter(([, b]) => b.n >= 50).sort((a, b) => b[1].p / b[1].n - a[1].p / a[1].n).slice(0, 2).map(([k]) => k);
  return { top, reviews: [...by.values()].reduce((a, b) => a + b.n, 0) };
}
