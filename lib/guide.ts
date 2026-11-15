// The racket guide (/guide, owner 2026-11-16, Claude Design mock Mc3i2eFFXPUgzLDQvfQTT8): one template for every site ("the
// same guide page with the same vibe for the other sites as well"), its sections from a per-niche `guide` config
// (lib/niche/<niche>-guide.ts; the shape is in lib/niche/GUIDE.md). Every number on the page comes from the catalogue, never
// from the config: an option's count is the catalogue list its link opens (lib/catalog-filter.ts catalogView), and
// "most-liked" is the top Player score among that option's rows (one per model, newest year), shown only with 3+ rated.
import type { CatalogRow, CatalogFilters, CatalogKey, SpecGroup } from "./catalog-filter";
import { catalogView } from "./catalog-filter";
import type { SpecColumn } from "./niche/types";
/** Shape class from the spec ("Teardrop", "Diamond (oversized)"); other shapes count as hybrid, like the catalogue's filter. */
export const shapeWord = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return /diamond/.test(x) ? "diamond" : /round/.test(x) ? "round" : /tear|drop/.test(x) ? "teardrop" : x ? "hybrid" : null; };

// Spec classifiers a niche's guide config can use for its spec filters (`spec.classify`). Padel's; add a niche's own beside it.
export const BALANCES = ["low", "medium", "high"] as const;
/** Padel: low / medium / high from the spec ("Medium-high (~25.4 cm)", "High (272 mm)", "270 mm"). A word wins; a lone length decides
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
/** Padel: face material from the spec (padel stores it as `surface`: "3K carbon", "Fiberglass", "Fibrix (fiberglass + carbon)"). */
export function faceOf(spec: string | null | undefined): (typeof FACES)[number] | null {
  const x = (spec ?? "").toLowerCase();
  if (!x) return null;
  const glass = /fib(er|re)?|glass/.test(x), carbon = /carbon|\d+k\b|tricarbon/.test(x);
  return glass && carbon ? "mixed" : glass ? "fibreglass" : carbon ? "carbon" : null;
}

/** A guide option: one card / toggle / column / end of a scale. `value` is the catalogue filter value; text-only sections
 *  leave it out. */
export type GuideOption = {
  value?: string; label: string;
  /** The one-liner. */ text: string;
  /** "best for: …" (cards; also the home row's line). */ best?: string;
  /** A small line above the label (toggles: "Live at the net?"). */ kicker?: string;
  /** The big number (numbers: "<355g", "€100–200"). */ big?: string;
  /** A small highlight after the label (dark-split: "3K–18K"). */ note?: string;
  /** An icon from app/guide/guide-icon.tsx (cards). */ icon?: string;
  /** "Most-liked <liked> racket"; defaults to the label in lower case. */ liked?: string;
  /** The highlighted option (mint / cream / dotted / dark, by layout). */ accent?: boolean;
};
/** The built-in catalogue fields a section can count by (lib/catalog-filter.ts CATALOG_KEYS). */
export type GuideFilter = Exclude<CatalogKey, "year">;
/** A spec filter: a catalogue field the niche adds from one spec column, sorted by `classify` into the options' values. It
 *  also shows on the catalogue under "more filters" with `label`. */
