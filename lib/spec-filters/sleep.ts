import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// SleepRecs, approved by the owner (2026-11-14). Firmness follows the industry 1–10 scale (Sleep Foundation: soft ~3,
// medium-soft 4, medium 5, medium-firm 6–7, firm 8+). A maker's own word beats its number ("Medium (5–6/10)" is Medium),
// and a bare number uses the scale. A mattress sold in several firmnesses goes in each one the buyer can order.
function firmnessOf(part: string): string | null {
  const w = part.replace(/\(.*?\)/g, "");
  if (has(w, /medium[- ]?(soft|plush)|supportive plush/i)) return "msoft";
  if (has(w, /medium[- ]?firm|luxury firm|gentle firm|relaxed firm/i)) return "mfirm";
  if (has(w, /firm/i)) return "firm"; // Firm, Firmer, Extra Firm, Ultra-Firm
  if (has(w, /soft|plush/i)) return "soft"; // Soft, Softer, Extra-Soft, Plush, Ultra Plush
  if (has(w, /medium/i)) return "medium"; // Medium, Medium Hybrid
  const n = part.match(/(\d+)(?:\s*[–-]\s*\d+)?\s*\/\s*10/); if (!n) return null;
  const v = Number(n[1]);
  return v <= 3 ? "soft" : v === 4 ? "msoft" : v === 5 ? "medium" : v <= 7 ? "mfirm" : "firm";
}
const firmness: SpecFilter = {
  id: "firmness", label: "Firmness", categories: ["Mattress", "Mattress topper"],
  groups: [{ key: "soft", label: "Soft / plush" }, { key: "msoft", label: "Medium-soft" }, { key: "medium", label: "Medium" }, { key: "mfirm", label: "Medium-firm" }, { key: "firm", label: "Firm" }, { key: "adjustable", label: "Adjustable" }],
  classify: p => {
    const s = text(p.weight); if (!s) return [];
    if (has(s, /sleep number|settings|adjustable/i)) return ["adjustable"];
    return [...new Set(s.split(",").map(firmnessOf).filter((k): k is string => !!k))];
  },
};

// Mattress Firm sorts mattresses as innerspring, foam and hybrid; latex is its own type at other retailers. "Latex
// hybrid" (latex comfort layers over coils) is in both Hybrid and Latex. "Memory foam" and "Foam" are one group, as
// retailers sell "all-foam".
const build: SpecFilter = {
  id: "build", label: "Mattress type", categories: ["Mattress", "Mattress topper"],
  groups: [{ key: "hybrid", label: "Hybrid" }, { key: "foam", label: "Foam" }, { key: "latex", label: "Latex" }, { key: "innerspring", label: "Innerspring" }, { key: "air", label: "Adjustable air" }],
  classify: p => {
    const s = text(p.core); const out: string[] = [];
    if (has(s, /hybrid/i)) out.push("hybrid");
    if (has(s, /foam/i)) out.push("foam");
    if (has(s, /latex/i)) out.push("latex");
    if (has(s, /innerspring/i)) out.push("innerspring");
    if (has(s, /\bair\b/i)) out.push("air");
    return out;
  },
};

// Pillow makers sell by fill. Down and down alternative share a group: two down pillows are too few for their own.
const pillow: SpecFilter = {
  id: "fill", label: "Pillow fill", categories: ["Pillow"],
  groups: [{ key: "adjustable", label: "Adjustable fill" }, { key: "foam", label: "Memory foam" }, { key: "latex", label: "Latex" }, { key: "down", label: "Down or down alternative" }],
  classify: p => {
    const s = text(p.core);
    return has(s, /adjustable/i) ? ["adjustable"] : has(s, /^(memory )?foam$/i) ? ["foam"] : has(s, /latex/i) ? ["latex"] : has(s, /^down/i) ? ["down"] : [];
  },
};

// Sheets are sold by weave or fibre (percale vs sateen, linen, bamboo or Tencel lyocell); duvets and comforters by fill.
// Knit and flannel are too few for a group.
const bedding: SpecFilter = {
  id: "fabric", label: "Fabric or fill", categories: ["Sheets & bedding"],
  groups: [{ key: "sateen", label: "Sateen" }, { key: "percale", label: "Percale" }, { key: "linen", label: "Linen" }, { key: "bamboo", label: "Bamboo / Tencel" }, { key: "down", label: "Down or down-alternative fill" }],
  classify: p => {
    const s = text(p.core);
    return has(s, /sateen/i) ? ["sateen"] : has(s, /percale/i) ? ["percale"] : has(s, /linen/i) ? ["linen"] : has(s, /bamboo|tencel/i) ? ["bamboo"] : has(s, /down|eucalyptus fill/i) ? ["down"] : [];
  },
};

export default [firmness, build, pillow, bedding];
