import type { SpecFilter } from "./types";
import { has, range, text } from "./parse";

// PadelRecs, approved by the owner (2026-11-14). Makers sell rackets by weight range ("360–375 g", "365–375 g"), so the
// groups follow those ranges and each racket goes in its best fit: by the low end of its range, single weights to the
// nearest group.
const weight: SpecFilter = {
  id: "weight", label: "Weight",
  groups: [{ key: "light", label: "Up to 360 g" }, { key: "355-375", label: "355–375 g" }, { key: "360-375", label: "360–375 g" }, { key: "365-375", label: "365–375 g" }, { key: "370", label: "370 g+" }],
  classify: p => {
    const r = range(text(p.weight)); if (!r) return [];
    const [lo, hi] = r;
    if (lo === hi) return [lo < 360 ? "light" : lo < 365 ? "360-375" : lo < 370 ? "365-375" : "370"];
    if (lo < 350 || hi <= 360) return ["light"];
    if (lo < 360) return ["355-375"];
    if (lo < 365) return ["360-375"];
    if (lo < 370) return ["365-375"];
    return ["370"];
  },
};

// Carbon faces (3K, 12K, 18K, UD…) or fiberglass; a face that names carbon counts as carbon.
const surface: SpecFilter = {
  id: "face", label: "Face",
  groups: [{ key: "carbon", label: "Carbon" }, { key: "fiberglass", label: "Fiberglass" }],
  classify: p => { const s = text(p.surface); return has(s, /carbon|\d+k\b/i) ? ["carbon"] : has(s, /glass|fibre|fiber|fibrix/i) ? ["fiberglass"] : []; },
};

export default [weight, surface];
