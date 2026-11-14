import type { SpecFilter } from "./types";
import { text } from "./parse";

// FragranceRecs, approved by the owner (2026-11-14). Sephora shops fragrance by four families (Floral, Warm & Spicy,
// Earthy & Woody, Fresh), which match Michael Edwards' wheel (Floral, Amber/Oriental, Woody, Fresh). Maker labels lead
// with the main family, so each fragrance goes in the family of its first named family word: "Woody Floral" is Woody,
// "Floral Woody" is Floral. Sephora's subfamilies decide the modifiers: "Fresh Floral", "Fruity Floral" and "Warm Floral"
// are Floral, "Warm Woods" is Woody. Fougère, aromatic, citrus and aquatic are Fresh; leather and chypre are Woody.
const family: Record<string, string> = {
  floral: "floral", rose: "floral",
  woody: "woody", woods: "woody", wood: "woody", earthy: "woody", leather: "woody", leathery: "woody", chypre: "woody", oud: "woody", mineral: "woody",
  warm: "warm", spicy: "warm", spice: "warm", spices: "warm", oriental: "warm", amber: "warm", ambery: "warm", gourmand: "warm", vanilla: "warm", sweet: "warm",
  fresh: "fresh", aromatic: "fresh", aquatic: "fresh", aquatics: "fresh", marine: "fresh", citrus: "fresh", green: "fresh", "fougère": "fresh", fougere: "fresh", fruity: "fresh",
};
const scent: SpecFilter = {
  id: "family", label: "Scent family",
  groups: [{ key: "floral", label: "Floral" }, { key: "warm", label: "Warm & Spicy" }, { key: "woody", label: "Woody & Earthy" }, { key: "fresh", label: "Fresh" }],
  classify: p => {
    const words = (text(p.surface).toLowerCase().match(/[a-zè]+/g) ?? []).filter(w => family[w]);
    if (!words.length) return []; // "Musky" alone names no family
    const [first, next] = words;
    // Modifiers that lead into a floral (Fresh/Fruity/Warm Floral) or a wood (Warm & Woody) name a subfamily of that.
    if (["fresh", "fruity", "warm"].includes(first) && next && family[next] === "floral") return ["floral"];
    if (first === "warm" && next && family[next] === "woody") return ["woody"];
    return [family[first]];
  },
};

export default [scent];
