// Attribute kinds (ENGINE-PLAN.md §2C, owner 2026-11-15, SkinRecs first): a site profile whose filters are not padel's
// control / power / level. Every product gets a 0–100 score per attribute, stored or computed from the evidence store, and the
// profile says what kind each one is:
//   suits   — how well it works FOR a group ("good for dry skin"), scored only from what members of that group report;
//   quality — how much of something it has ("hydrating", "gentle");
//   axis    — a pair of opposites as one slider (texture light ↔ rich); a product sits at one point on it;
//   fact    — a yes/no or value from the specs or ingredients (fragrance-free, SPF, price band); a hard filter, not a score.
// `appliesTo` limits an attribute to some product types; outside them the product shows n/a, never a score.
// Racket sites keep lib/fit-config.ts; this is the layer for sites whose picks are groups and sliders. Pure data.
import type { Niche } from "./niche/types";

export type AttrKind = "suits" | "quality" | "axis" | "fact";
export type AttrDef = {
  key: string; label: string; kind: AttrKind;
  /** Product types (niche shapes) it applies to; omitted = all. */ appliesTo?: string[];
  /** quality / axis: quick tags that push it up (+) or down (−), with their weight (strength 0.5 / 1 / 1.5). For an axis, + is
   *  towards the second end. */ plus?: [string, 0.5 | 1 | 1.5][]; minus?: [string, 0.5 | 1 | 1.5][];
  /** axis: the two ends, low first ("light", "rich"). */ ends?: [string, string];
  /** quality: complaints can drop it below the middle (the owner's "2 only for the most complained-about" rule). */ complaint?: boolean;
  /** suits: the quality or axis that stands in, at low weight, while few members of the group have reported (dry skin leans
   *  on hydration, sensitive on gentle). The axis end that suits the group: +1 the second end, −1 the first. */ prior?: { attr: string; sign: 1 | -1 };
  /** The words for a score band, best first (≥80, ≥65, ≥45, ≥30, below). */ words?: [string, string, string, string, string];
};
export type AttrProfile = {
  attrs: AttrDef[];
  /** The groups a writer can belong to (suits attributes), with the words that state membership. */
  groups: { key: string; label: string; display: string }[];
  /** Fewer group members than this: no suits score ("not enough reports yet"). */ minGroup: number;
  /** Fewer mentions than this on an axis: no position. */ minAxis: number;
  /** The visitor's picks on quick match: how much each part weighs. */
  weights: { group: number; concerns: number; feel: number; score: number };
  /** Group keys that are "concerns" (ticked on top of the skin type), not the main type. */ concerns: string[];
};

const SKIN: AttrProfile = {
  groups: [
    { key: "dry", label: "Dry", display: "dry skin" }, { key: "oily", label: "Oily", display: "oily skin" },
    { key: "combination", label: "Combination", display: "combination skin" }, { key: "normal", label: "Normal", display: "normal skin" },
    { key: "sensitive", label: "Sensitive", display: "sensitive skin" }, { key: "acne", label: "Acne-prone", display: "acne-prone skin" },
  ],
  concerns: ["sensitive", "acne"],
  minGroup: 3, minAxis: 3,
  weights: { group: 0.4, concerns: 0.3, feel: 0.2, score: 0.1 },
  attrs: [
    { key: "suits_dry", label: "Dry skin", kind: "suits", prior: { attr: "hydration", sign: 1 } },
    { key: "suits_oily", label: "Oily skin", kind: "suits", prior: { attr: "texture", sign: -1 } },
    { key: "suits_combination", label: "Combination skin", kind: "suits" },
    { key: "suits_normal", label: "Normal skin", kind: "suits" },
    { key: "suits_sensitive", label: "Sensitive skin", kind: "suits", prior: { attr: "gentle", sign: 1 } },
    { key: "suits_acne", label: "Acne-prone skin", kind: "suits", prior: { attr: "breakouts", sign: 1 } },
    { key: "hydration", label: "Hydration", kind: "quality", appliesTo: ["Moisturizer", "Serum", "Toner", "Sunscreen", "Eye cream", "Balm & ointment", "Mask", "Cleanser"],
      plus: [["hydrating", 1]], words: ["very hydrating", "hydrating", "some hydration", "light on hydration", "can feel drying"] },
    { key: "gentle", label: "Gentle", kind: "quality", complaint: true, plus: [["gentle", 1]], minus: [["irritating", 1], ["stinging", 1], ["strong scent", 0.5]],
      words: ["very gentle", "gentle", "usually fine", "can irritate", "often irritates"] },
    // Not shown as a bar (not in the approved list): the stand-in for acne-prone skin while few acne-prone writers have reported.
    { key: "breakouts", label: "Breakouts", kind: "quality", complaint: true, plus: [["cleared breakouts", 1]], minus: [["broke me out", 1]] },
    { key: "finish", label: "Finish", kind: "axis", ends: ["matte", "dewy"], appliesTo: ["Moisturizer", "Sunscreen", "Serum"] },
    { key: "texture", label: "Texture", kind: "axis", ends: ["light", "rich"], appliesTo: ["Moisturizer", "Sunscreen", "Serum", "Toner", "Eye cream", "Balm & ointment", "Treatment"],
      plus: [["rich texture", 1], ["greasy", 0.5]], minus: [["lightweight", 1], ["absorbs quickly", 0.5]] },
    { key: "fragrance_free", label: "Fragrance-free", kind: "fact" },
    { key: "spf", label: "SPF", kind: "fact", appliesTo: ["Sunscreen"] },
    { key: "price", label: "Price", kind: "fact" },
  ],
};

