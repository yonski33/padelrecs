// SkinRecs' rankings by skin need and product type (owner 2026-11-21: "split lists per category"; the mixed lists made
// little sense with cleansers, sunscreens and creams in one top 10). Each skin need keeps its old address as a hub page that
// links to its per-type lists. The core set (owner pick): moisturizers, cleansers, sunscreens and serums for each need, plus
// acne treatments. Pure, so tests and the pages share it.

export type SkinNeed = {
  key: "sensitive" | "acne" | "dry" | "oily";
  /** The old mixed list's address, now the need's hub page. */ hub: string;
  /** "sensitive skin", "acne". */ words: string;
  /** The rankings hub's group heading. */ group: string;
  /** The hub card's line under each type. */ blurb: string;
  /** The skin engine's pick for this need (lib/skin-choice.ts readSkinChoice query). */ q: Record<string, string>;
  /** The curated rating's label and the attribute score behind it (lib/attr-profile.ts). */ rating: string; attr: string;
};
export const SKIN_NEEDS: SkinNeed[] = [
  { key: "sensitive", hub: "best-skincare-for-sensitive-skin", words: "sensitive skin", group: "For sensitive skin", blurb: "Gentle picks that rarely sting.",
    q: { sens: "1" }, rating: "Sensitive skin rating", attr: "suits_sensitive" },
  { key: "acne", hub: "best-skincare-for-acne", words: "acne", group: "For acne", blurb: "Kind to breakout-prone skin.",
    q: { acne: "1" }, rating: "Acne rating", attr: "suits_acne" },
  { key: "dry", hub: "best-skincare-for-dry-skin", words: "dry skin", group: "For dry skin", blurb: "Comfort and repair for a dry barrier.",
    q: { skin: "dry" }, rating: "Dry skin rating", attr: "suits_dry" },
  { key: "oily", hub: "best-skincare-for-oily-skin", words: "oily skin", group: "For oily skin", blurb: "Light, non-greasy picks.",
    q: { skin: "oily" }, rating: "Oily skin rating", attr: "suits_oily" },
];
/** The product types every need gets (lib/niche/skin.ts typePages slugs), in card order. */
export const SKIN_SPLIT_TYPES = ["moisturizers", "cleansers", "sunscreens", "serums"] as const;
/** Extra types for one need only. */
const EXTRA: Partial<Record<SkinNeed["key"], string[]>> = { acne: ["treatments"] };

export type SkinSplit = { slug: string; need: SkinNeed; type: string; /** "Moisturizers" */ short: string; /** "Moisturizers for sensitive skin" */ label: string; /** "Best moisturizers for sensitive skin" */ title: string };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** Every per-type list, need by need. `typeLabel` maps a type slug to its label ("serums" → "Serums"). */
export function skinSplits(typeLabel: (type: string) => string = cap): SkinSplit[] {
  return SKIN_NEEDS.flatMap(need => [...SKIN_SPLIT_TYPES, ...(EXTRA[need.key] ?? [])].map(type => {
    const short = typeLabel(type), many = short.toLowerCase();
    // "Acne treatments" reads better than "Treatments for acne".
    if (need.key === "acne" && type === "treatments") return { slug: "best-acne-treatments", need, type, short, label: "Acne treatments", title: "Best acne treatments" };
    return { slug: `best-${type}-for-${need.words.replace(/ /g, "-")}`, need, type, short, label: `${short} for ${need.words}`, title: `Best ${many} for ${need.words}` };
  }));
}
