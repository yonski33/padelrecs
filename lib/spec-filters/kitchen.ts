import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// KitchenRecs, approved by the owner (2026-11-14). Each style filter shows inside its own category and splits it the way
// buyers choose there: air fryers by single vs dual basket (Cosori), blenders by full-size vs personal (RTINGS), stand
// mixers by tilt-head vs bowl-lift (KitchenAid's own split), multicookers by pressure cooker vs multicooker. Values are
// the maker type names in `balance`.
const airFryer: SpecFilter = {
  id: "fryer", label: "Air fryer style", categories: ["Air fryer"],
  groups: [{ key: "single", label: "Single basket" }, { key: "dual", label: "Dual basket" }],
  classify: p => { const s = text(p.balance); return has(s, /dual/i) ? ["dual"] : has(s, /basket|glass/i) ? ["single"] : []; },
};

// "Full-size blender with personal cups" does both jobs, so it is in both. A "Kitchen system" (blender jar plus food
// processor bowl) and a commercial blender are full-size.
const blender: SpecFilter = {
  id: "blender", label: "Blender style", categories: ["Blender"],
  groups: [{ key: "full", label: "Full-size" }, { key: "personal", label: "Personal / portable" }],
  classify: p => {
    const s = text(p.balance); const out: string[] = [];
    if (has(s, /full-size|high-speed|kitchen system|commercial/i)) out.push("full");
    if (has(s, /personal|portable/i)) out.push("personal");
    return out;
  },
};

// The heated "Cooking stand mixer" is neither.
const mixer: SpecFilter = {
  id: "mixer", label: "Stand mixer style", categories: ["Stand mixer"],
  groups: [{ key: "tilt", label: "Tilt-head" }, { key: "bowl", label: "Bowl-lift" }],
  classify: p => { const s = text(p.balance); return has(s, /tilt-head/i) ? ["tilt"] : has(s, /bowl-lift/i) ? ["bowl"] : []; },
};

// "Pressure cooker and air fryer" is sold as a pressure cooker with an air-fry lid.
const multicooker: SpecFilter = {
  id: "cooker", label: "Multicooker style", categories: ["Multicooker"],
  groups: [{ key: "pressure", label: "Pressure cooker" }, { key: "multi", label: "Multicooker" }],
  classify: p => { const s = text(p.balance); return has(s, /pressure/i) ? ["pressure"] : has(s, /multicooker/i) ? ["multi"] : []; },
};

export default [airFryer, blender, mixer, multicooker];