const PROFILES: Record<string, AttrProfile> = { skin: SKIN };
/** The site's attribute profile, or undefined for sites on lib/fit-config.ts (rackets) or the older pages. */
export const attrProfileFor = (n: Pick<Niche, "id">): AttrProfile | undefined => PROFILES[n.id];
export const applies = (a: AttrDef, shape: string | null | undefined) => !a.appliesTo || (!!shape && a.appliesTo.includes(shape));

/** The writer's own skin type as stated in a report or our summary of it ("I have very oily skin", "Has combination,
 *  acne-prone skin", "my rosacea"). Generic advice ("great for oily skin") and negations ("doesn't have sensitive skin") don't
 *  count. Returns each group with the exact words it rests on. */
export function statedGroups(text: string): { group: string; quote: string }[] {
  const out = new Map<string, string>();
  const TYPE = "(?:very |super |extremely |really |quite |slightly |a bit |naturally |normal[- ]to[- ])?(?:dry|oily|combination|combo|sensitive|acne[- ]prone|normal|dehydrated)";
  const LIST = `${TYPE}(?:(?:,\\s*|\\s+and\\s+|\\s*/\\s*|\\s+)${TYPE}){0,3}`;
  const owner = "(?:\\bI have|\\bI've got|\\bI've|\\bhas|\\bhave|\\bwith|\\bmy|\\btheir|\\bher|\\bhis|\\bon my|\\bon their|\\bon her|\\bfor my|\\bfor their|\\bfor her)";
  const res = [
    new RegExp(`${owner}\\s+(?:own\\s+)?(${LIST})\\s+skin\\b`, "gi"),
    new RegExp(`\\bmy (?:skin|face) is (?:very |super |extremely |really |quite |pretty )?(dry|oily|sensitive|combination|acne[- ]prone)\\b`, "gi"),
    new RegExp(`\\b(?:I(?:'m| am)|as) (?:an? )?(?:very |super )?(oily|dry|sensitive)[- ]skinned\\b`, "gi"),
    new RegExp(`(?:\\bI have|\\bhas|\\bhave|\\bwith|\\bmy|\\btheir|\\bher|\\bhis)\\s+(?:mild\\s+|severe\\s+)?(rosacea|eczema|perioral dermatitis|cystic acne|hormonal acne)\\b`, "gi"),
  ];
  for (const re of res) for (const m of text.matchAll(re)) {
    const before = text.slice(Math.max(0, m.index! - 24), m.index!);
    if (/\b(not|no|never|don'?t|doesn'?t|didn'?t|isn'?t|without)\s*$|n['’]t\s*$/i.test(before) || /\b(not|don'?t|doesn'?t)\b[^.]{0,12}$/i.test(before)) continue;
    const words = m[1].toLowerCase();
    const found = (g: string) => { if (!out.has(g)) out.set(g, m[0].trim()); };
    if (/\bdry\b/.test(words)) found("dry");
    if (/\boily\b/.test(words)) found("oily");
    if (/combination|combo/.test(words)) found("combination");
    if (/sensitive|rosacea|eczema|dermatitis/.test(words)) found("sensitive");
    if (/acne/.test(words)) found("acne");
    if (/^normal$|\bnormal skin/.test(words) && !/normal[- ]to/.test(words)) found("normal");
  }
  return [...out].map(([group, quote]) => ({ group, quote }));
}

/** The fragrance fact from the catalog's fragrance column: "free" only when nothing scented is listed; a brand's
 *  "fragrance-free" with essential oils is "oils" (owner OK 2026-11-15). */
export function fragranceFact(s: string | null | undefined): "free" | "oils" | "fragrance" | null {
  const x = (s ?? "").toLowerCase();
  if (!x) return null;
  if (/essential oils?|\boil\b|\boils\b|tea tree|lemongrass|vetiver|orange|lavender|bergamot|eucalyptus|geranium|ylang|citrus|peel/.test(x)) return /fragrance \(|parfum/.test(x) && !/free/.test(x) ? "fragrance" : "oils";
  if (/fragrance[- ]free|unscented|no fragrance|without fragrance/.test(x) && !/contains fragrance|parfum\)/.test(x)) return "free";
  if (/fragrance|parfum|scent/.test(x)) return "fragrance";
  return null;
}
/** SPF from the product name or size column ("SPF 50+", "SPF30"). */
export function spfOf(...texts: (string | null | undefined)[]): number | null {
  for (const t of texts) { const m = (t ?? "").match(/\bSPF\s*(\d{2,3})/i); if (m) return Number(m[1]); }
  return null;
}
