import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// SkinRecs, approved by the owner (2026-11-14). Sephora sorts skincare by Normal, Dry, Combination and Oily; Ulta Beauty
// at Target adds Sensitive and Acne-prone. A product goes in every type its maker names. "All skin types" goes in the
// four basic types (as Sephora tags it) but not in Sensitive or Acne-prone, which need the maker to say so.
const skinType: SpecFilter = {
  id: "skin", label: "Skin type",
  groups: [{ key: "normal", label: "Normal" }, { key: "dry", label: "Dry" }, { key: "combination", label: "Combination" }, { key: "oily", label: "Oily" }, { key: "sensitive", label: "Sensitive" }, { key: "acne", label: "Acne-prone" }],
  classify: p => {
    const s = text(p.surface); if (!s) return [];
    const all = has(s, /all skin types/i);
    const out: string[] = [];
    if (all || has(s, /normal/i)) out.push("normal");
    if (all || has(s, /dry/i)) out.push("dry");
    if (all || has(s, /combination|combo/i)) out.push("combination");
    if (all || has(s, /oily/i)) out.push("oily");
    if (has(s, /sensitiv/i)) out.push("sensitive");
    // "post-acne marks" is about scarring, not acne-prone skin.
    if (has(s, /(?<!post-)acne|blemish|breakout/i)) out.push("acne");
    return out;
  },
};

export default [skinType];