export type GuideSpec = { key: string; label: string; column: SpecColumn; classify: (spec: string | null | undefined) => string | null };
export type GuideSection = {
  /** The anchor (#balance) and chip. */ id: string; title: string;
  /** The small line after the title ("where the weight sits"). */ sub: string;
  /** The section kind: a cards row, a slider scale, toggle cards, big-number columns, a split pair (the accent dotted) or a
   *  dark split (the accent dark). */ layout: "cards" | "scale" | "toggles" | "numbers" | "split" | "dark-split";
  /** What the counts, links and "most-liked" use: a built-in catalogue field, or `spec`. Neither: a text-only section. */
  filter?: GuideFilter; spec?: GuideSpec;
  options: GuideOption[];
  /** A "rule of thumb" line. */ rule?: string;
  /** Text-only sections say why there are no counts. */ textOnlyNote?: string;
  /** "Most-liked" for this option value (default: the option with the most rows); false hides it. */ liked?: string | false;
};
export type GuidePlayer = { label: string; desc: string; picks: { style?: string; level?: string; arm?: boolean } };
export type GuideConfig = {
  /** The <title>, meta description and nav word ("guide"). */ title: string; description: string; nav?: string;
  /** The breadcrumb's last step ("racket guide"). */ crumb: string;
  /** The h1 before and inside the highlight. */ h1: [string, string]; intro: string;
  /** The tl;dr personas, each linking to the quick match with its picks. */ tldr: GuidePlayer[];
  sections: GuideSection[];
  /** "Players are happiest with a hybrid or diamond": the section (id) whose two options with the highest share of
   *  positive reviews are named, and an optional tail dropped when `unlessTop` is one of them. */
  buys?: { section: string; kicker: string; tail?: { unlessTop: string; text: string } };
  /** A real player's words (verbatim, checked against the report at render) and the reports that say the same. */
  overheard?: { kicker: string; reportId: string; words: string; who: string; similar: string[]; lesson: string };
  cta: { title: string; text: string; button: string };
  /** The home's row under the list: one section's options as tiles, then a link to the guide. */
  home?: { section: string; title: string; link: string };
};

/** The section's catalogue key: the built-in field or the spec filter's. */
export const keyOf = (s: GuideSection) => s.filter ?? s.spec?.key ?? null;
/** The niche's spec filters, for the catalogue (rows, filter groups, addresses). */
export function specGroups(g: GuideConfig | undefined): SpecGroup[] {
  return (g?.sections ?? []).flatMap(s => s.spec ? [{ key: s.spec.key, label: s.spec.label, values: s.options.flatMap(o => o.value ? [o.value] : []) }] : []);
}
/** A row's spec filter values, from its spec columns. */
export function specValues(g: GuideConfig | undefined, specs: Partial<Record<SpecColumn, string | null>>) {
  return Object.fromEntries((g?.sections ?? []).flatMap(s => s.spec ? [[s.spec.key, s.spec.classify(specs[s.spec.column])]] : []));
}

/** One option's count: the length of the catalogue list its link opens. */
export function optionCount(rows: CatalogRow[], key: string, value: string, suitsOk: number, spec: readonly SpecGroup[] = []) {
  return catalogView(rows, { [key]: value } as CatalogFilters, suitsOk, spec).shown.length;
}
/** The option's top Player score among its default-view rows (one per model, newest year), with 3+ rated rackets. */
export function mostLiked(rows: CatalogRow[], key: string, value: string, suitsOk: number, spec: readonly SpecGroup[] = [], min = 3): CatalogRow | null {
  const rated = catalogView(rows, { [key]: value } as CatalogFilters, suitsOk, spec).shown.filter(x => x.signal !== null);
  if (rated.length < min) return null;
  return [...rated].sort((a, b) => (b.signal ?? 0) - (a.signal ?? 0) || b.judged - a.judged)[0];
}
/** A row's value for a section's key. */
export const rowValue = (x: CatalogRow, key: string) => (key in x ? (x as unknown as Record<string, unknown>)[key] : x.spec?.[key]) as string | null | undefined;
/** Positive share per option over the default-view rows' judged reviews (options with 50+): the two happiest values, and
 *  the reviews counted. */
export function happiest(rows: CatalogRow[], key: string, pos: Map<string, number>): { top: string[]; reviews: number } {
  const by = new Map<string, { p: number; n: number }>();
  for (const x of rows) { const v = rowValue(x, key); if (!x.newest || !v) continue; const b = by.get(v) ?? { p: 0, n: 0 }; b.p += pos.get(x.id) ?? 0; b.n += x.judged; by.set(v, b); }
  const top = [...by].filter(([, b]) => b.n >= 50).sort((a, b) => b[1].p / b[1].n - a[1].p / a[1].n).slice(0, 2).map(([k]) => k);
  return { top, reviews: [...by.values()].reduce((a, b) => a + b.n, 0) };
}
